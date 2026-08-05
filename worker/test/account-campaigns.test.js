import assert from "node:assert/strict";
import test from "node:test";

import { handleAccountCampaignRequest } from "../src/account-campaigns.js";
import { sha256Hex } from "../src/auth.js";
import { handleCampaignRequest } from "../src/campaigns.js";
import { FakeD1, jsonRequest, registerUser } from "./test-db.js";

const localDossier = {
  version: 5,
  crew: { name: "Local Tide", faction: "Neverborn" },
  leader: { name: "Harbour Witch", xp: 3, advances: [{ id: "advance-1" }] },
  arsenal: { models: [] },
  games: [],
};

test("imports a local dossier once and automatically updates it with revision protection", async () => {
  const env = { DB: new FakeD1() };
  const { token } = await registerUser(env);
  const created = await handleAccountCampaignRequest(
    jsonRequest(
      "https://worker.example/api/account/campaign",
      "PUT",
      { revision: 0, name: "Local Tide", dossier: localDossier },
      token,
    ),
    env,
  );
  assert.equal(created.status, 201);
  const first = (await created.json()).campaign;
  assert.equal(first.revision, 1);
  assert.equal(first.dossier.leader.advances.length, 1);

  const updatedDossier = structuredClone(localDossier);
  updatedDossier.leader.xp = 4;
  const updated = await handleAccountCampaignRequest(
    jsonRequest(
      "https://worker.example/api/account/campaign",
      "PUT",
      { revision: 1, name: "Local Tide", dossier: updatedDossier },
      token,
    ),
    env,
  );
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).campaign.revision, 2);

  const stale = await handleAccountCampaignRequest(
    jsonRequest(
      "https://worker.example/api/account/campaign",
      "PUT",
      { revision: 1, name: "Stale", dossier: { crew: { name: "Lost" } } },
      token,
    ),
    env,
  );
  assert.equal(stale.status, 409);
  const conflict = await stale.json();
  assert.equal(conflict.error, "revision_conflict");
  assert.equal(conflict.campaign.dossier.leader.xp, 4);
});

test("isolates account campaigns by owner and hides them from legacy public routes", async () => {
  const env = { DB: new FakeD1() };
  const first = await registerUser(env, "first@example.com");
  const second = await registerUser(env, "second@example.com");
  const created = await (
    await handleAccountCampaignRequest(
      jsonRequest(
        "https://worker.example/api/account/campaign",
        "PUT",
        { revision: 0, name: "Private", dossier: localDossier },
        first.token,
      ),
      env,
    )
  ).json();

  const otherUser = await handleAccountCampaignRequest(
    jsonRequest("https://worker.example/api/account/campaign", "GET", undefined, second.token),
    env,
  );
  assert.deepEqual(await otherUser.json(), { campaign: null });

  const publicRead = await handleCampaignRequest(
    new Request(`https://worker.example/api/campaigns/${created.campaign.id}`),
    env,
  );
  assert.equal(publicRead.status, 404);

  const leakedOrganizerToken = "known-organizer-token-that-is-long-enough";
  env.DB.database
    .prepare("UPDATE campaigns SET organizer_token_hash = ? WHERE id = ?")
    .run(await sha256Hex(leakedOrganizerToken), created.campaign.id);
  const legacyMutation = await handleCampaignRequest(
    jsonRequest(
      `https://worker.example/api/campaigns/${created.campaign.id}`,
      "PUT",
      { revision: 1, dossier: { crew: { name: "Intruder" } } },
      "",
      { "X-Organizer-Token": leakedOrganizerToken },
    ),
    env,
  );
  assert.equal(legacyMutation.status, 404);
});

test("keeps guest/manual cloud sharing compatible", async () => {
  const env = { DB: new FakeD1() };
  const created = await handleCampaignRequest(
    jsonRequest("https://worker.example/api/campaigns", "POST", {
      name: "Manual sharing",
      dossier: { crew: { name: "Guest Crew" } },
    }),
    env,
  );
  assert.equal(created.status, 201);
  const payload = await created.json();
  const publicRead = await handleCampaignRequest(
    new Request(`https://worker.example/api/campaigns/${payload.campaign.id}`),
    env,
  );
  assert.equal(publicRead.status, 200);
  assert.equal((await publicRead.json()).campaign.dossier.crew.name, "Guest Crew");
});

test("claims the same legacy campaign with its organizer key and preserves sharing", async () => {
  const env = { DB: new FakeD1() };
  const legacyResponse = await handleCampaignRequest(
    jsonRequest("https://worker.example/api/campaigns", "POST", {
      name: "Old shared file",
      dossier: { ...localDossier, crew: { ...localDossier.crew, name: "Old shared file" } },
    }),
    env,
  );
  const legacy = await legacyResponse.json();
  const owner = await registerUser(env, "owner@example.com");
  const outsider = await registerUser(env, "outsider@example.com");

  const denied = await handleAccountCampaignRequest(
    jsonRequest(
      "https://worker.example/api/account/campaign/claim",
      "POST",
      { campaignId: legacy.campaign.id },
      owner.token,
      { "X-Organizer-Token": "wrong-organizer-token-that-is-long-enough" },
    ),
    env,
  );
  assert.equal(denied.status, 403);
  assert.equal(env.DB.database.prepare("SELECT owner_user_id FROM campaigns WHERE id = ?").get(legacy.campaign.id).owner_user_id, null);

  const claimed = await handleAccountCampaignRequest(
    jsonRequest(
      "https://worker.example/api/account/campaign/claim",
      "POST",
      { campaignId: legacy.campaign.id },
      owner.token,
      { "X-Organizer-Token": legacy.organizerToken },
    ),
    env,
  );
  assert.equal(claimed.status, 200);
  const claimedCampaign = (await claimed.json()).campaign;
  assert.equal(claimedCampaign.id, legacy.campaign.id);
  assert.equal(claimedCampaign.accessMode, "legacy_public");

  const accountRead = await handleAccountCampaignRequest(
    jsonRequest("https://worker.example/api/account/campaign", "GET", undefined, owner.token),
    env,
  );
  assert.equal((await accountRead.json()).campaign.id, legacy.campaign.id);

  const outsiderRead = await handleAccountCampaignRequest(
    jsonRequest("https://worker.example/api/account/campaign", "GET", undefined, outsider.token),
    env,
  );
  assert.deepEqual(await outsiderRead.json(), { campaign: null });
  const outsiderClaim = await handleAccountCampaignRequest(
    jsonRequest(
      "https://worker.example/api/account/campaign/claim",
      "POST",
      { campaignId: legacy.campaign.id },
      outsider.token,
      { "X-Organizer-Token": legacy.organizerToken },
    ),
    env,
  );
  assert.equal(outsiderClaim.status, 403);

  const publicRead = await handleCampaignRequest(
    new Request(`https://worker.example/api/campaigns/${legacy.campaign.id}`),
    env,
  );
  assert.equal(publicRead.status, 200);
  assert.equal((await publicRead.json()).campaign.name, "Old shared file");

  const organizerUpdate = await handleCampaignRequest(
    jsonRequest(
      `https://worker.example/api/campaigns/${legacy.campaign.id}`,
      "PUT",
      {
        revision: legacy.campaign.revision,
        name: "Old shared file",
        dossier: { ...localDossier, crew: { ...localDossier.crew, name: "Still shared" } },
      },
      "",
      { "X-Organizer-Token": legacy.organizerToken },
    ),
    env,
  );
  assert.equal(organizerUpdate.status, 200);
  assert.equal((await organizerUpdate.json()).campaign.dossier.crew.name, "Still shared");
});

test("handles a first-save owner race without duplicate dossiers", async () => {
  const env = { DB: new FakeD1() };
  const { token } = await registerUser(env);
  const request = () =>
    jsonRequest(
      "https://worker.example/api/account/campaign",
      "PUT",
      { revision: 0, name: "Racing", dossier: localDossier },
      token,
    );
  const responses = await Promise.all([
    handleAccountCampaignRequest(request(), env),
    handleAccountCampaignRequest(request(), env),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  assert.equal(
    env.DB.database
      .prepare("SELECT count(*) AS count FROM campaigns WHERE owner_user_id IS NOT NULL")
      .get().count,
    1,
  );
});

test("bounds streamed account dossier JSON without trusting Content-Length", async () => {
  const env = { DB: new FakeD1() };
  const { token } = await registerUser(env);
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(200_000));
      controller.enqueue(new Uint8Array(110_000));
    },
    cancel() {
      cancelled = true;
    },
  });
  const response = await handleAccountCampaignRequest(
    new Request("https://worker.example/api/account/campaign", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "10",
        "X-Account-Session": token,
      },
      body,
      duplex: "half",
    }),
    env,
  );
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "request_too_large" });
  assert.equal(cancelled, true);
});
