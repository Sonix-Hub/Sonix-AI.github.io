/**
 * SONIX BACKEND — Cloudflare Worker
 * ================================================================
 * Handles: email/password signup (with email verification code)+login,
 * Google Sign-In, password reset (via email), and syncing conversations
 * to a real database (D1) instead of only the browser's local storage.
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

const CODE_EXPIRY_MS = 10 * 60 * 1000; // verification code valid for 10 minutes
const MAX_CODE_ATTEMPTS = 5;

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

// ---------- Input validation ----------

// Standard, practical email shape check: something@something.tld
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidEmail(email) {
    return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

function generateCode() {
    // 6-digit numeric code, e.g. 048213
    const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    return String(n).padStart(6, '0');
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

// STEP 1 of signup: validate input, email a 6-digit code, stash the
// pending signup (with password already hashed) until it's confirmed.
// STEP 1: validate email, email a 6-digit code. Works for both brand-new
// and returning users — we don't reveal which, and account creation happens
// in STEP 2 only after the code is confirmed.
async function handleEmailRequest(request, env) {
    const { email, nickname } = await request.json();
    if (!email) return json({ error: 'Email is required.' }, 400, env);
    if (!isValidEmail(email)) return json({ error: 'Enter a real email address, e.g. example@gmail.com' }, 400, env);

    const code = generateCode();
    const now = Date.now();
    const cleanNickname = (nickname || '').trim();

    await env.DB.prepare(
        `INSERT INTO email_verifications (email, code, name, attempts, created_at, expires_at)
         VALUES (?, ?, ?, 0, ?, ?)
         ON CONFLICT(email) DO UPDATE SET code = excluded.code, name = excluded.name,
            attempts = 0, created_at = excluded.created_at, expires_at = excluded.expires_at`
    ).bind(email, code, cleanNickname || null, now, now + CODE_EXPIRY_MS).run();

    try {
        await sendEmail(env, email, 'Your SONIX verification code',
            `<p>Your SONIX verification code is:</p>` +
            `<p style="font-size:28px;font-weight:800;letter-spacing:4px;">${code}</p>` +
            `<p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`
        );
    } catch (e) {
        return json({ error: 'Could not send verification email: ' + e.message }, 500, env);
    }

    return json({ ok: true }, 200, env);
}

// STEP 2: check the code. Creates the account on first-ever sign-in,
// otherwise just logs the existing user in — same code, same endpoint.
async function handleEmailVerify(request, env) {
    const { email, code } = await request.json();
    if (!email || !code) return json({ error: 'Missing email or code.' }, 400, env);

    const row = await env.DB.prepare('SELECT * FROM email_verifications WHERE email = ?').bind(email).first();
    if (!row) return json({ error: 'No pending code for this email — request a new one.' }, 400, env);
    if (row.expires_at < Date.now()) {
        await env.DB.prepare('DELETE FROM email_verifications WHERE email = ?').bind(email).run();
        return json({ error: 'That code expired — request a new one.' }, 400, env);
    }
    if (row.attempts >= MAX_CODE_ATTEMPTS) {
        await env.DB.prepare('DELETE FROM email_verifications WHERE email = ?').bind(email).run();
        return json({ error: 'Too many incorrect attempts — request a new code.' }, 429, env);
    }
    if (row.code !== String(code).trim()) {
        await env.DB.prepare('UPDATE email_verifications SET attempts = attempts + 1 WHERE email = ?').bind(email).run();
        return json({ error: 'Incorrect code.' }, 400, env);
    }

    await env.DB.prepare('DELETE FROM email_verifications WHERE email = ?').bind(email).run();

    let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) {
        const id = uuid();
        const name = row.name || email.split('@')[0];
        await env.DB.prepare(
            'INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)'
        ).bind(id, email, name, Date.now()).run();
        user = { id, email, name };
    }

    const token = await createSession(env, user.id);
    const settings = user.settings_json ? JSON.parse(user.settings_json) : {};
    return json({ token, user: { id: user.id, email: user.email, name: user.name, twoFA: settings.twoFA || { enabled: false } } }, 200, env);
}

async function handleGoogleAuth(request, env) {
    const { id_token, nickname } = await request.json();
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

    const cleanNickname = (nickname || '').trim();

    if (!user) {
        const id = uuid();
        const displayName = cleanNickname || profile.name;
        await env.DB.prepare(
            'INSERT INTO users (id, email, google_sub, name, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(id, profile.email, profile.sub, displayName, Date.now()).run();
        user = { id, email: profile.email, name: displayName };
    } else if (!user.google_sub) {
        await env.DB.prepare('UPDATE users SET google_sub = ? WHERE id = ?').bind(profile.sub, user.id).run();
    }

    const token = await createSession(env, user.id);
    const settingsRow = await env.DB.prepare('SELECT settings_json FROM users WHERE id = ?').bind(user.id).first();
    const settings = settingsRow && settingsRow.settings_json ? JSON.parse(settingsRow.settings_json) : {};
    return json({ token, user: { id: user.id, email: user.email, name: user.name, twoFA: settings.twoFA || { enabled: false } } }, 200, env);
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
            if (path === '/api/email-request' && request.method === 'POST') return await handleEmailRequest(request, env);
            if (path === '/api/email-verify' && request.method === 'POST') return await handleEmailVerify(request, env);
            if (path === '/api/google-auth' && request.method === 'POST') return await handleGoogleAuth(request, env);
            if (path === '/api/me' && request.method === 'GET') return await handleMe(request, env);
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
