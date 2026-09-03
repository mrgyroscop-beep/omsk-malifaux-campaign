import { AccountHttpError, requireAccountUser } from "./account-auth.js";
import { randomToken, secureHashEqual, sha256Hex } from "./auth.js";
import { readBoundedJson } from "./bounded-json.js";

const ID = /^[A-Za-z0-9_-]{12,64}$/u;
const fail = (status, code) => { throw new AccountHttpError(status, code); };
const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function read(request) {
  const body = await readBoundedJson(request, 16000, (status, code) => new AccountHttpError(status, code));
  if (!body || typeof body !== "object" || Array.isArray(body)) fail(400, "invalid_data");
  return body;
}
function string(value, max, required = false) {
  if (typeof value !== "string") return required ? fail(400, "invalid_data") : "";
  const result = value.trim();
  if (result.length > max || (required && !result)) fail(400, "invalid_data");
  return result;
}
function integer(value, max = 99) {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1 || result > max) fail(400, "invalid_data");
  return result;
}
function dossier(row) {
  try { return JSON.parse(row.dossier_json || "{}"); } catch { return {}; }
}
function summary(row) {
  return { id: row.id, name: row.name, week: row.week, duration: row.duration,
    notes: row.notes, revision: row.revision, createdAt: row.created_at, updatedAt: row.updated_at };
}
async function group(env, id) {
  if (!ID.test(id || "")) fail(404, "not_found");
  const row = await env.DB.prepare("SELECT * FROM organizer_campaigns WHERE id = ?").bind(id).first();
  if (!row) fail(404, "not_found");
  return row;
}
function owner(row, user) { if (row.owner_user_id !== user.id) fail(403, "organizer_required"); }
async function accessible(env, row, user) {
  if (row.owner_user_id === user.id) return;
  const member = await env.DB.prepare(`SELECT m.id FROM organizer_members m JOIN campaigns a ON a.id = m.arsenal_id
    WHERE m.campaign_id = ? AND a.owner_user_id = ?`).bind(row.id, user.id).first();
  if (!member) fail(404, "not_found");
}
async function details(env, row, user) {
  await accessible(env, row, user);
  const organizer = row.owner_user_id === user.id;
  const [members, events] = await Promise.all([
    env.DB.prepare(`SELECT m.*, a.name AS arsenal_name, a.dossier_json, a.updated_at AS arsenal_updated_at,
      a.owner_user_id AS arsenal_owner FROM organizer_members m
      LEFT JOIN campaigns a ON a.id = m.arsenal_id WHERE m.campaign_id = ? ORDER BY m.created_at, m.id`).bind(row.id).all(),
    env.DB.prepare("SELECT * FROM organizer_events WHERE campaign_id = ? ORDER BY week DESC, created_at DESC").bind(row.id).all(),
  ]);
  return { campaign: summary(row), organizer, ...(organizer ? { inviteToken: row.invite_token } : {}),
    members: members.results.map((m) => {
      const d = dossier(m);
      const games = Array.isArray(d.games) ? d.games : [];
      return { id: m.id, arsenalId: m.arsenal_id, playerName: m.player_name,
        crewName: d.crew?.name || m.crew_name || m.arsenal_name || "", faction: d.crew?.faction || m.faction || "",
        legacyCampaignRating: m.campaign_rating,
        notes: m.notes, updatedAt: m.arsenal_updated_at, canRead: Boolean(m.arsenal_id && (organizer || m.arsenal_owner === user.id)),
        isOwn: m.arsenal_owner === user.id, gamesPlayed: m.arsenal_id ? games.length : m.games_played,
        wins: m.arsenal_id ? games.filter((g) => g.result === "win").length : m.wins };
    }),
    events: events.results.map((e) => ({ id: e.id, week: e.week, title: e.title, details: e.details, createdAt: e.created_at })) };
}
async function list(env, user) {
  const result = await env.DB.prepare(`SELECT DISTINCT g.* FROM organizer_campaigns g
    LEFT JOIN organizer_members m ON m.campaign_id = g.id
    LEFT JOIN campaigns a ON a.id = m.arsenal_id
    WHERE g.owner_user_id = ? OR a.owner_user_id = ? ORDER BY g.updated_at DESC`).bind(user.id, user.id).all();
  return json({ campaigns: result.results.map((row) => ({ ...summary(row), organizer: row.owner_user_id === user.id })) });
}
async function create(request, env, user) {
  const body = await read(request);
  const name = string(body.name, 120, true);
  const now = new Date().toISOString();
  const id = randomToken(15);
  await env.DB.prepare(`INSERT INTO organizer_campaigns
    (id, owner_user_id, name, week, duration, notes, invite_token, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)`).bind(id, user.id, name, integer(body.duration ?? 8),
    string(body.notes, 2000), randomToken(32), now, now).run();
  return json(await details(env, await group(env, id), user), 201);
}
async function update(request, env, row, user) {
  owner(row, user);
  const b = await read(request);
  const result = await env.DB.prepare(`UPDATE organizer_campaigns SET name = ?, week = ?, duration = ?, notes = ?,
    revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ?`).bind(
    string(b.name ?? row.name, 120, true), integer(b.week ?? row.week), integer(b.duration ?? row.duration),
    string(b.notes ?? row.notes, 2000), new Date().toISOString(), row.id, integer(b.revision, Number.MAX_SAFE_INTEGER)).run();
  if (!result.meta?.changes) fail(409, "revision_conflict");
  return json(await details(env, await group(env, row.id), user));
}
async function addMember(env, row, arsenal, user, b, existingId = null) {
  const d = arsenal ? dossier(arsenal) : {};
  const name = string(b.playerName || d.crew?.player || user.display_name || user.displayName, 80, true);
  const duplicate = arsenal && await env.DB.prepare("SELECT id FROM organizer_members WHERE campaign_id = ? AND arsenal_id = ?")
    .bind(row.id, arsenal.id).first();
  if (duplicate && duplicate.id !== existingId) fail(409, "already_joined");
  const id = existingId || randomToken(15);
  const now = new Date().toISOString();
  const write = existingId
    ? env.DB.prepare("UPDATE organizer_members SET arsenal_id = ?, player_name = ?, crew_name = ? WHERE id = ? AND campaign_id = ?")
      .bind(arsenal?.id || null, name, string(d.crew?.name, 120), id, row.id)
    : env.DB.prepare(`INSERT INTO organizer_members (id, campaign_id, arsenal_id, player_name, crew_name, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, row.id, arsenal?.id || null, name,
      string(d.crew?.name, 120), string(b.notes, 500), now);
  try {
    await env.DB.batch([write, env.DB.prepare("UPDATE organizer_campaigns SET updated_at = ? WHERE id = ?").bind(now, row.id)]);
  } catch (error) {
    if (String(error.message).includes("UNIQUE constraint")) fail(409, "already_joined");
    throw error;
  }
  return json(await details(env, await group(env, row.id), user), existingId ? 200 : 201);
}
async function join(request, env, row, user) {
  const b = await read(request);
  // Owners participate through exactly the same membership record as any player.
  if (row.owner_user_id !== user.id && !(await secureHashEqual(
    await sha256Hex(string(b.inviteToken, 64)), await sha256Hex(row.invite_token)))) fail(403, "invite_invalid");
  const arsenal = await env.DB.prepare("SELECT * FROM campaigns WHERE owner_user_id = ?").bind(user.id).first();
  if (!arsenal) fail(409, "arsenal_required");
  return addMember(env, row, arsenal, user, b);
}
async function attach(request, env, row, user, memberId = null) {
  owner(row, user);
  const b = await read(request);
  const existing = memberId ? await env.DB.prepare("SELECT id, arsenal_id FROM organizer_members WHERE id = ? AND campaign_id = ?").bind(memberId, row.id).first() : null;
  if (memberId && !existing) fail(404, "not_found");
  const id = string(b.arsenalId, 64);
  let arsenal = null;
  if (id) {
    if (!ID.test(id)) fail(400, "invalid_link");
    arsenal = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(id).first();
    // Guessing a private arsenal ID never grants membership or read access.
    if (!arsenal || (arsenal.access_mode !== "legacy_public" && arsenal.owner_user_id !== user.id && existing?.arsenal_id !== id)) fail(404, "arsenal_unavailable");
  }
  return addMember(env, row, arsenal, user, b, memberId);
}
async function readArsenal(env, row, user, memberId) {
  await accessible(env, row, user);
  const a = await env.DB.prepare(`SELECT a.*, m.player_name FROM organizer_members m
    JOIN campaigns a ON a.id = m.arsenal_id WHERE m.id = ? AND m.campaign_id = ?`).bind(memberId, row.id).first();
  if (!a) fail(404, "arsenal_unavailable");
  if (row.owner_user_id !== user.id && a.owner_user_id !== user.id) fail(403, "organizer_required");
  return json({ arsenal: { id: a.id, name: a.name, playerName: a.player_name, dossier: dossier(a), revision: a.dossier_revision, updatedAt: a.updated_at } });
}
async function removeMember(env, row, user, memberId) {
  const member = await env.DB.prepare(`SELECT m.id, a.owner_user_id FROM organizer_members m
    LEFT JOIN campaigns a ON a.id = m.arsenal_id WHERE m.id = ? AND m.campaign_id = ?`).bind(memberId, row.id).first();
  if (!member) fail(404, "not_found");
  if (row.owner_user_id !== user.id && member.owner_user_id !== user.id) fail(403, "organizer_required");
  await env.DB.prepare("DELETE FROM organizer_members WHERE id = ? AND campaign_id = ?").bind(memberId, row.id).run();
  return json({ ok: true });
}
async function importLegacy(request, env, user) {
  const b = await read(request);
  const sourceId = string(b.campaignId, 64, true);
  const source = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND access_mode = 'legacy_public'").bind(sourceId).first();
  if (!source || !(await secureHashEqual(await sha256Hex(string(b.organizerToken, 128)), source.organizer_token_hash))) fail(403, "import_denied");
  const existing = await env.DB.prepare("SELECT id FROM organizer_campaigns WHERE owner_user_id = ? AND legacy_source_id = ?").bind(user.id, sourceId).first();
  if (existing) return json(await details(env, await group(env, existing.id), user));
  const [players, events] = await Promise.all([
    env.DB.prepare("SELECT * FROM campaign_players WHERE campaign_id = ?").bind(sourceId).all(),
    env.DB.prepare("SELECT * FROM campaign_events WHERE campaign_id = ?").bind(sourceId).all(),
  ]);
  const id = randomToken(15), now = new Date().toISOString(), settings = dossier(source).campaign || {};
  const bounded = (v, fallback) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 99 ? Number(v) : fallback;
  const writes = [env.DB.prepare(`INSERT INTO organizer_campaigns
    (id, owner_user_id, name, week, duration, notes, invite_token, legacy_source_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?)`).bind(id, user.id, source.name,
    bounded(settings.week, 1), bounded(settings.length, 8), randomToken(32), sourceId, now, now)];
  for (const p of players.results) writes.push(env.DB.prepare(`INSERT INTO organizer_members
    (id, campaign_id, player_name, crew_name, faction, campaign_rating, games_played, wins, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(randomToken(15), id, p.player_name, p.crew_name, p.faction, p.campaign_rating, p.games_played, p.wins, p.notes, p.created_at));
  for (const e of events.results) writes.push(env.DB.prepare(`INSERT INTO organizer_events
    (id, campaign_id, week, title, details, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(randomToken(15), id, e.week, e.title, e.details, e.created_at));
  await env.DB.batch(writes);
  return json(await details(env, await group(env, id), user), 201);
}

export async function handleOrganizerCampaignRequest(request, env) {
  if (!env.DB) return json({ error: "database_not_configured" }, 503);
  try {
    const user = await requireAccountUser(request, env);
    const parts = new URL(request.url).pathname.split("/").filter(Boolean);
    const method = request.method;
    if (parts.length === 2) {
      if (method === "GET") return list(env, user);
      if (method === "POST") return await create(request, env, user);
    }
    if (parts.length === 3 && parts[2] === "import" && method === "POST") return await importLegacy(request, env, user);
    const row = await group(env, parts[2]);
    if (parts.length === 3) {
      if (method === "GET") return json(await details(env, row, user));
      if (method === "PATCH") return await update(request, env, row, user);
      if (method === "DELETE") {
        owner(row, user);
        await env.DB.prepare("DELETE FROM organizer_campaigns WHERE id = ?").bind(row.id).run();
        return json({ ok: true });
      }
    }
    if (parts.length === 4 && parts[3] === "join" && method === "POST") return await join(request, env, row, user);
    if (parts.length === 4 && parts[3] === "invite" && method === "POST") {
      owner(row, user);
      await env.DB.prepare("UPDATE organizer_campaigns SET invite_token = ? WHERE id = ?").bind(randomToken(32), row.id).run();
      return json(await details(env, await group(env, row.id), user));
    }
    if (parts[3] === "members") {
      if (parts.length === 4 && method === "POST") return await attach(request, env, row, user);
      if (!ID.test(parts[4] || "")) fail(404, "not_found");
      if (parts.length === 5 && method === "PATCH") return await attach(request, env, row, user, parts[4]);
      if (parts.length === 5 && method === "DELETE") return await removeMember(env, row, user, parts[4]);
      if (parts.length === 6 && parts[5] === "arsenal" && method === "GET") return await readArsenal(env, row, user, parts[4]);
    }
    if (parts[3] === "events") {
      owner(row, user);
      if (parts.length === 4 && method === "POST") {
        const b = await read(request);
        await env.DB.prepare("INSERT INTO organizer_events (id, campaign_id, week, title, details, created_at) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(randomToken(15), row.id, integer(b.week), string(b.title, 140, true), string(b.details, 2000), new Date().toISOString()).run();
        return json(await details(env, row, user), 201);
      }
      if (parts.length === 5 && method === "DELETE") {
        const result = await env.DB.prepare("DELETE FROM organizer_events WHERE id = ? AND campaign_id = ?").bind(parts[4], row.id).run();
        if (!result.meta?.changes) fail(404, "not_found");
        return json(await details(env, row, user));
      }
    }
    return json({ error: "not_found" }, 404);
  } catch (error) {
    if (error instanceof AccountHttpError) return json({ error: error.code }, error.status);
    throw error;
  }
}
