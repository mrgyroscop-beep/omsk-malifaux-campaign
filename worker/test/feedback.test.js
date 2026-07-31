import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { issueSession } from "../src/auth.js";
import {
  handleFeedbackAutomationRequest,
  handleFeedbackRequest,
} from "../src/feedback.js";
import worker from "../src/index.js";

const ORIGIN = "https://mrgyroscop-beep.github.io";
const AUTOMATION_TOKEN = "test-feedback-automation-token-with-enough-entropy";

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
    this.database.exec(
      readFileSync(
        new URL("../migrations/0002_feedback.sql", import.meta.url),
        "utf8",
      ),
    );
  }

  prepare(sql) {
    return new D1Statement(this.database.prepare(sql));
  }
}

function feedbackBody(overrides = {}) {
  return {
    requestId: "bd72f763-bbf4-45aa-a534-e47fb4e18f18",
    category: "bug",
    message: "The chronicle button does not open.",
    contact: "@fatemaster",
    appVersion: "2026.07.31",
    locale: "en",
    section: "chronicle",
    ...overrides,
  };
}

function jsonRequest(url, body, token = "") {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

test("stores feedback with a secure stable ID and idempotent receipt", async () => {
  const env = { DB: new FakeD1() };
  const first = await handleFeedbackRequest(
    jsonRequest("https://worker.example/api/feedback", feedbackBody()),
    env,
  );
  assert.equal(first.status, 201);
  const receipt = await first.json();
  assert.match(receipt.id, /^fb_[0-9a-f-]{36}$/u);
  assert.equal(receipt.duplicate, false);

  const duplicate = await handleFeedbackRequest(
    jsonRequest("https://worker.example/api/feedback", feedbackBody()),
    env,
  );
  assert.equal(duplicate.status, 200);
  assert.deepEqual(await duplicate.json(), { ...receipt, duplicate: true });

  const row = env.DB.database
    .prepare("SELECT category, message, status, attempts FROM feedback")
    .get();
  assert.deepEqual(
    {
      category: row.category,
      message: row.message,
      status: row.status,
      attempts: row.attempts,
    },
    {
      category: "bug",
      message: "The chronicle button does not open.",
      status: "pending",
      attempts: 0,
    },
  );
});

test("rejects request ID reuse with a different payload", async () => {
  const env = { DB: new FakeD1() };
  await handleFeedbackRequest(
    jsonRequest("https://worker.example/api/feedback", feedbackBody()),
    env,
  );
  const conflict = await handleFeedbackRequest(
    jsonRequest(
      "https://worker.example/api/feedback",
      feedbackBody({ message: "A different message using the same request ID." }),
    ),
    env,
  );
  assert.equal(conflict.status, 409);
  assert.deepEqual(await conflict.json(), { error: "request_id_conflict" });
});

test("validates category, message, contact, locale, and context", async () => {
  const cases = [
    { category: "security" },
    { message: "short" },
    { contact: "x".repeat(181) },
    { locale: "fr" },
    { section: "" },
  ];
  for (const [index, override] of cases.entries()) {
    const env = { DB: new FakeD1() };
    const response = await handleFeedbackRequest(
      jsonRequest(
        "https://worker.example/api/feedback",
        feedbackBody({
          requestId: `bd72f763-bbf4-45aa-a534-e47fb4e18f1${index}`,
          ...override,
        }),
      ),
      env,
    );
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_feedback" });
  }
});

test("claims and acknowledges feedback with the default 15 minute lease", async () => {
  const env = { DB: new FakeD1(), FEEDBACK_AUTOMATION_TOKEN: AUTOMATION_TOKEN };
  await handleFeedbackRequest(
    jsonRequest("https://worker.example/api/feedback", feedbackBody()),
    env,
  );

  const claimed = await handleFeedbackAutomationRequest(
    jsonRequest(
      "https://worker.example/api/feedback/automation/claim",
      { limit: 1 },
      AUTOMATION_TOKEN,
    ),
    env,
  );
  assert.equal(claimed.status, 200);
  const claim = await claimed.json();
  assert.equal(claim.leaseSeconds, 900);
  assert.equal(claim.items.length, 1);
  assert.equal(claim.items[0].message, feedbackBody().message);
  assert.match(claim.items[0].claimToken, /^[0-9a-f-]{36}$/u);

  const acknowledged = await handleFeedbackAutomationRequest(
    jsonRequest(
      `https://worker.example/api/feedback/automation/${claim.items[0].id}/ack`,
      { claimToken: claim.items[0].claimToken },
      AUTOMATION_TOKEN,
    ),
    env,
  );
  assert.equal(acknowledged.status, 200);
  assert.equal((await acknowledged.json()).status, "delivered");
  assert.equal(
    env.DB.database.prepare("SELECT status FROM feedback").get().status,
    "delivered",
  );
});

test("supports retry and ignored outcomes and rejects stale claim tokens", async () => {
  const env = { DB: new FakeD1(), FEEDBACK_AUTOMATION_TOKEN: AUTOMATION_TOKEN };
  await handleFeedbackRequest(
    jsonRequest("https://worker.example/api/feedback", feedbackBody()),
    env,
  );
  const firstClaim = await (
    await handleFeedbackAutomationRequest(
      jsonRequest(
        "https://worker.example/api/feedback/automation/claim",
        { limit: 1 },
        AUTOMATION_TOKEN,
      ),
      env,
    )
  ).json();
  const item = firstClaim.items[0];
  const retried = await handleFeedbackAutomationRequest(
    jsonRequest(
      `https://worker.example/api/feedback/automation/${item.id}/retry`,
      { claimToken: item.claimToken, retryAfterSeconds: 0, error: "jira_unavailable" },
      AUTOMATION_TOKEN,
    ),
    env,
  );
  assert.equal(retried.status, 200);
  assert.equal((await retried.json()).status, "retry");

  const stale = await handleFeedbackAutomationRequest(
    jsonRequest(
      `https://worker.example/api/feedback/automation/${item.id}/ack`,
      { claimToken: item.claimToken },
      AUTOMATION_TOKEN,
    ),
    env,
  );
  assert.equal(stale.status, 409);

  const secondClaim = await (
    await handleFeedbackAutomationRequest(
      jsonRequest(
        "https://worker.example/api/feedback/automation/claim",
        { limit: 1 },
        AUTOMATION_TOKEN,
      ),
      env,
    )
  ).json();
  const ignored = await handleFeedbackAutomationRequest(
    jsonRequest(
      `https://worker.example/api/feedback/automation/${item.id}/ignored`,
      { claimToken: secondClaim.items[0].claimToken },
      AUTOMATION_TOKEN,
    ),
    env,
  );
  assert.equal(ignored.status, 200);
  assert.equal((await ignored.json()).status, "ignored");
});

test("automation API is private and server-to-server requests need no Origin", async () => {
  const env = {
    ALLOWED_ORIGINS: ORIGIN,
    DB: new FakeD1(),
    FEEDBACK_AUTOMATION_TOKEN: AUTOMATION_TOKEN,
  };
  const denied = await worker.fetch(
    jsonRequest(
      "https://worker.example/api/feedback/automation/claim",
      {},
      "wrong-token",
    ),
    env,
  );
  assert.equal(denied.status, 401);
  assert.equal(denied.headers.get("Access-Control-Allow-Origin"), null);

  const allowed = await worker.fetch(
    jsonRequest(
      "https://worker.example/api/feedback/automation/claim",
      {},
      AUTOMATION_TOKEN,
    ),
    env,
  );
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("Access-Control-Allow-Origin"), null);
});

test("user feedback requires the origin-bound session and its own limiter", async () => {
  let rateLimitKey = "";
  const env = {
    ALLOWED_ORIGINS: ORIGIN,
    DB: new FakeD1(),
    SESSION_SIGNING_KEY: "test-session-signing-key-with-enough-entropy",
    FEEDBACK_RATE_LIMITER: {
      async limit({ key }) {
        rateLimitKey = key;
        return { success: false };
      },
    },
  };
  const token = await issueSession(env, ORIGIN);
  const request = new Request("https://worker.example/api/feedback", {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "CF-Connecting-IP": "203.0.113.23",
    },
    body: JSON.stringify(feedbackBody()),
  });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 429);
  assert.equal(rateLimitKey, "feedback:203.0.113.23");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
});

test("user feedback cannot bypass the origin-bound session", async () => {
  let limiterCalls = 0;
  const env = {
    ALLOWED_ORIGINS: ORIGIN,
    DB: new FakeD1(),
    SESSION_SIGNING_KEY: "test-session-signing-key-with-enough-entropy",
    FEEDBACK_RATE_LIMITER: {
      async limit() {
        limiterCalls += 1;
        return { success: true };
      },
    },
  };
  const response = await worker.fetch(
    new Request("https://worker.example/api/feedback", {
      method: "POST",
      headers: {
        Origin: ORIGIN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(feedbackBody()),
    }),
    env,
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "session_required" });
  assert.equal(limiterCalls, 0);
  assert.equal(
    env.DB.database.prepare("SELECT count(*) AS count FROM feedback").get().count,
    0,
  );
});
