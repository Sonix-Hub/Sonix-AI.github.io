/**
 * SONIX BACKEND — Cloudflare Worker
 * ================================================================
 * Handles: passwordless email sign-in (6-digit verification code)+login,
 * Google Sign-In, optional email-based 2FA as a second step, login
 * notification emails, and syncing conversations to D1.
 *
 * SETUP:
 *   1. Create/keep a D1 database, run schema.sql AND migration_2fa.sql
 *      against it, bind it to this Worker as "DB".
 *   2. Set these as Worker SECRETS (never plain vars):
 *        - RESEND_API_KEY      (from resend.com)
 *        - GOOGLE_CLIENT_ID    (from Google Cloud Console OAuth)
 *   3. Set ALLOWED_ORIGIN as a plain variable = your app's URL.
 *   4. Update FROM_EMAIL below to an address verified in Resend.
 *
 * USER SETTINGS SHAPE (stored in users.settings_json):
 *   {
 *     "twoFA": { "enabled": true, "method": "email" | "pin" | "pattern" | "biometric" },
 *     "loginNotifications": true | false
 *   }
 *   "pin" / "pattern" / "biometric" are verified entirely client-side
 *   (PIN/pattern stored in the browser, biometric via WebAuthn) — only
 *   "email" 2FA needs a server round-trip, which is what's added below.
 * ================================================================
 */

const FROM_EMAIL = 'SONIX <onboarding@resend.dev>';

const CODE_EXPIRY_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

const TWOFA_CODE_EXPIRY_MS = 10 * 60 * 1000;
const TWOFA_MAX_ATTEMPTS = 5;

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function isValidEmail(email) {
    return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

function generateCode() {
    const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    return String(n).padStart(6, '0');
}

function getUserSettings(userRow) {
    return userRow && userRow.settings_json ? JSON.parse(userRow.settings_json) : {};
}

// ---------- Sessions ----------

async function createSession(env, userId) {
    const token = uuid() + uuid();
    const now = Date.now();
    const expires = now + 30 * 24 * 60 * 60 * 1000;
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

// ---------- Google ID token verification ----------

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

// ---------- Email sending ----------

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

// NEW: "new login" notification — best-effort, never blocks login if it fails
async function sendLoginNotification(env, user, request) {
    try {
        const settings = getUserSettings(user);
        if (settings.loginNotifications === false) return; // opted out
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const country = request.headers.get('CF-IPCountry') || 'unknown';
        const when = new Date().toUTCString();
        await sendEmail(env, user.email, 'New sign-in to your SONIX account',
            `<p>Your SONIX account was just signed into.</p>` +
            `<p><b>When:</b> ${when}<br><b>Approx. location:</b> ${country}<br><b>IP:</b> ${ip}</p>` +
            `<p>If this wasn't you, we'd recommend enabling 2FA in Settings → System &amp; Security.</p>`
        );
    } catch (e) {
        console.warn('Login notification failed:', e.message);
    }
}

// NEW: send a fresh 2FA code for a pending-auth token, with the same cooldown protection
async function issueTwoFACode(env, userId, email) {
    const now = Date.now();
    const existing = await env.DB.prepare(
        'SELECT created_at FROM twofa_pending WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first();
    if (existing && (now - existing.created_at) < RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.created_at)) / 1000);
        return { error: `Please wait ${waitSec}s before requesting another code.` };
    }

    const pendingToken = uuid() + uuid();
    const code = generateCode();
    await env.DB.prepare('DELETE FROM twofa_pending WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare(
        'INSERT INTO twofa_pending (token, user_id, code, attempts, created_at, expires_at) VALUES (?, ?, ?, 0, ?, ?)'
    ).bind(pendingToken, userId, code, now, now + TWOFA_CODE_EXPIRY_MS).run();

    await sendEmail(env, email, 'Your SONIX sign-in code',
        `<p>Someone is signing in to your SONIX account. Enter this code to finish:</p>` +
        `<p style="font-size:28px;font-weight:800;letter-spacing:4px;">${code}</p>` +
        `<p>This code expires in 10 minutes. If this wasn't you, ignore this email and consider changing how you sign in.</p>`
    );

    return { pendingToken };
}

// ---------- Route handlers: primary sign-in ----------

async function handleEmailRequest(request, env) {
    const { email, nickname } = await request.json();
    if (!email) return json({ error: 'Email is required.' }, 400, env);
    if (!isValidEmail(email)) return json({ error: 'Enter a real email address, e.g. example@gmail.com' }, 400, env);

    // NEW: permanently banned emails can't even request a code.
    const banned = await env.DB.prepare('SELECT email FROM banned_emails WHERE email = ?').bind(email).first();
    if (banned) return json({ error: 'This account is no longer available.' }, 403, env);

    const now = Date.now();
    const existing = await env.DB.prepare(
        'SELECT created_at FROM email_verifications WHERE email = ?'
    ).bind(email).first();
    if (existing && (now - existing.created_at) < RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.created_at)) / 1000);
        return json({ error: `Please wait ${waitSec}s before requesting another code.` }, 429, env);
    }

    const code = generateCode();
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

// STEP 2 of primary sign-in. If the account has email-based 2FA enabled,
// this now returns a pending2FA response instead of a session — the
// frontend must then call /api/2fa/verify with the code sent separately.
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

    return await finishLoginOrRequire2FA(env, user, request);
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

    // NEW: permanently banned emails can't sign in via Google either.
    const banned = await env.DB.prepare('SELECT email FROM banned_emails WHERE email = ?').bind(profile.email).first();
    if (banned) return json({ error: 'This account is no longer available.' }, 403, env);

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

    return await finishLoginOrRequire2FA(env, user, request);
}

// NEW: shared by both sign-in methods — branches on whether email 2FA is on
async function finishLoginOrRequire2FA(env, user, request) {
    const fullUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
    const settings = getUserSettings(fullUser);
    const twoFA = settings.twoFA || { enabled: false };

    if (twoFA.enabled && twoFA.method === 'email') {
        const result = await issueTwoFACode(env, user.id, user.email);
        if (result.error) return json({ error: result.error }, 429, env);
        return json({ pending2FA: true, pendingToken: result.pendingToken, method: 'email' }, 200, env);
    }

    // No email 2FA needed here (pin/pattern/biometric are checked client-side,
    // or 2FA is off entirely) — issue the real session now.
    const token = await createSession(env, user.id);
    await sendLoginNotification(env, { ...fullUser, email: user.email }, request);
    return json({ token, user: { id: user.id, email: user.email, name: user.name, twoFA } }, 200, env);
}

// NEW: resend the email 2FA code for an in-progress pending login
async function handle2FAResend(request, env) {
    const { pendingToken } = await request.json();
    if (!pendingToken) return json({ error: 'Missing pendingToken.' }, 400, env);

    const pending = await env.DB.prepare('SELECT * FROM twofa_pending WHERE token = ?').bind(pendingToken).first();
    if (!pending) return json({ error: 'That sign-in has expired — start again.' }, 400, env);

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(pending.user_id).first();
    if (!user) return json({ error: 'Account not found.' }, 400, env);

    const result = await issueTwoFACode(env, user.id, user.email);
    if (result.error) return json({ error: result.error }, 429, env);
    return json({ pendingToken: result.pendingToken }, 200, env);
}

// NEW: verify the emailed 2FA code and issue the real session
async function handle2FAVerify(request, env) {
    const { pendingToken, code } = await request.json();
    if (!pendingToken || !code) return json({ error: 'Missing pendingToken or code.' }, 400, env);

    const pending = await env.DB.prepare('SELECT * FROM twofa_pending WHERE token = ?').bind(pendingToken).first();
    if (!pending) return json({ error: 'That sign-in has expired — start again.' }, 400, env);
    if (pending.expires_at < Date.now()) {
        await env.DB.prepare('DELETE FROM twofa_pending WHERE token = ?').bind(pendingToken).run();
        return json({ error: 'Code expired — request a new one.' }, 400, env);
    }
    if (pending.attempts >= TWOFA_MAX_ATTEMPTS) {
        await env.DB.prepare('DELETE FROM twofa_pending WHERE token = ?').bind(pendingToken).run();
        return json({ error: 'Too many incorrect attempts — start sign-in again.' }, 429, env);
    }
    if (pending.code !== String(code).trim()) {
        await env.DB.prepare('UPDATE twofa_pending SET attempts = attempts + 1 WHERE token = ?').bind(pendingToken).run();
        return json({ error: 'Incorrect code.' }, 400, env);
    }

    await env.DB.prepare('DELETE FROM twofa_pending WHERE token = ?').bind(pendingToken).run();

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(pending.user_id).first();
    if (!user) return json({ error: 'Account not found.' }, 400, env);

    const token = await createSession(env, user.id);
    const settings = getUserSettings(user);
    await sendLoginNotification(env, user, request);
    return json({ token, user: { id: user.id, email: user.email, name: user.name, twoFA: settings.twoFA || { enabled: false } } }, 200, env);
}

// ---------- Account / data routes (unchanged) ----------

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
    await env.DB.prepare('DELETE FROM twofa_pending WHERE user_id = ?').bind(user.id).run();
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

// NEW: wipes every stored conversation for the signed-in user WITHOUT
// deleting their account — this is what "Clear All Data" should actually
// call server-side; deleting the account entirely is a separate, bigger action.
async function handleClearMyConversations(request, env) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    await env.DB.prepare('DELETE FROM conversations WHERE user_id = ?').bind(user.id).run();
    return json({ ok: true }, 200, env);
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

// UPDATED: this is where "asking for permission first" belongs. Turning on
// email 2FA doesn't require anything extra server-side (the code IS the
// permission check, sent on next login) — but for PIN/pattern/biometric,
// your frontend should confirm the method was actually set up successfully
// (e.g. WebAuthn registration completed) BEFORE calling this to persist
// twoFA.enabled = true. This endpoint just trusts whatever settings object
// it's given, so that confirmation step has to happen in app.html first.
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

// ════════════════════════════════════════════════════════════════
// ADMIN / BROADCAST SYSTEM
// Completely separate auth from regular user sessions — a single
// shared password (Worker secret ADMIN_PASSWORD) issues a short-lived
// admin_sessions token. Every /api/admin/* route requires it.
// ════════════════════════════════════════════════════════════════

const ADMIN_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours — short-lived since this is sensitive

async function getAdminFromRequest(request, env) {
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return false;
    const row = await env.DB.prepare('SELECT expires_at FROM admin_sessions WHERE token = ?').bind(token).first();
    if (!row || row.expires_at < Date.now()) return false;
    return true;
}

async function handleAdminLogin(request, env) {
    const { password } = await request.json();
    if (!env.ADMIN_PASSWORD) return json({ error: 'Admin panel is not configured on the server yet.' }, 500, env);
    if (!password || password !== env.ADMIN_PASSWORD) {
        return json({ error: 'Incorrect password.' }, 401, env);
    }
    const token = uuid() + uuid();
    const now = Date.now();
    await env.DB.prepare('INSERT INTO admin_sessions (token, created_at, expires_at) VALUES (?, ?, ?)')
        .bind(token, now, now + ADMIN_SESSION_MS).run();
    return json({ token }, 200, env);
}

// Raw-binary upload (not multipart — client sends the file bytes directly
// with an X-Filename header) into R2. Returns a media_key to reference in
// an announcement, and the public-facing URL that serves it back out.
async function handleAdminUpload(request, env) {
    if (!(await getAdminFromRequest(request, env))) return json({ error: 'Not authorized.' }, 401, env);
    if (!env.MEDIA_BUCKET) return json({ error: 'Media storage (R2) is not configured on the server yet.' }, 500, env);

    const filename = request.headers.get('X-Filename') || 'file';
    const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
    const key = uuid() + '-' + filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > 100 * 1024 * 1024) return json({ error: 'File too large (100MB max).' }, 413, env);

    await env.MEDIA_BUCKET.put(key, bytes, { httpMetadata: { contentType } });
    return json({ mediaKey: key, mediaType: contentType, url: '/media/' + key }, 200, env);
}

// Public — streams a stored media file back out. Anyone with the link can
// open it (as requested), but keys are random UUIDs so they aren't guessable.
async function handleMediaGet(request, env, key) {
    if (!env.MEDIA_BUCKET) return new Response('Not found', { status: 404 });
    const obj = await env.MEDIA_BUCKET.get(key);
    if (!obj) return new Response('Not found', { status: 404 });
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('etag', obj.httpEtag);
    headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN || '*');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return new Response(obj.body, { headers });
}

async function handleAdminCreateAnnouncement(request, env) {
    if (!(await getAdminFromRequest(request, env))) return json({ error: 'Not authorized.' }, 401, env);
    const b = await request.json();
    const kind = b.kind; // 'text' | 'image' | 'video' | 'file' | 'link'
    if (!['text', 'image', 'video', 'file', 'link'].includes(kind)) return json({ error: 'Invalid kind.' }, 400, env);
    if (kind === 'link' && !b.linkUrl) return json({ error: 'A link announcement needs a URL.' }, 400, env);
    if (['image', 'video', 'file'].includes(kind) && !b.mediaKey) return json({ error: 'Upload the media first.' }, 400, env);

    const now = Date.now();
    // FIX per request: scheduled posts are invisible until they publish — no
    // preview, no "coming soon" state shown to users at all.
    const publishAt = b.publishAt ? new Date(b.publishAt).getTime() : now;
    if (isNaN(publishAt)) return json({ error: 'Invalid publish date.' }, 400, env);
    const durationDays = Number(b.durationDays) > 0 ? Number(b.durationDays) : 30;
    const expiresAt = publishAt + durationDays * 24 * 60 * 60 * 1000;

    const targetType = b.targetType === 'specific' ? 'specific' : 'all';
    const targetUserIds = targetType === 'specific' ? JSON.stringify(b.targetUserIds || []) : null;

    const id = uuid();
    await env.DB.prepare(
        `INSERT INTO announcements (id, kind, title, body, media_key, media_type, link_url, target_type, target_user_ids, publish_at, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, kind, b.title || null, b.body || null, b.mediaKey || null, b.mediaType || null, b.linkUrl || null,
           targetType, targetUserIds, publishAt, expiresAt, now).run();

    return json({ id, publishAt, expiresAt }, 200, env);
}

async function handleAdminListAnnouncements(request, env) {
    if (!(await getAdminFromRequest(request, env))) return json({ error: 'Not authorized.' }, 401, env);
    const { results } = await env.DB.prepare('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 200').all();
    return json({ announcements: results }, 200, env);
}

async function handleAdminDeleteAnnouncement(request, env, id) {
    if (!(await getAdminFromRequest(request, env))) return json({ error: 'Not authorized.' }, 401, env);
    const row = await env.DB.prepare('SELECT media_key FROM announcements WHERE id = ?').bind(id).first();
    await env.DB.prepare('DELETE FROM announcements WHERE id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM announcement_reads WHERE announcement_id = ?').bind(id).run();
    if (row && row.media_key && env.MEDIA_BUCKET) {
        try { await env.MEDIA_BUCKET.delete(row.media_key); } catch (e) {}
    }
    return json({ ok: true }, 200, env);
}

async function handleAdminSearchUsers(request, env) {
    if (!(await getAdminFromRequest(request, env))) return json({ error: 'Not authorized.' }, 401, env);
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) return json({ users: [] }, 200, env);
    const { results } = await env.DB.prepare(
        'SELECT id, email, name, created_at FROM users WHERE email LIKE ? OR name LIKE ? LIMIT 25'
    ).bind('%' + q + '%', '%' + q + '%').all();
    return json({ users: results }, 200, env);
}

// Admin action: permanently bans the email (blocks all future sign-in) AND
// wipes their current account data immediately — no cooldown, since this is
// moderator-initiated, not the user's own request.
async function handleAdminBanUser(request, env, userId) {
    if (!(await getAdminFromRequest(request, env))) return json({ error: 'Not authorized.' }, 401, env);
    const { reason } = await request.json().catch(() => ({}));
    const user = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
    if (!user) return json({ error: 'User not found.' }, 404, env);

    await env.DB.prepare('INSERT OR REPLACE INTO banned_emails (email, reason, banned_at) VALUES (?, ?, ?)')
        .bind(user.email, reason || null, Date.now()).run();
    await env.DB.prepare('DELETE FROM conversations WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM twofa_pending WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    return json({ ok: true }, 200, env);
}

// Admin action: deletes the account without a permanent ban (they could sign
// up again later) — distinct from handleAdminBanUser above.
async function handleAdminDeleteUser(request, env, userId) {
    if (!(await getAdminFromRequest(request, env))) return json({ error: 'Not authorized.' }, 401, env);
    await env.DB.prepare('DELETE FROM conversations WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM twofa_pending WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    return json({ ok: true }, 200, env);
}

// ---------- User-facing notifications feed ----------

async function handleGetNotifications(request, env) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    const now = Date.now();
    // Only ever returns announcements whose publish_at has already passed —
    // scheduled/future ones are invisible, matching the "no preview" requirement.
    const { results } = await env.DB.prepare(
        `SELECT a.*, EXISTS(SELECT 1 FROM announcement_reads r WHERE r.announcement_id = a.id AND r.user_id = ?) AS is_read
         FROM announcements a
         WHERE a.publish_at <= ? AND a.expires_at > ?
           AND (a.target_type = 'all' OR EXISTS (SELECT 1 FROM json_each(a.target_user_ids) WHERE value = ?))
         ORDER BY a.publish_at DESC LIMIT 100`
    ).bind(user.id, now, now, user.id).all();
    return json({ notifications: results }, 200, env);
}

async function handleMarkNotificationRead(request, env, id) {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not signed in.' }, 401, env);
    await env.DB.prepare('INSERT OR IGNORE INTO announcement_reads (announcement_id, user_id, read_at) VALUES (?, ?, ?)')
        .bind(id, user.id, Date.now()).run();
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
            if (path === '/api/2fa/resend' && request.method === 'POST') return await handle2FAResend(request, env);
            if (path === '/api/2fa/verify' && request.method === 'POST') return await handle2FAVerify(request, env);
            if (path === '/api/me' && request.method === 'GET') return await handleMe(request, env);
            if (path === '/api/account' && request.method === 'DELETE') return await handleDeleteAccount(request, env);
            if (path === '/api/conversations' && request.method === 'GET') return await handleGetConversations(request, env);
            if (path === '/api/conversations' && request.method === 'POST') return await handleSaveConversation(request, env);
            if (path === '/api/conversations' && request.method === 'DELETE') return await handleClearMyConversations(request, env);
            if (path === '/api/conversations/bulk' && request.method === 'POST') return await handleBulkSaveConversations(request, env);
            if (path.startsWith('/api/conversations/') && request.method === 'DELETE') {
                return await handleDeleteConversation(request, env, path.split('/').pop());
            }
            if (path === '/api/settings' && request.method === 'GET') return await handleGetSettings(request, env);
            if (path === '/api/settings' && request.method === 'POST') return await handleSaveSettings(request, env);

            // Admin / broadcast
            if (path === '/api/admin/login' && request.method === 'POST') return await handleAdminLogin(request, env);
            if (path === '/api/admin/upload' && request.method === 'POST') return await handleAdminUpload(request, env);
            if (path === '/api/admin/announcements' && request.method === 'POST') return await handleAdminCreateAnnouncement(request, env);
            if (path === '/api/admin/announcements' && request.method === 'GET') return await handleAdminListAnnouncements(request, env);
            if (path.startsWith('/api/admin/announcements/') && request.method === 'DELETE') {
                return await handleAdminDeleteAnnouncement(request, env, path.split('/').pop());
            }
            if (path === '/api/admin/users' && request.method === 'GET') return await handleAdminSearchUsers(request, env);
            if (path.match(/^\/api\/admin\/users\/[^/]+\/ban$/) && request.method === 'POST') {
                return await handleAdminBanUser(request, env, path.split('/')[4]);
            }
            if (path.startsWith('/api/admin/users/') && request.method === 'DELETE') {
                return await handleAdminDeleteUser(request, env, path.split('/').pop());
            }

            // Public media + user-facing notifications
            if (path.startsWith('/media/') && request.method === 'GET') return await handleMediaGet(request, env, path.slice(7));
            if (path === '/api/notifications' && request.method === 'GET') return await handleGetNotifications(request, env);
            if (path.match(/^\/api\/notifications\/[^/]+\/read$/) && request.method === 'POST') {
                return await handleMarkNotificationRead(request, env, path.split('/')[3]);
            }

            return json({ error: 'Not found' }, 404, env);
        } catch (e) {
            return json({ error: 'Server error: ' + e.message }, 500, env);
        }
    },
};
