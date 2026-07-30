import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";

const ORIGIN = "https://mrgyroscop-beep.github.io";

function environment(overrides = {}) {
  return {
    ALLOWED_ORIGINS: ORIGIN,
    DEEPSEEK_API_KEY: "test-secret",
    DEEPSEEK_MODEL: "deepseek-v4-flash",
    CHAT_RATE_LIMITER: {
      async limit() {
        return { success: true };
      },
    },
    ...overrides,
  };
}

function request(body, options = {}) {
  return new Request("https://worker.example/api/chat", {
    method: options.method || "POST",
    headers: {
      Origin: options.origin || ORIGIN,
      "Content-Type": "application/json",
    },
    body: options.method === "OPTIONS" ? undefined : JSON.stringify(body),
  });
}

test("rejects origins outside the allowlist", async () => {
  const response = await worker.fetch(
    request({ message: "test" }, { origin: "https://example.com" }),
    environment(),
  );
  assert.equal(response.status, 403);
});

test("handles CORS preflight without calling DeepSeek", async () => {
  const response = await worker.fetch(
    request({}, { method: "OPTIONS" }),
    environment(),
  );
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
});

test("rejects an oversized body before reading it", async () => {
  const oversized = new Request("https://worker.example/api/chat", {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      "Content-Type": "application/json",
      "Content-Length": "40000",
    },
    body: JSON.stringify({ message: "test" }),
  });
  const response = await worker.fetch(oversized, environment());
  assert.equal(response.status, 413);
});

test("rate limits by Cloudflare client IP, not a client-controlled session", async () => {
  let receivedKey = "";
  const response = await worker.fetch(
    new Request("https://worker.example/api/chat", {
      method: "POST",
      headers: {
        Origin: ORIGIN,
        "Content-Type": "application/json",
        "CF-Connecting-IP": "203.0.113.7",
      },
      body: JSON.stringify({ message: "test", sessionId: "spoofed-session" }),
    }),
    environment({
      CHAT_RATE_LIMITER: {
        async limit({ key }) {
          receivedKey = key;
          return { success: false };
        },
      },
    }),
  );
  assert.equal(response.status, 429);
  assert.equal(receivedKey, "ip:203.0.113.7");
});

test("does not expose the secret when upstream fails", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response("failure", { status: 500 });

  const response = await worker.fetch(
    request({ message: "How does barter work?", history: [], locale: "en" }),
    environment(),
  );
  const text = await response.text();
  assert.equal(response.status, 502);
  assert.equal(text.includes("test-secret"), false);
  assert.equal(text.includes("failure"), false);
});

test("returns an answer and source pages", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    assert.ok(payload.messages[0].content.includes("RULE_CONTEXT"));
    return Response.json({
      choices: [{ message: { content: "Use a Barter Flip. [стр. 21]" } }],
    });
  };

  const response = await worker.fetch(
    request({ message: "How does barter work?", history: [], locale: "en" }),
    environment(),
  );
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.answer, "Use a Barter Flip. [p. 21]");
  assert.ok(payload.sources.includes(21));
});
