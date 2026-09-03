import assert from "node:assert/strict";
import test from "node:test";
import { handleOrganizerCampaignRequest as handle } from "../src/organizer-campaigns.js";
import { handleAccountCampaignRequest } from "../src/account-campaigns.js";
import { handleCampaignRequest } from "../src/campaigns.js";
import { FakeD1, jsonRequest, registerUser } from "./test-db.js";

const base = "https://worker.example/api/organizer-campaigns";
const call = (env, token, path = "", method = "GET", body) => handle(jsonRequest(base + path, method, body, token), env);
async function setup() {
  const env = { DB: new FakeD1() };
  const organizer = await registerUser(env, "organizer@example.com");
  const player = await registerUser(env, "player@example.com");
  const stranger = await registerUser(env, "stranger@example.com");
  const created = await (await call(env, organizer.token, "", "POST", { name: "The shared ledger" })).json();
  return { env, organizer, player, stranger, created, path: `/${created.campaign.id}` };
}
async function arsenal(env, token, name = "Player's arsenal", revision = 0) {
  const response = await handleAccountCampaignRequest(jsonRequest("https://worker.example/api/account/campaign", "PUT", {
    name, revision, dossier: { crew: { name, player: "Player", faction: "Guild" }, arsenal: { models: [{ name: "Guard", cost: 5 }], scrip: 8 }, games: [] },
  }, token), env);
  assert.ok(response.ok);
  return (await response.json()).campaign;
}

test("organizer can create and manage a campaign without owning or joining an arsenal", async () => {
  const { env, organizer, player, created, path } = await setup();
  assert.equal(created.members.length, 0);
  assert.equal(created.campaign.duration, 8);
  assert.equal(env.DB.database.prepare("SELECT count(*) AS n FROM campaigns").get().n, 0);
  assert.equal((await call(env, "")).status, 401);
  assert.equal((await call(env, player.token, path)).status, 404);
  assert.equal((await call(env, player.token, path, "PATCH", { revision: 1, name: "Hijack" })).status, 403);
  const updated = await call(env, organizer.token, path, "PATCH", { revision: 1, week: 3, duration: 10, notes: "Fridays" });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).campaign.week, 3);
  assert.equal((await call(env, organizer.token, path, "PATCH", { revision: 1, week: 4 })).status, 409);
  const list = await (await call(env, organizer.token)).json();
  assert.equal(list.campaigns.length, 1);
  assert.equal(list.campaigns[0].organizer, true);
});

test("private arsenals require the player's invitation acceptance; membership grants only scoped reads", async () => {
  const { env, organizer, player, stranger, created, path } = await setup();
  const own = await arsenal(env, player.token);
  assert.equal((await call(env, organizer.token, `${path}/members`, "POST", { arsenalId: own.id, playerName: "Player" })).status, 404);
  assert.equal((await call(env, player.token, `${path}/join`, "POST", { inviteToken: "wrong" })).status, 403);
  const joined = await call(env, player.token, `${path}/join`, "POST", { inviteToken: created.inviteToken });
  assert.equal(joined.status, 201);
  const result = await joined.json(), member = result.members[0];
  assert.equal(result.organizer, false);
  assert.equal("inviteToken" in result, false);
  assert.equal(member.isOwn, true);
  assert.equal((await call(env, player.token, `${path}/join`, "POST", { inviteToken: created.inviteToken })).status, 409);
  const readPath = `${path}/members/${member.id}/arsenal`;
  assert.equal((await call(env, stranger.token, readPath)).status, 404);
  assert.equal((await call(env, player.token, readPath)).status, 200);
  const read = await (await call(env, organizer.token, readPath)).json();
  assert.equal(read.arsenal.dossier.crew.name, "Player's arsenal");
  assert.equal((await call(env, organizer.token, readPath, "PUT", { dossier: {} })).status, 404);
  assert.equal((await handleCampaignRequest(new Request(`https://worker.example/api/campaigns/${own.id}`), env)).status, 404);
  await arsenal(env, player.token, "Updated by player", 1);
  const refreshed = await (await call(env, organizer.token, readPath)).json();
  assert.equal(refreshed.arsenal.dossier.crew.name, "Updated by player");
  assert.equal(refreshed.arsenal.revision, 2);
  assert.equal((await call(env, organizer.token, `${path}/members/${member.id}`, "PATCH", { arsenalId: own.id, playerName: "New label" })).status, 200);
  assert.equal((await call(env, player.token, `${path}/members/${member.id}`, "DELETE")).status, 200);
  assert.equal((await call(env, organizer.token, readPath)).status, 404);
  assert.equal((await call(env, player.token, path)).status, 404);
  assert.equal(env.DB.database.prepare("SELECT name FROM campaigns WHERE id = ?").get(own.id).name, "Updated by player");
});

test("organizer joins as a normal player; invitation rotation and group deletion preserve arsenals", async () => {
  const { env, organizer, player, created, path } = await setup();
  const own = await arsenal(env, organizer.token, "Organizer plays too");
  const result = await (await call(env, organizer.token, `${path}/join`, "POST", {})).json();
  assert.equal(result.members.length, 1);
  assert.equal(result.members[0].arsenalId, own.id);
  assert.equal(result.members[0].isOwn, true);
  await arsenal(env, player.token);
  const rotated = await (await call(env, organizer.token, `${path}/invite`, "POST", {})).json();
  assert.notEqual(rotated.inviteToken, created.inviteToken);
  assert.equal((await call(env, player.token, `${path}/join`, "POST", { inviteToken: created.inviteToken })).status, 403);
  assert.equal((await call(env, player.token, `${path}/join`, "POST", { inviteToken: rotated.inviteToken })).status, 201);
  const event = await (await call(env, organizer.token, `${path}/events`, "POST", { week: 1, title: "Opening night", details: "Six players" })).json();
  assert.equal(event.events[0].title, "Opening night");
  assert.equal((await call(env, player.token, `${path}/events`, "POST", { week: 1, title: "No" })).status, 403);
  assert.equal((await call(env, player.token, path, "DELETE")).status, 403);
  await call(env, organizer.token, path, "DELETE");
  assert.equal(env.DB.database.prepare("SELECT count(*) AS n FROM campaigns").get().n, 2);
  assert.equal(env.DB.database.prepare("SELECT count(*) AS n FROM organizer_members").get().n, 0);
  assert.equal(env.DB.database.prepare("SELECT count(*) AS n FROM organizer_events").get().n, 0);
});

test("legacy import preserves originals, statistics and chronology; public linking never transfers ownership", async () => {
  const { env, organizer, player } = await setup();
  const source = await (await handleCampaignRequest(jsonRequest("https://worker.example/api/campaigns", "POST", {
    name: "Legacy league", dossier: { crew: { name: "Legacy crew" }, campaign: { week: 4, length: 12 } },
  }), env)).json();
  const sourceId = source.campaign.id;
  const legacyRequest = (suffix, body) => handleCampaignRequest(jsonRequest(`https://worker.example/api/campaigns/${sourceId}/${suffix}`, "POST", body, "", { "X-Organizer-Token": source.organizerToken }), env);
  await legacyRequest("players", { playerName: "Old participant", crewName: "Old crew", gamesPlayed: 9, wins: 6, campaignRating: 3, faction: "Guild" });
  await legacyRequest("events", { week: 4, title: "Old event", details: "Still here" });
  assert.equal((await call(env, organizer.token, "/import", "POST", { campaignId: sourceId, organizerToken: "wrong" })).status, 403);
  const body = { campaignId: sourceId, organizerToken: source.organizerToken };
  const imported = await (await call(env, organizer.token, "/import", "POST", body)).json();
  assert.equal(imported.members[0].gamesPlayed, 9);
  assert.equal(imported.members[0].wins, 6);
  assert.equal(imported.members[0].arsenalId, null);
  assert.equal(imported.events[0].title, "Old event");
  assert.equal(imported.campaign.week, 4);
  assert.equal(imported.campaign.duration, 12);
  assert.equal((await (await call(env, organizer.token, "/import", "POST", body)).json()).campaign.id, imported.campaign.id);
  const path = `/${imported.campaign.id}`;
  const linked = await (await call(env, organizer.token, `${path}/members/${imported.members[0].id}`, "PATCH", { playerName: "Old participant", arsenalId: sourceId })).json();
  assert.equal(linked.members[0].arsenalId, sourceId);
  assert.equal((await call(env, player.token, `${path}/members`, "POST", { playerName: "No", arsenalId: sourceId })).status, 403);
  await call(env, organizer.token, path, "DELETE");
  const original = await (await handleCampaignRequest(new Request(`https://worker.example/api/campaigns/${sourceId}`), env)).json();
  assert.equal(original.campaign.dossier.crew.name, "Legacy crew");
  assert.equal(original.players[0].wins, 6);
  assert.equal(original.events.length, 1);
});

test("deleting an arsenal detaches it safely; participant IDs cannot be used across groups", async () => {
  const { env, organizer, player, created, path } = await setup();
  const a = await arsenal(env, player.token);
  const joined = await (await call(env, player.token, `${path}/join`, "POST", { inviteToken: created.inviteToken })).json();
  const second = await (await call(env, organizer.token, "", "POST", { name: "Second" })).json();
  assert.equal((await call(env, organizer.token, `/${second.campaign.id}/members/${joined.members[0].id}/arsenal`)).status, 404);
  env.DB.database.prepare("DELETE FROM campaigns WHERE id = ?").run(a.id);
  const detail = await (await call(env, organizer.token, path)).json();
  assert.equal(detail.members[0].arsenalId, null);
  assert.equal(detail.members[0].canRead, false);
});

test("invalid and oversized requests do not create records", async () => {
  const { env, organizer } = await setup();
  assert.equal((await call(env, organizer.token, "", "POST", { name: "", duration: 8 })).status, 400);
  assert.equal((await call(env, organizer.token, "", "POST", { name: "Bad", duration: -1 })).status, 400);
  assert.equal((await call(env, organizer.token, "", "POST", { name: "Large", notes: "a".repeat(17000) })).status, 413);
});
