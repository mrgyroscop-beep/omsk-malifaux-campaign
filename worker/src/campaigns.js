import { randomToken, secureHashEqual, sha256Hex } from "./auth.js";

const CAMPAIGN_ID_RE = /^[A-Za-z0-9_-]{12,64}$/;
const ENTRY_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const MAX_DOSSIER_CHARS = 250_000;

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function cleanText(value, maximum, required = false) {
  const text = String(value ?? "").trim();
  if ((required && !text) || text.length > maximum) {
    throw new HttpError(400, "invalid_data");
  }
  return text;
}

function cleanInteger(value, minimum, maximum) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new HttpError(400, "invalid_data");
  }
  return number;
}

async function readJson(request, maximum = 300_000) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(length) && length > maximum) {
    throw new HttpError(413, "request_too_large");
  }
  const text = await request.text();
  if (text.length > maximum) throw new HttpError(413, "request_too_large");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

function dossierJson(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "invalid_dossier");
  }
  const json = JSON.stringify(value);
  if (json.length > MAX_DOSSIER_CHARS) {
    throw new HttpError(413, "dossier_too_large");
  }
  return json;
}

function campaignId(value) {
  if (!CAMPAIGN_ID_RE.test(value || "")) throw new HttpError(404, "not_found");
  return value;
}

function entryId(value) {
  if (!ENTRY_ID_RE.test(value || "")) throw new HttpError(404, "not_found");
  return value;
}

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function campaignRecord(env, id) {
  return env.DB.prepare(
    `SELECT id, organizer_token_hash, owner_user_id, access_mode, name, dossier_json, dossier_revision,
      created_at, updated_at
     FROM campaigns WHERE id = ?`,
  )
    .bind(id)
    .first();
}

async function requireOrganizer(request, env, id) {
  const token = request.headers.get("X-Organizer-Token") || "";
  if (token.length < 32 || token.length > 128) throw new HttpError(403, "organizer_required");
  const campaign = await campaignRecord(env, id);
  if (!campaign) throw new HttpError(404, "not_found");
  if (campaign.owner_user_id && campaign.access_mode !== "legacy_public") {
    throw new HttpError(404, "not_found");
  }
  if (!(await secureHashEqual(await sha256Hex(token), campaign.organizer_token_hash))) {
    throw new HttpError(403, "organizer_required");
  }
  return campaign;
}

function publicCampaign(row) {
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
    revision: row.dossier_revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getCampaign(env, id) {
  const campaign = await campaignRecord(env, id);
  if (!campaign) throw new HttpError(404, "not_found");
  if (campaign.owner_user_id && campaign.access_mode !== "legacy_public") {
    throw new HttpError(404, "not_found");
  }
  const [playersResult, eventsResult] = await Promise.all([
    env.DB.prepare(
      `SELECT id, player_name, crew_name, faction, campaign_rating,
        games_played, wins, notes, created_at, updated_at
       FROM campaign_players WHERE campaign_id = ?
       ORDER BY created_at ASC, player_name COLLATE NOCASE ASC`,
    )
      .bind(id)
      .all(),
    env.DB.prepare(
      `SELECT id, week, event_type, title, details, created_at, updated_at
       FROM campaign_events WHERE campaign_id = ?
       ORDER BY week DESC, created_at DESC`,
    )
      .bind(id)
      .all(),
  ]);

  return {
    campaign: publicCampaign(campaign),
    players: (playersResult.results || []).map((player) => ({
      id: player.id,
      playerName: player.player_name,
      crewName: player.crew_name,
      faction: player.faction,
      campaignRating: player.campaign_rating,
      gamesPlayed: player.games_played,
      wins: player.wins,
      notes: player.notes,
      createdAt: player.created_at,
      updatedAt: player.updated_at,
    })),
    events: (eventsResult.results || []).map((event) => ({
      id: event.id,
      week: event.week,
      type: event.event_type,
      title: event.title,
      details: event.details,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    })),
  };
}

async function createCampaign(request, env) {
  const body = await readJson(request);
  const id = randomToken(15);
  const organizerToken = randomToken(32);
  const name = cleanText(body.name, 120, true);
  const dossier = dossierJson(body.dossier || {});
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO campaigns
      (id, organizer_token_hash, name, dossier_json, dossier_revision, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
  )
    .bind(id, await sha256Hex(organizerToken), name, dossier, now, now)
    .run();

  return json(
    {
      ...(await getCampaign(env, id)),
      organizerToken,
    },
    201,
  );
}

async function updateDossier(request, env, id) {
  const campaign = await requireOrganizer(request, env, id);
  const body = await readJson(request);
  const revision = cleanInteger(body.revision, 1, Number.MAX_SAFE_INTEGER);
  const name = body.name === undefined ? campaign.name : cleanText(body.name, 120, true);
  const dossier = body.dossier === undefined
    ? campaign.dossier_json
    : dossierJson(body.dossier);
  const now = new Date().toISOString();

  const result = await env.DB.prepare(
    `UPDATE campaigns
     SET name = ?, dossier_json = ?, dossier_revision = dossier_revision + 1, updated_at = ?
     WHERE id = ? AND dossier_revision = ?`,
  )
    .bind(name, dossier, now, id, revision)
    .run();
  if (!Number(result.meta?.changes || 0)) {
    const current = await campaignRecord(env, id);
    return json(
      {
        error: "revision_conflict",
        currentRevision: Number(current?.dossier_revision || revision),
        updatedAt: current?.updated_at || null,
      },
      409,
    );
  }
  return json(await getCampaign(env, id));
}

async function verifyOrganizer(request, env, id) {
  await requireOrganizer(request, env, id);
  return json({ organizer: true });
}

async function deleteCampaign(request, env, id) {
  await requireOrganizer(request, env, id);
  const result = await env.DB.prepare("DELETE FROM campaigns WHERE id = ?")
    .bind(id)
    .run();
  if (!Number(result.meta?.changes || 0)) throw new HttpError(404, "not_found");
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

function playerFields(body, existing = {}) {
  return {
    playerName: cleanText(body.playerName ?? existing.player_name, 80, true),
    crewName: cleanText(body.crewName ?? existing.crew_name, 120),
    faction: cleanText(body.faction ?? existing.faction, 40),
    campaignRating: cleanInteger(
      body.campaignRating ?? existing.campaign_rating ?? 0,
      -999,
      9999,
    ),
    gamesPlayed: cleanInteger(body.gamesPlayed ?? existing.games_played ?? 0, 0, 9999),
    wins: cleanInteger(body.wins ?? existing.wins ?? 0, 0, 9999),
    notes: cleanText(body.notes ?? existing.notes, 500),
  };
}

async function createPlayer(request, env, id) {
  await requireOrganizer(request, env, id);
  const fields = playerFields(await readJson(request, 20_000));
  const playerId = randomToken(12);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO campaign_players
      (id, campaign_id, player_name, crew_name, faction, campaign_rating,
       games_played, wins, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      playerId,
      id,
      fields.playerName,
      fields.crewName,
      fields.faction,
      fields.campaignRating,
      fields.gamesPlayed,
      fields.wins,
      fields.notes,
      now,
      now,
    )
    .run();
  await env.DB.prepare("UPDATE campaigns SET updated_at = ? WHERE id = ?")
    .bind(now, id)
    .run();
  return json(await getCampaign(env, id), 201);
}

async function updatePlayer(request, env, id, playerId) {
  await requireOrganizer(request, env, id);
  const existing = await env.DB.prepare(
    "SELECT * FROM campaign_players WHERE id = ? AND campaign_id = ?",
  )
    .bind(playerId, id)
    .first();
  if (!existing) throw new HttpError(404, "not_found");
  const fields = playerFields(await readJson(request, 20_000), existing);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE campaign_players
     SET player_name = ?, crew_name = ?, faction = ?, campaign_rating = ?,
       games_played = ?, wins = ?, notes = ?, updated_at = ?
     WHERE id = ? AND campaign_id = ?`,
  )
    .bind(
      fields.playerName,
      fields.crewName,
      fields.faction,
      fields.campaignRating,
      fields.gamesPlayed,
      fields.wins,
      fields.notes,
      now,
      playerId,
      id,
    )
    .run();
  await env.DB.prepare("UPDATE campaigns SET updated_at = ? WHERE id = ?")
    .bind(now, id)
    .run();
  return json(await getCampaign(env, id));
}

async function deletePlayer(request, env, id, playerId) {
  await requireOrganizer(request, env, id);
  const result = await env.DB.prepare(
    "DELETE FROM campaign_players WHERE id = ? AND campaign_id = ?",
  )
    .bind(playerId, id)
    .run();
  if (!Number(result.meta?.changes || 0)) throw new HttpError(404, "not_found");
  await env.DB.prepare("UPDATE campaigns SET updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), id)
    .run();
  return json(await getCampaign(env, id));
}

function eventFields(body, existing = {}) {
  const type = cleanText(body.type ?? existing.event_type ?? "note", 24, true);
  if (!["game", "note", "milestone"].includes(type)) {
    throw new HttpError(400, "invalid_data");
  }
  return {
    week: cleanInteger(body.week ?? existing.week ?? 1, 1, 99),
    type,
    title: cleanText(body.title ?? existing.title, 140, true),
    details: cleanText(body.details ?? existing.details, 2000),
  };
}

async function createEvent(request, env, id) {
  await requireOrganizer(request, env, id);
  const fields = eventFields(await readJson(request, 30_000));
  const eventId = randomToken(12);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO campaign_events
      (id, campaign_id, week, event_type, title, details, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(eventId, id, fields.week, fields.type, fields.title, fields.details, now, now)
    .run();
  await env.DB.prepare("UPDATE campaigns SET updated_at = ? WHERE id = ?")
    .bind(now, id)
    .run();
  return json(await getCampaign(env, id), 201);
}

async function updateEvent(request, env, id, eventId) {
  await requireOrganizer(request, env, id);
  const existing = await env.DB.prepare(
    "SELECT * FROM campaign_events WHERE id = ? AND campaign_id = ?",
  )
    .bind(eventId, id)
    .first();
  if (!existing) throw new HttpError(404, "not_found");
  const fields = eventFields(await readJson(request, 30_000), existing);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE campaign_events
     SET week = ?, event_type = ?, title = ?, details = ?, updated_at = ?
     WHERE id = ? AND campaign_id = ?`,
  )
    .bind(fields.week, fields.type, fields.title, fields.details, now, eventId, id)
    .run();
  await env.DB.prepare("UPDATE campaigns SET updated_at = ? WHERE id = ?")
    .bind(now, id)
    .run();
  return json(await getCampaign(env, id));
}

async function deleteEvent(request, env, id, eventId) {
  await requireOrganizer(request, env, id);
  const result = await env.DB.prepare(
    "DELETE FROM campaign_events WHERE id = ? AND campaign_id = ?",
  )
    .bind(eventId, id)
    .run();
  if (!Number(result.meta?.changes || 0)) throw new HttpError(404, "not_found");
  await env.DB.prepare("UPDATE campaigns SET updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), id)
    .run();
  return json(await getCampaign(env, id));
}

export async function handleCampaignRequest(request, env) {
  if (!env.DB) return json({ error: "database_not_configured" }, 503);
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    if (parts.length === 2 && parts[0] === "api" && parts[1] === "campaigns") {
      if (request.method === "POST") return await createCampaign(request, env);
    }

    if (parts.length >= 3 && parts[0] === "api" && parts[1] === "campaigns") {
      const id = campaignId(parts[2]);
      if (parts.length === 3) {
        if (request.method === "GET") return json(await getCampaign(env, id));
        if (request.method === "PUT") return await updateDossier(request, env, id);
        if (request.method === "DELETE") return await deleteCampaign(request, env, id);
      }

      if (
        parts.length === 4 &&
        parts[3] === "organizer" &&
        request.method === "POST"
      ) {
        return await verifyOrganizer(request, env, id);
      }

      if (parts[3] === "players") {
        if (parts.length === 4 && request.method === "POST") {
          return await createPlayer(request, env, id);
        }
        if (parts.length === 5) {
          const playerId = entryId(parts[4]);
          if (request.method === "PATCH") return await updatePlayer(request, env, id, playerId);
          if (request.method === "DELETE") return await deletePlayer(request, env, id, playerId);
        }
      }

      if (parts[3] === "events") {
        if (parts.length === 4 && request.method === "POST") {
          return await createEvent(request, env, id);
        }
        if (parts.length === 5) {
          const eventId = entryId(parts[4]);
          if (request.method === "PATCH") return await updateEvent(request, env, id, eventId);
          if (request.method === "DELETE") return await deleteEvent(request, env, id, eventId);
        }
      }
    }
    return json({ error: "not_found" }, 404);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.code }, error.status);
    throw error;
  }
}
