const SESSION_TTL_SECONDS = 2 * 60 * 60;
const TOKEN_RE = /^[A-Za-z0-9_-]+$/;

function bytesToBase64Url(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value) {
  if (!TOKEN_RE.test(value)) throw new Error("Invalid base64url value");
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (bytesToBase64Url(bytes) !== value) throw new Error("Non-canonical base64url value");
  return bytes;
}

function encodeJson(value) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
}

async function hmacKey(secret, usages) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );
}

async function sign(value, secret) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret, ["sign"]),
    new TextEncoder().encode(value),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifySignature(value, signature, secret) {
  if (!TOKEN_RE.test(signature)) return false;
  try {
    return crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret, ["verify"]),
      base64UrlToBytes(signature),
      new TextEncoder().encode(value),
    );
  } catch {
    return false;
  }
}

export function randomToken(byteLength = 24) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(String(value)),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function issueSession(env, origin) {
  if (!env.SESSION_SIGNING_KEY) throw new Error("SESSION_SIGNING_KEY is missing");
  const now = Math.floor(Date.now() / 1000);
  const encoded = encodeJson({
    sid: randomToken(18),
    origin,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  });
  return `${encoded}.${await sign(encoded, env.SESSION_SIGNING_KEY)}`;
}

export async function verifySession(request, env, origin) {
  if (!env.SESSION_SIGNING_KEY) return null;
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;
  if (!(await verifySignature(encoded, signature, env.SESSION_SIGNING_KEY))) return null;

  try {
    const payload = decodeJson(encoded);
    const now = Math.floor(Date.now() / 1000);
    if (
      !payload ||
      typeof payload.sid !== "string" ||
      payload.origin !== origin ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= now
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function validateTurnstile(request, env, responseToken, origin) {
  if (!env.TURNSTILE_SECRET) {
    return { success: false, error: "turnstile_not_configured" };
  }
  if (typeof responseToken !== "string" || responseToken.length < 10) {
    return { success: false, error: "turnstile_required" };
  }

  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET);
  form.set("response", responseToken);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) form.set("remoteip", remoteIp);
  form.set("idempotency_key", crypto.randomUUID());

  let response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
  } catch {
    return { success: false, error: "turnstile_unavailable" };
  }
  if (!response.ok) return { success: false, error: "turnstile_unavailable" };

  const result = await response.json();
  if (!result.success) return { success: false, error: "turnstile_failed" };
  if (result.action !== "api_session") {
    return { success: false, error: "turnstile_failed" };
  }

  const expectedHostname = new URL(origin).hostname;
  if (result.hostname !== expectedHostname) {
    return { success: false, error: "turnstile_failed" };
  }
  return { success: true };
}
