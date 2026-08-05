import { randomToken, sha256Hex } from "./auth.js";
import { readBoundedJson } from "./bounded-json.js";

const PASSWORD_ALGORITHM = "PBKDF2-SHA-256";
const PASSWORD_VERSION = 1;
const PASSWORD_ITERATIONS = 600_000;
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const AUTH_WINDOW_SECONDS = 15 * 60;
const AUTH_ATTEMPT_LIMIT = 8;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/u;
const DUMMY_SALT = "uw8olVyk2fPj4sK1q7Jd_A";
const encoder = new TextEncoder();

export class AccountHttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value) {
  if (!/^[A-Za-z0-9_-]+$/u.test(value || "")) throw new Error("invalid_encoding");
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  if (bytesToBase64Url(bytes) !== value) throw new Error("invalid_encoding");
  return bytes;
}

async function readJson(request, maximum = 8_000) {
  return readBoundedJson(
    request,
    maximum,
    (status, code) => new AccountHttpError(status, code),
  );
}

export function normalizeEmail(value) {
  const email = String(value ?? "").normalize("NFKC").trim().toLowerCase();
  if (
    !email ||
    email.length > 254 ||
    /\s/u.test(email) ||
    !/^[^@]+@[^@]+\.[^@]+$/u.test(email)
  ) {
    throw new AccountHttpError(400, "invalid_credentials");
  }
  return email;
}

function validPassword(value) {
  return typeof value === "string" && value.length >= 8 && value.length <= 128;
}

async function derivePassword(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return new Uint8Array(derived);
}

async function passwordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return {
    algorithm: PASSWORD_ALGORITHM,
    version: PASSWORD_VERSION,
    iterations: PASSWORD_ITERATIONS,
    salt: bytesToBase64Url(salt),
    hash: bytesToBase64Url(await derivePassword(password, salt, PASSWORD_ITERATIONS)),
  };
}

async function timingSafeEqual(left, right) {
  if (left.byteLength !== right.byteLength) return false;
  if (typeof crypto.subtle.timingSafeEqual === "function") {
    return crypto.subtle.timingSafeEqual(left, right);
  }
  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function verifyPassword(password, user) {
  if (
    user.password_algorithm !== PASSWORD_ALGORITHM ||
    Number(user.password_version) !== PASSWORD_VERSION ||
    !Number.isInteger(Number(user.password_iterations)) ||
    Number(user.password_iterations) < 100_000 ||
    Number(user.password_iterations) > 1_000_000
  ) {
    return false;
  }
  try {
    const actual = await derivePassword(
      password,
      base64UrlToBytes(user.password_salt),
      Number(user.password_iterations),
    );
    return timingSafeEqual(actual, base64UrlToBytes(user.password_hash));
  } catch {
    return false;
  }
}

async function dummyPasswordCheck(password) {
  await derivePassword(
    password.slice(0, 128),
    base64UrlToBytes(DUMMY_SALT),
    PASSWORD_ITERATIONS,
  );
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

async function recordAuthAttempt(request, env, scope, email) {
  const key = await sha256Hex(`${scope}|${clientIp(request)}|${email}`);
  const now = Date.now();
  const row = await env.DB.prepare(
    "SELECT attempts, window_started_at FROM auth_attempts WHERE attempt_key = ?",
  )
    .bind(key)
    .first();
  const startedAt = Date.parse(row?.window_started_at || "");
  const expired = !Number.isFinite(startedAt) || now - startedAt >= AUTH_WINDOW_SECONDS * 1000;
  if (!expired && Number(row.attempts) >= AUTH_ATTEMPT_LIMIT) {
    throw new AccountHttpError(429, "rate_limited");
  }
  const timestamp = new Date(now).toISOString();
  await env.DB.prepare(
    `INSERT INTO auth_attempts (attempt_key, attempts, window_started_at, updated_at)
     VALUES (?, 1, ?, ?)
     ON CONFLICT(attempt_key) DO UPDATE SET
       attempts = CASE
         WHEN auth_attempts.window_started_at <= ? THEN 1
         ELSE auth_attempts.attempts + 1
       END,
       window_started_at = CASE
         WHEN auth_attempts.window_started_at <= ? THEN excluded.window_started_at
         ELSE auth_attempts.window_started_at
       END,
       updated_at = excluded.updated_at`,
  )
    .bind(
      key,
      timestamp,
      timestamp,
      new Date(now - AUTH_WINDOW_SECONDS * 1000).toISOString(),
      new Date(now - AUTH_WINDOW_SECONDS * 1000).toISOString(),
    )
    .run();
  return key;
}

async function clearAuthAttempt(env, key) {
  await env.DB.prepare("DELETE FROM auth_attempts WHERE attempt_key = ?")
    .bind(key)
    .run();
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email_normalized ?? row.email,
    displayName: row.display_name ?? row.displayName,
  };
}

async function createSession(env, userId) {
  const token = randomToken(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
  await env.DB.prepare(
    `INSERT INTO account_sessions
      (id, user_id, token_hash, created_at, expires_at, revoked_at)
     VALUES (?, ?, ?, ?, ?, NULL)`,
  )
    .bind(
      crypto.randomUUID(),
      userId,
      await sha256Hex(token),
      now.toISOString(),
      expiresAt.toISOString(),
    )
    .run();
  return { token, expiresAt: expiresAt.toISOString() };
}

function accountSessionToken(request) {
  const token = (request.headers.get("X-Account-Session") || "").trim();
  return TOKEN_RE.test(token) ? token : "";
}

export async function currentAccountUser(request, env) {
  const token = accountSessionToken(request);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT users.id, users.email_normalized, users.display_name,
      account_sessions.id AS session_id, account_sessions.expires_at
     FROM account_sessions
     JOIN users ON users.id = account_sessions.user_id
     WHERE account_sessions.token_hash = ?
       AND account_sessions.revoked_at IS NULL`,
  )
    .bind(tokenHash)
    .first();
  if (!row) return null;
  if (Date.parse(row.expires_at) <= Date.now()) {
    await env.DB.prepare(
      "UPDATE account_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
    )
      .bind(new Date().toISOString(), row.session_id)
      .run();
    return null;
  }
  return { ...publicUser(row), sessionId: row.session_id, tokenHash };
}

export async function requireAccountUser(request, env) {
  const user = await currentAccountUser(request, env);
  if (!user) throw new AccountHttpError(401, "authentication_required");
  return user;
}

async function register(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = body.password;
  const displayName = String(body.displayName ?? "").normalize("NFKC").trim();
  if (!validPassword(password) || !displayName || displayName.length > 60) {
    throw new AccountHttpError(400, "invalid_credentials");
  }
  await recordAuthAttempt(request, env, "register", email);
  const data = await passwordHash(password);
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email_normalized = ?")
    .bind(email)
    .first();
  if (existing) throw new AccountHttpError(409, "registration_unavailable");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      `INSERT INTO users
        (id, email_normalized, display_name, password_algorithm, password_version,
         password_iterations, password_salt, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        email,
        displayName,
        data.algorithm,
        data.version,
        data.iterations,
        data.salt,
        data.hash,
        now,
        now,
      )
      .run();
  } catch {
    throw new AccountHttpError(409, "registration_unavailable");
  }
  const session = await createSession(env, id);
  return json(
    { user: { id, email, displayName }, token: session.token, expiresAt: session.expiresAt },
    201,
  );
}

async function login(request, env) {
  const body = await readJson(request);
  let email;
  try {
    email = normalizeEmail(body.email);
  } catch {
    email = "invalid@example.invalid";
  }
  const passwordIsValid = validPassword(body.password);
  const password = passwordIsValid ? body.password : "";
  const attemptKey = await recordAuthAttempt(request, env, "login", email);
  const user = await env.DB.prepare(
    `SELECT id, email_normalized, display_name, password_algorithm, password_version,
      password_iterations, password_salt, password_hash
     FROM users WHERE email_normalized = ?`,
  )
    .bind(email)
    .first();
  let valid = false;
  if (!passwordIsValid) {
    await dummyPasswordCheck(password);
  } else if (user) {
    valid = await verifyPassword(password, user);
  } else {
    await dummyPasswordCheck(password);
  }
  if (!valid) throw new AccountHttpError(401, "invalid_credentials");
  if (Number(user.password_iterations) < PASSWORD_ITERATIONS) {
    const upgraded = await passwordHash(password);
    await env.DB.prepare(
      `UPDATE users SET password_algorithm = ?, password_version = ?,
        password_iterations = ?, password_salt = ?, password_hash = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(
        upgraded.algorithm,
        upgraded.version,
        upgraded.iterations,
        upgraded.salt,
        upgraded.hash,
        new Date().toISOString(),
        user.id,
      )
      .run();
  }
  await clearAuthAttempt(env, attemptKey);
  const session = await createSession(env, user.id);
  return json({ user: publicUser(user), token: session.token, expiresAt: session.expiresAt });
}

async function logout(request, env) {
  const token = accountSessionToken(request);
  if (token) {
    await env.DB.prepare(
      "UPDATE account_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL",
    )
      .bind(new Date().toISOString(), await sha256Hex(token))
      .run();
  }
  return json({ ok: true });
}

async function me(request, env) {
  const user = await currentAccountUser(request, env);
  return json({ user: user ? publicUser(user) : null });
}

export async function handleAccountAuthRequest(request, env) {
  if (!env.DB) return json({ error: "database_not_configured" }, 503);
  const path = new URL(request.url).pathname;
  try {
    if (path === "/api/auth/register" && request.method === "POST") {
      return await register(request, env);
    }
    if (path === "/api/auth/login" && request.method === "POST") {
      return await login(request, env);
    }
    if (path === "/api/auth/logout" && request.method === "POST") {
      return await logout(request, env);
    }
    if (path === "/api/auth/me" && request.method === "GET") {
      return await me(request, env);
    }
    return json({ error: "not_found" }, 404);
  } catch (error) {
    if (error instanceof AccountHttpError) {
      return json({ error: error.code }, error.status);
    }
    throw error;
  }
}

export const accountAuthConfig = Object.freeze({
  algorithm: PASSWORD_ALGORITHM,
  version: PASSWORD_VERSION,
  iterations: PASSWORD_ITERATIONS,
  sessionTtlSeconds: SESSION_TTL_SECONDS,
  attemptLimit: AUTH_ATTEMPT_LIMIT,
});
