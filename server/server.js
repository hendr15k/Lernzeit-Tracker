/**
 * Lernzeit Tracker API and development server.
 * Zero dependencies: Node stdlib only. In production nginx serves the static
 * files and proxies /api/ here; for local Playwright runs this file can also
 * serve the static tree when STATIC_DIR is set.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || '/data';
const STATIC_DIR = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : (process.env.NODE_ENV === 'production' ? null : process.cwd());
const AUTH_USER = process.env.AUTH_USER || 'hendrik';
const AUTH_SECRET = process.env.AUTH_SECRET || '';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || '';
const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH || '';
const SESSION_TTL = 30 * 24 * 60 * 60;
const MAX_BODY = 5 * 1024 * 1024;
const DATA_KEYS = new Set([
  'lernzeit_entries', 'lernzeit_subjects', 'lernzeit_settings',
  'lernzeit_semesters', 'lernzeit_exams', 'lernzeit_goals',
  'lt_todos', 'lt_achievements', 'timer_state', 'timer_notes'
]);

if (!AUTH_SECRET || AUTH_SECRET.length < 32) {
  console.error('AUTH_SECRET must be set to at least 32 characters');
  process.exit(1);
}
if (!AUTH_USER) {
  console.error('AUTH_USER must not be empty');
  process.exit(1);
}

function scryptHash(password, salt = crypto.randomBytes(16)) {
  const derived = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`;
}

function scryptVerify(password, stored) {
  try {
    const [scheme, saltB64, hashB64] = String(stored).split('$');
    if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
    const expected = Buffer.from(hashB64, 'base64');
    const actual = crypto.scryptSync(String(password), Buffer.from(saltB64, 'base64'), expected.length, { N: 16384, r: 8, p: 1 });
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch (err) {
    return false;
  }
}

const PASSWORD_HASH = AUTH_PASSWORD_HASH || (AUTH_PASSWORD ? scryptHash(AUTH_PASSWORD) : '');
if (!PASSWORD_HASH) {
  console.error('AUTH_PASSWORD_HASH or AUTH_PASSWORD must be set');
  process.exit(1);
}

function b64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(value).digest('base64url');
}

function issueSession(username) {
  const payload = b64url(JSON.stringify({ u: username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL }));
  return `${payload}.${sign(payload)}`;
}

function verifySession(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expected = sign(payload);
  const a = Buffer.from(signature || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed || parsed.u !== AUTH_USER || !Number.isFinite(parsed.exp)) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch (err) {
    return null;
  }
}

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index < 0) return;
    try {
      out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    } catch (err) {
      // Ignore malformed cookies instead of turning them into a 500.
    }
  });
  return out;
}

function sessionFromReq(req) {
  return verifySession(parseCookies(req).lz_session);
}

function cookieHeader(token, req, maxAge = SESSION_TTL) {
  const secure = (req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim() === 'https' ? '; Secure' : '';
  return `lz_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

function userFilePath() {
  const key = crypto.createHash('sha256').update(AUTH_USER).digest('hex').slice(0, 32);
  return path.join(DATA_DIR, `${key}.json`);
}

function readStore() {
  try {
    const raw = fs.readFileSync(userFilePath(), 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid store');
    return {
      revision: Number.isInteger(parsed.revision) ? parsed.revision : 0,
      updatedAt: parsed.updatedAt || null,
      data: parsed.data && typeof parsed.data === 'object' ? parsed.data : null
    };
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('store read failed:', err.message);
    return { revision: 0, updatedAt: null, data: null };
  }
}

function writeStore(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const current = readStore();
  const next = {
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
    data
  };
  const target = userFilePath();
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(next), { mode: 0o600 });
  fs.renameSync(temp, target);
  return next;
}

function sanitizeData(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('data must be an object');
  }
  const clean = {};
  for (const [key, value] of Object.entries(input)) {
    if (!DATA_KEYS.has(key)) continue;
    if (value === null || value === undefined) continue;
    clean[key] = value;
  }
  const serialized = JSON.stringify(clean);
  if (Buffer.byteLength(serialized) > MAX_BODY) throw new Error('data too large');
  return JSON.parse(serialized);
}

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(new Error('invalid json'));
      }
    });
    req.on('error', reject);
  });
}

const attempts = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const record = attempts.get(ip);
  if (!record || now - record.first > windowMs) {
    attempts.set(ip, { first: now, count: 1 });
    return false;
  }
  record.count += 1;
  return record.count > 10;
}

function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return parsed.host === req.headers.host;
  } catch (err) {
    return false;
  }
}

function securityHeaders(extra = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    ...extra
  };
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4'
};

function serveStatic(req, res, pathname) {
  if (!STATIC_DIR) return false;
  const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const target = path.resolve(STATIC_DIR, '.' + relative);
  if (!target.startsWith(STATIC_DIR + path.sep) && target !== path.join(STATIC_DIR, 'index.html')) return false;
  let stat;
  try {
    stat = fs.statSync(target);
  } catch (err) {
    return false;
  }
  if (!stat.isFile()) return false;
  const ext = path.extname(target).toLowerCase();
  const headers = securityHeaders({
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ['.html', '.js', '.css', '.json'].includes(ext) ? 'no-cache' : 'public, max-age=3600'
  });
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(target).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (url.pathname === '/api/login' && req.method === 'POST') {
    if (!checkOrigin(req)) return sendJson(res, 403, { error: 'origin' });
    const ip = req.socket.remoteAddress || 'unknown';
    if (rateLimited(ip)) return sendJson(res, 429, { error: 'too_many_attempts' });
    try {
      const body = await readBody(req);
      const username = String(body.username || '');
      const password = String(body.password || '');
      const userOk = username === AUTH_USER;
      const passOk = scryptVerify(password, PASSWORD_HASH);
      if (!userOk || !passOk) {
        return sendJson(res, 401, { error: 'invalid_credentials' });
      }
      attempts.delete(ip);
      const token = issueSession(AUTH_USER);
      return sendJson(res, 200, { user: AUTH_USER }, { 'Set-Cookie': cookieHeader(token, req) });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  if (url.pathname === '/api/logout' && req.method === 'POST') {
    if (!checkOrigin(req)) return sendJson(res, 403, { error: 'origin' });
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': cookieHeader('', req, 0) });
  }

  const session = sessionFromReq(req);
  if (url.pathname.startsWith('/api/') && !session) {
    return sendJson(res, 401, { error: 'unauthorized' });
  }

  if (url.pathname === '/api/me' && req.method === 'GET') {
    return sendJson(res, 200, { user: AUTH_USER });
  }

  if (url.pathname === '/api/data' && req.method === 'GET') {
    const store = readStore();
    return sendJson(res, 200, { data: store.data, revision: store.revision, updatedAt: store.updatedAt });
  }

  if (url.pathname === '/api/data' && req.method === 'PUT') {
    if (!checkOrigin(req)) return sendJson(res, 403, { error: 'origin' });
    try {
      const body = await readBody(req);
      const baseRevision = Number.isInteger(body.baseRevision) ? body.baseRevision : 0;
      const current = readStore();
      if (baseRevision !== current.revision) {
        return sendJson(res, 409, { error: 'conflict', data: current.data, revision: current.revision, updatedAt: current.updatedAt });
      }
      const clean = sanitizeData(body.data);
      const next = writeStore(clean);
      return sendJson(res, 200, { revision: next.revision, updatedAt: next.updatedAt });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  if (url.pathname === '/api/data' && req.method === 'DELETE') {
    if (!checkOrigin(req)) return sendJson(res, 403, { error: 'origin' });
    const next = writeStore(null);
    return sendJson(res, 200, { revision: next.revision, updatedAt: next.updatedAt });
  }

  if (url.pathname.startsWith('/api/')) {
    return sendJson(res, 404, { error: 'not_found' });
  }

  if ((req.method === 'GET' || req.method === 'HEAD') && serveStatic(req, res, url.pathname)) return;

  res.writeHead(404, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
  res.end('Not found\n');
});

server.listen(PORT, HOST, () => {
  console.log(`Lernzeit API listening on ${HOST}:${PORT}`);
});
