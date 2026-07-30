import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { handleCampaignRequest } from "../src/campaigns.js";

class D1Statement {
  constructor(statement) {
    this.statement = statement;
    this.parameters = [];
  }

  bind(...parameters) {
    this.parameters = parameters;
    return this;
  }

  async first() {
    return this.statement.get(...this.parameters) || null;
  }

  async all() {
    return { results: this.statement.all(...this.parameters) };
  }

  async run() {
    const result = this.statement.run(...this.parameters);
    return {
      success: true,
      meta: { changes: Number(result.changes || 0) },
    };
  }
}

class FakeD1 {
  constructor() {
    this.database = new DatabaseSync(":memory:");
    const migration = readFileSync(
      new URL("../migrations/0001_cloud_campaigns.sql", import.meta.url),
      "utf8",
    );
    this.database.exec(migration);
  }

  prepare(sql) {
    return new D1Statement(this.database.prepare(sql));
  }
}

function jsonRequest(url, method, body, organizerToken = "") {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(organizerToken ? { "X-Organizer-Token": organizerToken } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test("creates, reads, and revision-protects a cloud dossier", async () => {
  const env = { DB: new FakeD1() };
  const createdResponse = await handleCampaignRequest(
    jsonRequest("https://worker.example/api/campaigns", "POST", {
      name: "Omsk campaign",
      dossier: { crew: { name: "Red Ledger" }, games: [] },
    }),
    env,
  );
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.equal(created.campaign.name, "Omsk campaign");
  assert.equal(created.campaign.revision, 1);
  assert.equal(created.campaign.dossier.crew.name, "Red Ledger");
  assert.equal(created.organizerToken.length > 40, true);

  const id = created.campaign.id;
  const publicResponse = await handleCampaignRequest(
    new Request(`https://worker.example/api/campaigns/${id}`),
    env,
  );
  assert.equal(publicResponse.status, 200);
  const publicPayload = await publicResponse.json();
  assert.equal(publicPayload.campaign.id, id);
  assert.equal("organizerToken" in publicPayload, false);

  const verifiedResponse = await handleCampaignRequest(
    jsonRequest(
      `https://worker.example/api/campaigns/${id}/organizer`,
      "POST",
      {},
      created.organizerToken,
    ),
    env,
  );
  assert.equal(verifiedResponse.status, 200);
  assert.deepEqual(await verifiedResponse.json(), { organizer: true });

  const updatedResponse = await handleCampaignRequest(
    jsonRequest(
      `https://worker.example/api/campaigns/${id}`,
      "PUT",
      {
        revision: 1,
        dossier: { crew: { name: "Second copy" }, games: [] },
      },
      created.organizerToken,
    ),
    env,
  );
  assert.equal(updatedResponse.status, 200);
  const updated = await updatedResponse.json();
  assert.equal(updated.campaign.revision, 2);
  assert.equal(updated.campaign.dossier.crew.name, "Second copy");

  const conflictResponse = await handleCampaignRequest(
    jsonRequest(
      `https://worker.example/api/campaigns/${id}`,
      "PUT",
      { revision: 1, dossier: { crew: { name: "Stale copy" } } },
      created.organizerToken,
    ),
    env,
  );
  assert.equal(conflictResponse.status, 409);
  assert.equal((await conflictResponse.json()).currentRevision, 2);
});

test("deletes a cloud campaign and its shared records with the organizer key", async () => {
  const env = { DB: new FakeD1() };
  const createdResponse = await handleCampaignRequest(
    jsonRequest("https://worker.example/api/campaigns", "POST", {
      name: "Disposable campaign",
      dossier: { crew: { name: "Temporary crew" } },
    }),
    env,
  );
  const created = await createdResponse.json();
  const id = created.campaign.id;

  const deletedResponse = await handleCampaignRequest(
    jsonRequest(
      `https://worker.example/api/campaigns/${id}`,
      "DELETE",
      undefined,
      created.organizerToken,
    ),
    env,
  );
  assert.equal(deletedResponse.status, 204);

  const missingResponse = await handleCampaignRequest(
    new Request(`https://worker.example/api/campaigns/${id}`),
    env,
  );
  assert.equal(missingResponse.status, 404);
});
test("maintains the shared player table and chronicle", async () => {
  const env = { DB: new FakeD1() };
  const created = await (
    await handleCampaignRequest(
      jsonRequest("https://worker.example/api/campaigns", "POST", {
        name: "Shared campaign",
        dossier: {},
      }),
      env,
    )
  ).json();
  const id = created.campaign.id;
  const token = created.organizerToken;

  const playerResponse = await handleCampaignRequest(
    jsonRequest(
      `https://worker.example/api/campaigns/${id}/players`,
      "POST",
      {
        playerName: "Alice",
        crewName: "Marshals",
        faction: "Guild",
        campaignRating: 31,
        gamesPlayed: 2,
        wins: 1,
        notes: "Organizer",
      },
      token,
    ),
    env,
  );
  assert.equal(playerResponse.status, 201);
  const withPlayer = await playerResponse.json();
  assert.equal(withPlayer.players.length, 1);
  assert.equal(withPlayer.players[0].campaignRating, 31);

  const eventResponse = await handleCampaignRequest(
    jsonRequest(
      `https://worker.example/api/campaigns/${id}/events`,
      "POST",
      {
        week: 2,
        type: "game",
        title: "Marshals vs. Foundry",
        details: "A narrow Guild victory.",
      },
      token,
    ),
    env,
  );
  assert.equal(eventResponse.status, 201);
  const withEvent = await eventResponse.json();
  assert.equal(withEvent.events.length, 1);
  assert.equal(withEvent.events[0].week, 2);

  const deniedResponse = await handleCampaignRequest(
    jsonRequest(
      `https://worker.example/api/campaigns/${id}/players`,
      "POST",
      { playerName: "Mallory" },
      "wrong-organizer-token-that-is-long-enough-to-test",
    ),
    env,
  );
  assert.equal(deniedResponse.status, 403);
  assert.equal((await deniedResponse.json()).error, "organizer_required");
});
