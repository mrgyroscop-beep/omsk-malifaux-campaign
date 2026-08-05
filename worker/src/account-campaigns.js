import { AccountHttpError, requireAccountUser } from "./account-auth.js";
import { randomToken, secureHashEqual, sha256Hex } from "./auth.js";
import { readBoundedJson } from "./bounded-json.js";

const MAX_DOSSIER_CHARS = 250_000;
const CAMPAIGN_ID_RE = /^[A-Za-z0-9_-]{12,64}$/u;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function readJson(request, maximum = 300_000) {
  return readBoundedJson(
    request,
    maximum,
    (status, code) => new AccountHttpError(status, code),
  );
}

function dossierJson(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AccountHttpError(400, "invalid_dossier");
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > MAX_DOSSIER_CHARS) {
    throw new AccountHttpError(413, "dossier_too_large");
  }
  return serialized;
}

function cleanName(value) {
  const name = String(value ?? "").normalize("NFKC").trim();
  if (!name || name.length > 120) throw new AccountHttpError(400, "invalid_dossier");
  return name;
}

async function accountCampaign(env, userId) {
  return env.DB.prepare(
    `SELECT id, name, dossier_json, dossier_revision, access_mode, created_at, updated_at
     FROM campaigns WHERE owner_user_id = ?`,
  )
    .bind(userId)
    .first();
}

function publicCampaign(row) {
  if (!row) return null;
  let dossier = {};
  try {
    dossier = JSON.parse(row.dossier_json || "{}");
  } catch {
    dossier = {};
  }
  return {
    id: row.id,
    name: row.name,
    dossier,
    revision: Number(row.dossier_revision),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    accessMode: row.access_mode,
  };
}

async function getCurrent(request, env) {
  const user = await requireAccountUser(request, env);
  return json({ campaign: publicCampaign(await accountCampaign(env, user.id)) });
}

async function putCurrent(request, env) {
  const user = await requireAccountUser(request, env);
  const body = await readJson(request);
  const revision = Number(body.revision);
  if (!Number.isInteger(revision) || revision < 0 || revision > Number.MAX_SAFE_INTEGER) {
    throw new AccountHttpError(400, "invalid_dossier");
  }
  const name = cleanName(body.name);
  const dossier = dossierJson(body.dossier);
  const existing = await accountCampaign(env, user.id);
  const now = new Date().toISOString();

  if (!existing) {
    if (revision !== 0) return json({ error: "revision_conflict", campaign: null }, 409);
    const id = randomToken(15);
    const discardedOrganizerToken = randomToken(32);
    const result = await env.DB.prepare(
      `INSERT OR IGNORE INTO campaigns
        (id, organizer_token_hash, owner_user_id, access_mode, name, dossier_json,
         dossier_revision, created_at, updated_at)
       VALUES (?, ?, ?, 'account_private', ?, ?, 1, ?, ?)`,
    )
      .bind(
        id,
        await sha256Hex(discardedOrganizerToken),
        user.id,
        name,
        dossier,
        now,
        now,
      )
      .run();
    const created = await accountCampaign(env, user.id);
    if (!Number(result.meta?.changes || 0)) {
      return json({ error: "revision_conflict", campaign: publicCampaign(created) }, 409);
    }
    return json({ campaign: publicCampaign(created) }, 201);
  }

  const result = await env.DB.prepare(
    `UPDATE campaigns
     SET name = ?, dossier_json = ?, dossier_revision = dossier_revision + 1,
       updated_at = ?
     WHERE id = ? AND owner_user_id = ? AND dossier_revision = ?`,
  )
    .bind(name, dossier, now, existing.id, user.id, revision)
    .run();
  if (!Number(result.meta?.changes || 0)) {
    return json(
      { error: "revision_conflict", campaign: publicCampaign(await accountCampaign(env, user.id)) },
      409,
    );
  }
  return json({ campaign: publicCampaign(await accountCampaign(env, user.id)) });
}

async function claimLegacy(request, env) {
  const user = await requireAccountUser(request, env);
  const body = await readJson(request, 8_000);
  const campaignId = String(body.campaignId || "");
  const organizerToken = (request.headers.get("X-Organizer-Token") || "").trim();
  if (!CAMPAIGN_ID_RE.test(campaignId) || organizerToken.length < 32 || organizerToken.length > 128) {
    throw new AccountHttpError(403, "claim_denied");
  }
  const target = await env.DB.prepare(
    `SELECT id, owner_user_id, access_mode, organizer_token_hash, name, dossier_json,
      dossier_revision, created_at, updated_at
     FROM campaigns WHERE id = ?`,
  )
    .bind(campaignId)
    .first();
  if (
    !target ||
    target.access_mode !== "legacy_public" ||
    (target.owner_user_id && target.owner_user_id !== user.id) ||
    !(await secureHashEqual(await sha256Hex(organizerToken), target.organizer_token_hash))
  ) {
    throw new AccountHttpError(403, "claim_denied");
  }
  const owned = await accountCampaign(env, user.id);
  if (owned && owned.id !== target.id) {
    throw new AccountHttpError(409, "account_campaign_exists");
  }
  if (!target.owner_user_id) {
    let result;
    try {
      result = await env.DB.prepare(
        `UPDATE campaigns SET owner_user_id = ?
         WHERE id = ? AND owner_user_id IS NULL AND access_mode = 'legacy_public'`,
      )
        .bind(user.id, target.id)
        .run();
    } catch {
      throw new AccountHttpError(409, "claim_conflict");
    }
    if (!Number(result.meta?.changes || 0)) throw new AccountHttpError(409, "claim_conflict");
  }
  return json({ campaign: publicCampaign(await accountCampaign(env, user.id)) });
}

export async function handleAccountCampaignRequest(request, env) {
  if (!env.DB) return json({ error: "database_not_configured" }, 503);
  const path = new URL(request.url).pathname;
  try {
    if (path === "/api/account/campaign" && request.method === "GET") {
      return await getCurrent(request, env);
    }
    if (path === "/api/account/campaign" && request.method === "PUT") {
      return await putCurrent(request, env);
    }
    if (path === "/api/account/campaign/claim" && request.method === "POST") {
      return await claimLegacy(request, env);
    }
    return json({ error: "not_found" }, 404);
  } catch (error) {
    if (error instanceof AccountHttpError) {
      return json({ error: error.code }, error.status);
    }
    throw error;
  }
}
