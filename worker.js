/**
 * SONIX BACKEND — Cloudflare Worker
 * ================================================================
 * Handles: email/password signup+login, Google Sign-In, password
 * reset (via email), and syncing conversations to a real database
 * (D1) instead of only the browser's local storage.
 *
 * SETUP (see the deployment guide for full step-by-step details):
 *   1. Create a D1 database, run schema.sql against it, bind it to
 *      this Worker as "DB" (wrangler.jsonc or the dashboard).
 *   2. Set these secrets on the Worker (Settings -> Variables ->
 *      encrypt as secret), NOT as plain vars:
 *        - RESEND_API_KEY      (from resend.com, for sending email)
 *        - GOOGLE_CLIENT_ID    (from Google Cloud Console OAuth)
 *        - JWT_SIGNING_SECRET  (any long random string you make up)
 *   3. Set ALLOWED_ORIGIN as a plain variable = your app's URL,
 *      e.g. "https://sonix-ai.pages.dev" (no trailing slash).
 *   4. Update FROM_EMAIL below to an address verified in Resend.
 * ================================================================
 */

const FROM_EMAIL = 'SONIX <onboarding@resend.dev>'; // Works immediately, no domain verification needed —
// BUT can only deliver to the email address on your own Resend account until you verify a domain.
// To send to real users, verify a domain at resend.com/domains, then change this to
// something like 'SONIX <noreply@yourdomain.com>'.

// ---------- Small helpers ----------

function corsHeaders(env) {
    return {
        'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

function json(data, status, env) {
    return new Response(JSON.stringify(data), {
        status: status || 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
    });
}

function uuid() { return crypto.randomUUID(); }

function base64UrlToBytes(b64url) {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64url.length + 3) % 4);
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}
function bytesToBase64Url(bytes) {
    let bin = '';
    bytes.forEach(b => bin += String.fromCharCode(b));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------- Password hashing (PBKDF2 via Web Crypto — no external libs needed) ----------

async function hashPassword(password, saltB64) {
    const salt = saltB64 ? base64UrlToBytes(saltB64) : crypto.getRandomValues(new Uint8Array(16));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
    );
    return { hash: bytesToBase64Url(new Uint8Array(bits)), salt: bytesToBase64Url(salt) };
}

async function verifyPassword(password, storedHash, storedSalt) {
    const { hash } = await hashPassword(password, storedSalt);
    return hash === storedHash;
}

// ---------- Sessions ----------

async function createSession(env, userId) {
    const token = uuid() + uuid(); // long random token
    const now = Date.now();
    const expires = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    await env.DB.prepare(
        'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(token, userId, now, expires).run();
    return token;
}

async function getUserFromRequest(request, env) {
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return null;
    const row = await env.DB.prepare(
        'SELECT s.user_id, s.expires_at, u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?'
    ).bind(token).first();
    if (!row) return null;
    if (row.expires_at < Date.now()) return null;
    return { id: row.id, email: row.email, name: row.name };
}

// ---------- Google ID token verification (real JWT signature check, not the throttled dev-only endpoint) ----------

let _googleKeysCache = null, _googleKeysCacheAt = 0;
async function getGooglePublicKeys() {
    if (_googleKeysCache && Date.now() - _googleKeysCacheAt < 3600 * 1000) return _googleKeysCache;
    const res = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    const data = await res.json();
    _googleKeysCache = data.keys;
    _googleKeysCacheAt = Date.now();
    return data.keys;
}

async function verifyGoogleIdToken(idToken, expectedClientId) {
    const parts = idToken.split('.');
    if (parts.length !== 3) throw new Error('Malformed token');
    const [headerB64, payloadB64, sigB64] = parts;
    const header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(headerB64)));
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)));

    const keys = await getGooglePublicKeys();
    const jwk = keys.find(k => k.kid === header.kid);
    if (!jwk) throw new Error('Signing key not found — Google may have rotated keys, try again');

    const cryptoKey = await crypto.subtle.importKey(
        'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
    );
    const signedData = new TextEncoder().encode(headerB64 + '.' + payloadB64);
    const signature = base64UrlToBytes(sigB64);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, signedData);
    if (!valid) throw new Error('Invalid token signature');

    if (payload.aud !== expectedClientId) throw new Error('Token was not issued for this app');
    if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') throw new Error('Wrong issuer');
    if (payload.exp * 1000 < Date.now()) throw new Error('Token expired');

    return { sub: payload.sub, email: payload.email, name: payload.name || payload.email };
}

// ---------- Email sending (via Resend — free tier, simple REST API) ----------

async function sendEmail(env, to, subject, html) {
    if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error('Email send failed: ' + errText);
    }
}

// ---------- Route handlers ----------

async function handleSignup(request, env) {
    const { email, password, name } = await request.json();
    if (!email || !password) return json({ error: 'Email and password are required.' }, 400, env);

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return json({ error: 'An account with this email already exists.' }, 409, env);

    const { hash, salt } = await hashPassword(password);
    const id = uuid();
    await env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, password_salt, name, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, email, hash, salt, name || email.split('@')[0], Date.now()).run();

    const token = await createSession(env, id);
    return json({ token, user: { id, email, name: name || email.split('@')[0] } }, 200, env);
}

async function handleLogin(request, env) {
    const { email, password } = await request.json();
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user || !user.password_hash) return json({ error: 'Invalid email or password.' }, 401, env);

    const ok = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!ok) return json({ error: 'Invalid email or password.' }, 401, env);

    const token = await createSession(env, user.id);
    const settings = user.settings_json ? JSON.parse(user.settings_json) : {};
    return json({ token, user: { id: user.id, email: user.email, name: user.name, twoFA: settings.twoFA || { enabled: false } } }, 200, env);
}

async function handleGoogleAuth(request, env) {
    const { id_token } = await request.json();
    if (!id_token) return json({ error: 'Missing id_token.' }, 400, env);
    if (!env.GOOGLE_CLIENT_ID) return json({ error: 'Google Sign-In is not configured on the server yet.' }, 500, env);

    let profile;
    try {
        profile = await verifyGoogleIdToken(id_token, env.GOOGLE_CLIENT_ID);
    } catch (e) {
        return json({ error: 'Google sign-in failed: ' + e.message }, 401, env);
    }

    let user = await env.DB.prepare('SELECT * FROM users WHERE google_sub = ? OR email = ?')
        .bind(profile.sub, profile.email).first();

    if (!user) {
        const id = uuid();
        await env.DB.prepare(
            'INSERT INTO users (id, email, google_sub, name, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(id, profile.email, profile.sub, profile.name, Date.now()).run();
        user = { id, email: profile.email, name: profile.name };
    } else if (!user.google_sub) {
        // Existing email/password account — link it to this Google account too
        await env.DB.prepare('UPDATE users SET google_sub = ? WHERE id = ?').bind(profile.sub, user.id).run();
    }

    const token = await createSession(env, user.id);
    const settingsRow = await env.DB.prepare('SELECT settings_json FROM users WHERE id = ?').bind(user.id).first();
    const settings = settingsRow && settingsRow.settings_json ? JSON.parse(settingsRow.settings_json) : {};
    return json({ token, user: { id: user.id, email: user.email, name: user.name, twoFA: settings.twoFA || { enabled: false } } }, 200, env);
}

async function handleResetRequest(request, env) {
    const { email } = await request.json();
    const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    // Always respond success even if not found, so this can't be used to check which emails have accounts
    if (!user) return json({ ok: true }, 200, env);

    const token = uuid();
    const now = Date.now();
    await env.DB.prepare(
        'INSERT INTO password_resets (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(token, user.id, now, now + 60 * 60 * 1000).run(); // 1 hour expiry

    const resetLink = (env.ALLOWED_ORIGIN || '') + '/app.html?reset=' + token;
    try {
        await sendEmail(env, email, 'Reset your SONIX password',
            `<p>Someone requested a password reset for this account.</p>` +
            `<p><a href="${resetLink}">Click here to reset your password</a> (expires in 1 hour).</p>` +
            `<p>If this wasn't you, you can safely ignore this email.</p>`
        );
    } catch (e) {
        return json({ error: 'Could not send email: ' + e.message }, 500, env);
    }
    return json({ ok: true }, 200, env);
}

async function handleResetConfirm(request, env) {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) return json({ error: 'Missing token or new password.' }, 400, env);

    const row = await env.DB.prepare('SELECT * FROM password_resets WHERE token = ?').bind(token).first();
    if (!row || row.expires_at < Date.now()) return json({ error: 'Reset link is invalid or expired.' }, 400, env);

    const { hash, salt } = await hashPassword(newPassword);
    await env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?')
        .bind(hash, salt, row.user_id).run();
    await env.DB.prepare('DELETE FROM password_resets WHERE token = ?').bind(token).run();

    return json({ ok: true }, 200, env);
}

async function handleChangePassword(request, env) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) return json({ error: 'Missing current or new password.' }, 400, env);
    if (newPassword.length < 6) return json({ error: 'New password must be 6+ characters.' }, 400, env);

    const row = await env.DB.prepare('SELECT password_hash, password_salt FROM users WHERE id = ?').bind(user.id).first();
    if (!row || !row.password_hash) return json({ error: 'This account has no password set (it may only use Google Sign-In).' }, 400, env);

    const ok = await verifyPassword(currentPassword, row.password_hash, row.password_salt);
    if (!ok) return json({ error: 'Current password is incorrect.' }, 401, env);

    const { hash, salt } = await hashPassword(newPassword);
    await env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').bind(hash, salt, user.id).run();
    return json({ ok: true }, 200, env);
}

async function handleMe(request, env) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    return json({ user }, 200, env);
}

async function handleDeleteAccount(request, env) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    await env.DB.prepare('DELETE FROM conversations WHERE user_id = ?').bind(user.id).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
    await env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(user.id).run();
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();
    return json({ ok: true }, 200, env);
}

async function handleGetConversations(request, env) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    const { results } = await env.DB.prepare(
        'SELECT id, messages_json FROM conversations WHERE user_id = ? ORDER BY updated_at DESC'
    ).bind(user.id).all();
    // messages_json actually stores the FULL session object (id, name, messages,
    // flags like _favorite/_archived/_deleted, etc) — "messages_json" is just the
    // column name from the original schema, kept as-is to avoid a migration.
    const sessions = results.map(r => JSON.parse(r.messages_json));
    return json({ sessions }, 200, env);
}

async function handleSaveConversation(request, env) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    const session = await request.json();
    if (!session.id) return json({ error: 'Missing session id.' }, 400, env);
    const now = Date.now();
    await env.DB.prepare(
        `INSERT INTO conversations (id, user_id, name, messages_json, updated_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, messages_json = excluded.messages_json, updated_at = excluded.updated_at`
    ).bind(session.id, user.id, session.name || 'Untitled', JSON.stringify(session), now).run();
    return json({ id: session.id, updatedAt: now }, 200, env);
}

// Syncs the whole local sessions array in one call — this is what the
// frontend actually uses day-to-day (simpler than tracking exactly which
// one session changed after every edit/delete/favorite toggle).
async function handleBulkSaveConversations(request, env) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    const { sessions } = await request.json();
    if (!Array.isArray(sessions)) return json({ error: 'Expected a sessions array.' }, 400, env);
    const now = Date.now();
    const statements = sessions.map(session =>
        env.DB.prepare(
            `INSERT INTO conversations (id, user_id, name, messages_json, updated_at) VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET name = excluded.name, messages_json = excluded.messages_json, updated_at = excluded.updated_at`
        ).bind(session.id, user.id, session.name || 'Untitled', JSON.stringify(session), now)
    );
    if (statements.length) await env.DB.batch(statements);
    return json({ ok: true, count: statements.length }, 200, env);
}

async function handleGetSettings(request, env) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    const row = await env.DB.prepare('SELECT settings_json FROM users WHERE id = ?').bind(user.id).first();
    const settings = row && row.settings_json ? JSON.parse(row.settings_json) : {};
    return json({ settings }, 200, env);
}

async function handleSaveSettings(request, env) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    const { settings, name } = await request.json();
    await env.DB.prepare('UPDATE users SET settings_json = ? WHERE id = ?')
        .bind(JSON.stringify(settings || {}), user.id).run();
    if (name && name.trim()) {
        await env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name.trim(), user.id).run();
    }
    return json({ ok: true }, 200, env);
}

async function handleDeleteConversation(request, env, convId) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    await env.DB.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').bind(convId, user.id).run();
    return json({ ok: true }, 200, env);
}

// ---------- Router ----------

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders(env) });
        }

        try {
            if (path === '/api/signup' && request.method === 'POST') return await handleSignup(request, env);
            if (path === '/api/login' && request.method === 'POST') return await handleLogin(request, env);
            if (path === '/api/google-auth' && request.method === 'POST') return await handleGoogleAuth(request, env);
            if (path === '/api/reset-request' && request.method === 'POST') return await handleResetRequest(request, env);
            if (path === '/api/reset-confirm' && request.method === 'POST') return await handleResetConfirm(request, env);
            if (path === '/api/me' && request.method === 'GET') return await handleMe(request, env);
            if (path === '/api/change-password' && request.method === 'POST') return await handleChangePassword(request, env);
            if (path === '/api/account' && request.method === 'DELETE') return await handleDeleteAccount(request, env);
            if (path === '/api/conversations' && request.method === 'GET') return await handleGetConversations(request, env);
            if (path === '/api/conversations' && request.method === 'POST') return await handleSaveConversation(request, env);
            if (path === '/api/conversations/bulk' && request.method === 'POST') return await handleBulkSaveConversations(request, env);
            if (path.startsWith('/api/conversations/') && request.method === 'DELETE') {
                return await handleDeleteConversation(request, env, path.split('/').pop());
            }
            if (path === '/api/settings' && request.method === 'GET') return await handleGetSettings(request, env);
            if (path === '/api/settings' && request.method === 'POST') return await handleSaveSettings(request, env);
            return json({ error: 'Not found' }, 404, env);
        } catch (e) {
            return json({ error: 'Server error: ' + e.message }, 500, env);
        }
    },
};
