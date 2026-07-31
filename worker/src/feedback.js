import { sha256Hex } from "./auth.js";

const CATEGORIES = new Set(["bug", "idea", "data", "other"]);
const LOCALES = new Set(["ru", "en"]);
const REQUEST_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const FEEDBACK_ID_RE = /^fb_[0-9a-f-]{36}$/iu;
const AUTOMATION_PATH = "/api/feedback/automation";
const DEFAULT_LEASE_SECONDS = 15 * 60;

class HttpError extends Error {
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

async function readJson(request, maximum = 8_000) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(length) && length > maximum) {
    throw new HttpError(413, "request_too_large");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "invalid_json");

  const decoder = new TextDecoder("utf-8", { fatal: true });
  let receivedBytes = 0;
  let raw = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
    if (receivedBytes > maximum) {
      try {
        await reader.cancel("request_too_large");
      } catch {
        // The 413 response still takes precedence over a source cancellation error.
      }
      throw new HttpError(413, "request_too_large");
    }
    try {
      raw += decoder.decode(value, { stream: true });
    } catch {
      try {
        await reader.cancel("invalid_utf8");
      } catch {
        // Preserve the stable invalid_json API response.
      }
      throw new HttpError(400, "invalid_json");
    }
  }
  try {
    raw += decoder.decode();
  } catch {
    throw new HttpError(400, "invalid_json");
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

function cleanText(value, maximum, minimum = 0) {
  const text = String(value ?? "").trim();
  if (text.length < minimum || text.length > maximum) {
    throw new HttpError(400, "invalid_feedback");
  }
  return text;
}

function normalizedFeedback(body) {
  const category = String(body?.category || "");
  const locale = String(body?.locale || "");
  const requestId = String(body?.requestId || "").toLowerCase();
  if (
    !CATEGORIES.has(category) ||
    !LOCALES.has(locale) ||
    !REQUEST_ID_RE.test(requestId)
  ) {
    throw new HttpError(400, "invalid_feedback");
  }

  return {
    requestId,
    category,
    message: cleanText(body.message, 2_000, 10),
    contact: cleanText(body.contact, 180),
    appVersion: cleanText(body.appVersion, 64, 1),
    locale,
    section: cleanText(body.section, 64, 1),
  };
}

function canonicalPayload(value) {
  return JSON.stringify({
    category: value.category,
    message: value.message,
    contact: value.contact,
    appVersion: value.appVersion,
    locale: value.locale,
    section: value.section,
  });
}

function publicReceipt(row, duplicate = false) {
  return {
    id: row.id,
    requestId: row.request_id,
    createdAt: row.created_at,
    duplicate,
  };
}

async function feedbackByRequestId(env, requestId) {
  return env.DB.prepare(
    `SELECT id, request_id, payload_hash, created_at
     FROM feedback WHERE request_id = ?1`,
  )
    .bind(requestId)
    .first();
}

export async function handleFeedbackRequest(request, env) {
  try {
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed");
    if (!env.DB) throw new HttpError(503, "feedback_not_configured");

    const value = normalizedFeedback(await readJson(request));
    const payloadHash = await sha256Hex(canonicalPayload(value));
    const existing = await feedbackByRequestId(env, value.requestId);
    if (existing) {
      if (existing.payload_hash !== payloadHash) {
        throw new HttpError(409, "request_id_conflict");
      }
      return json(publicReceipt(existing, true));
    }

    const id = `fb_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT OR IGNORE INTO feedback
        (id, request_id, payload_hash, category, message, contact, app_version,
         locale, section, status, attempts, available_at, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'pending', 0, ?10, ?10, ?10)`,
    )
      .bind(
        id,
        value.requestId,
        payloadHash,
        value.category,
        value.message,
        value.contact,
        value.appVersion,
        value.locale,
        value.section,
        now,
      )
      .run();

    const stored = await feedbackByRequestId(env, value.requestId);
    if (!stored) throw new Error("feedback_insert_failed");
    if (stored.payload_hash !== payloadHash) {
      throw new HttpError(409, "request_id_conflict");
    }
    return json(publicReceipt(stored, stored.id !== id), stored.id === id ? 201 : 200);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.code }, error.status);
    throw error;
  }
}

export function isFeedbackAutomationPath(pathname) {
  return pathname === AUTOMATION_PATH || pathname.startsWith(`${AUTOMATION_PATH}/`);
}

async function secureEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(left))),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(right))),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

async function requireAutomationToken(request, env) {
  const expected = String(env.FEEDBACK_AUTOMATION_TOKEN || "");
  if (expected.length < 32) {
    throw new HttpError(503, "automation_not_configured");
  }
  const authorization = request.headers.get("Authorization") || "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
  if (!supplied || !(await secureEqual(supplied, expected))) {
    throw new HttpError(401, "automation_unauthorized");
  }
}

function boundedInteger(value, fallback, minimum, maximum) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new HttpError(400, "invalid_automation_request");
  }
  return number;
}

function automationItem(row) {
  return {
    id: row.id,
    requestId: row.request_id,
    category: row.category,
    message: row.message,
    contact: row.contact || "",
    appVersion: row.app_version,
    locale: row.locale,
    section: row.section,
    createdAt: row.created_at,
    attempts: Number(row.attempts || 0),
    claimToken: row.claim_token,
    leaseExpiresAt: row.lease_expires_at,
  };
}

async function claimFeedback(request, env) {
  const body = await readJson(request);
  const limit = boundedInteger(body?.limit, 10, 1, 25);
  const leaseSeconds = boundedInteger(
    body?.leaseSeconds,
    DEFAULT_LEASE_SECONDS,
    60,
    3_600,
  );
  const now = new Date();
  const nowIso = now.toISOString();
  const leaseExpiresAt = new Date(now.getTime() + leaseSeconds * 1_000).toISOString();
  const claimToken = crypto.randomUUID();

  const result = await env.DB.prepare(
    `UPDATE feedback
     SET status = 'processing',
         claim_token = ?1,
         lease_expires_at = ?2,
         attempts = attempts + 1,
         updated_at = ?3
     WHERE id IN (
       SELECT id
       FROM feedback
       WHERE available_at <= ?3
         AND (
           status IN ('pending', 'retry')
           OR (status = 'processing' AND lease_expires_at <= ?3)
         )
       ORDER BY created_at ASC
       LIMIT ?4
     )
     RETURNING id, request_id, category, message, contact, app_version, locale,
       section, created_at, attempts, claim_token, lease_expires_at`,
  )
    .bind(claimToken, leaseExpiresAt, nowIso, limit)
    .all();

  return json({
    items: (result.results || []).map(automationItem),
    leaseSeconds,
  });
}

function actionRoute(pathname) {
  const match = pathname.match(
    /^\/api\/feedback\/automation\/(fb_[0-9a-f-]{36})\/(ack|retry|ignored)$/iu,
  );
  return match ? { id: match[1], action: match[2] } : null;
}

async function updateClaim(request, env, route) {
  if (!FEEDBACK_ID_RE.test(route.id)) throw new HttpError(404, "not_found");
  const body = await readJson(request);
  const claimToken = String(body?.claimToken || "");
  if (!REQUEST_ID_RE.test(claimToken)) {
    throw new HttpError(400, "invalid_automation_request");
  }

  const now = new Date();
  const nowIso = now.toISOString();
  let status;
  let availableAt = nowIso;
  let lastError = "";
  let processedAt = null;

  if (route.action === "ack") {
    status = "delivered";
    processedAt = nowIso;
  } else if (route.action === "ignored") {
    status = "ignored";
    processedAt = nowIso;
  } else {
    status = "retry";
    const retryAfterSeconds = boundedInteger(
      body?.retryAfterSeconds,
      5 * 60,
      0,
      24 * 60 * 60,
    );
    availableAt = new Date(now.getTime() + retryAfterSeconds * 1_000).toISOString();
    lastError = cleanText(body?.error, 500);
  }

  const result = await env.DB.prepare(
    `UPDATE feedback
     SET status = ?1,
         available_at = ?2,
         last_error = ?3,
         processed_at = ?4,
         claim_token = NULL,
         lease_expires_at = NULL,
         updated_at = ?5
     WHERE id = ?6
       AND status = 'processing'
       AND claim_token = ?7
       AND lease_expires_at > ?5`,
  )
    .bind(
      status,
      availableAt,
      lastError,
      processedAt,
      nowIso,
      route.id,
      claimToken,
    )
    .run();

  if (Number(result.meta?.changes || 0) !== 1) {
    throw new HttpError(409, "claim_expired_or_invalid");
  }
  return json({ id: route.id, status, availableAt });
}

export async function handleFeedbackAutomationRequest(request, env) {
  try {
    await requireAutomationToken(request, env);
    if (!env.DB) throw new HttpError(503, "feedback_not_configured");
    const url = new URL(request.url);
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed");
    if (url.pathname === `${AUTOMATION_PATH}/claim`) {
      return await claimFeedback(request, env);
    }
    const route = actionRoute(url.pathname);
    if (!route) throw new HttpError(404, "not_found");
    return await updateClaim(request, env, route);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.code }, error.status);
    throw error;
  }
}
