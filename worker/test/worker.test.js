import assert from "node:assert/strict";
import test from "node:test";

import { issueSession } from "../src/auth.js";
import worker from "../src/index.js";

const ORIGIN = "https://mrgyroscop-beep.github.io";

function environment(overrides = {}) {
  return {
    ALLOWED_ORIGINS: ORIGIN,
    CLOUDFLARE_ACCOUNT_ID: "account-id",
    AI_GATEWAY_ID: "default",
    DEEPSEEK_API_KEY: "test-secret",
    AI_GATEWAY_TOKEN: "test-gateway-token",
    DEEPSEEK_MODEL: "deepseek-v4-flash",
    SESSION_SIGNING_KEY: "test-session-signing-key-with-enough-entropy",
    CHAT_RATE_LIMITER: {
      async limit() {
        return { success: true };
      },
    },
    API_RATE_LIMITER: {
      async limit() {
        return { success: true };
      },
    },
    ...overrides,
  };
}

async function request(body, options = {}) {
  const env = options.env || environment();
  const token = options.withoutSession ? "" : await issueSession(env, ORIGIN);
  return new Request(options.url || "https://worker.example/api/chat", {
    method: options.method || "POST",
    headers: {
      Origin: options.origin || ORIGIN,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.method === "OPTIONS" ? undefined : JSON.stringify(body),
  });
}

test("rejects origins outside the allowlist", async () => {
  const env = environment();
  const response = await worker.fetch(
    await request(
      { message: "test" },
      { origin: "https://example.com", env },
    ),
    env,
  );
  assert.equal(response.status, 403);
});

test("handles CORS preflight and exposes application headers", async () => {
  const env = environment();
  const response = await worker.fetch(
    await request({}, { method: "OPTIONS", env }),
    env,
  );
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  assert.match(response.headers.get("Access-Control-Allow-Methods"), /GET/u);
  assert.match(response.headers.get("Access-Control-Allow-Headers"), /X-Organizer-Token/u);
});

test("requires a verified anonymous session for chat", async () => {
  const env = environment();
  const response = await worker.fetch(
    await request({ message: "test" }, { withoutSession: true, env }),
    env,
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "session_required" });
});

test("rejects an oversized body before parsing it", async () => {
  const env = environment();
  const token = await issueSession(env, ORIGIN);
  const oversized = new Request("https://worker.example/api/chat", {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Length": "40000",
    },
    body: JSON.stringify({ message: "test" }),
  });
  const response = await worker.fetch(oversized, env);
  assert.equal(response.status, 413);
});

test("rate limits chat by Cloudflare client IP", async () => {
  let receivedKey = "";
  const env = environment({
    CHAT_RATE_LIMITER: {
      async limit({ key }) {
        receivedKey = key;
        return { success: false };
      },
    },
  });
  const response = await worker.fetch(
    await request(
      { message: "test", sessionId: "spoofed-session" },
      {
        env,
        headers: { "CF-Connecting-IP": "203.0.113.7" },
      },
    ),
    env,
  );
  assert.equal(response.status, 429);
  assert.equal(receivedKey, "chat:203.0.113.7");
});

test("rate limits public cloud reads by Cloudflare client IP", async () => {
  let receivedKey = "";
  const env = environment({
    API_RATE_LIMITER: {
      async limit({ key }) {
        receivedKey = key;
        return { success: false };
      },
    },
  });
  const response = await worker.fetch(
    new Request("https://worker.example/api/campaigns/abcdefghijkl", {
      headers: {
        Origin: ORIGIN,
        "CF-Connecting-IP": "203.0.113.9",
      },
    }),
    env,
  );
  assert.equal(response.status, 429);
  assert.equal(receivedKey, "cloud:203.0.113.9");
});

test("rate limits BiggerHat proxy reads by Cloudflare client IP", async () => {
  let receivedKey = "";
  const env = environment({
    API_RATE_LIMITER: {
      async limit({ key }) {
        receivedKey = key;
        return { success: false };
      },
    },
  });
  const response = await worker.fetch(
    new Request(
      "https://worker.example/api/biggerhat/v1/characters?page=1&per_page=100&game_mode_type=standard",
      {
        headers: {
          Origin: ORIGIN,
          "CF-Connecting-IP": "203.0.113.10",
        },
      },
    ),
    env,
  );
  assert.equal(response.status, 429);
  assert.equal(receivedKey, "biggerhat:203.0.113.10");
});

test("routes DeepSeek through AI Gateway without logging payloads", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url, options) => {
    assert.equal(
      url,
      "https://gateway.ai.cloudflare.com/v1/account-id/default/deepseek/chat/completions",
    );
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    assert.equal(
      options.headers["cf-aig-authorization"],
      "Bearer test-gateway-token",
    );
    assert.equal(options.headers["cf-aig-collect-log-payload"], "false");
    assert.equal(options.headers["cf-aig-cache-ttl"], "86400");
    assert.equal(options.headers["cf-aig-request-timeout"], "18000");
    assert.equal(options.headers["cf-aig-max-attempts"], "3");
    assert.equal(options.headers["cf-aig-retry-delay"], "500");
    assert.equal(options.headers["cf-aig-backoff"], "exponential");
    assert.equal(options.headers["cf-aig-skip-cache"], undefined);
    const payload = JSON.parse(options.body);
    assert.ok(payload.messages[0].content.includes("RULE_CONTEXT"));
    return Response.json({
      choices: [{ message: { content: "Use a Barter Flip. [стр. 21]" } }],
    });
  };

  const env = environment();
  const response = await worker.fetch(
    await request(
      { message: "How does barter work?", history: [], locale: "en" },
      { env },
    ),
    env,
  );
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.answer, "Use a Barter Flip. [p. 21]");
  assert.ok(payload.sources.includes(21));
});

test("falls back directly to DeepSeek when AI Gateway is unavailable", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  context.after(() => {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  });
  console.warn = () => {};
  const endpoints = [];
  globalThis.fetch = async (url, options) => {
    endpoints.push(url);
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    if (endpoints.length === 1) {
      return new Response("gateway unavailable", { status: 503 });
    }
    assert.equal(url, "https://api.deepseek.com/chat/completions");
    assert.equal(options.headers["cf-aig-cache-ttl"], undefined);
    assert.equal(options.headers["cf-aig-authorization"], undefined);
    return Response.json({
      choices: [{ message: { content: "Use a Barter Flip. [стр. 21]" } }],
    });
  };

  const env = environment();
  const response = await worker.fetch(
    await request(
      { message: "How does barter work?", history: [], locale: "en" },
      { env },
    ),
    env,
  );
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.answer, "Use a Barter Flip. [p. 21]");
  assert.deepEqual(endpoints, [
    "https://gateway.ai.cloudflare.com/v1/account-id/default/deepseek/chat/completions",
    "https://api.deepseek.com/chat/completions",
  ]);
});

test("falls back directly when AI Gateway rejects gateway authentication", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  context.after(() => {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  });
  console.warn = () => {};
  const endpoints = [];
  globalThis.fetch = async (url, options) => {
    endpoints.push(url);
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    if (endpoints.length === 1) {
      return new Response("gateway authentication required", { status: 401 });
    }
    assert.equal(url, "https://api.deepseek.com/chat/completions");
    return Response.json({
      choices: [{ message: { content: "Use a Barter Flip. [p. 21]" } }],
    });
  };

  const env = environment();
  const response = await worker.fetch(
    await request(
      { message: "How does barter work?", history: [], locale: "en" },
      { env },
    ),
    env,
  );
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.answer, "Use a Barter Flip. [p. 21]");
  assert.deepEqual(endpoints, [
    "https://gateway.ai.cloudflare.com/v1/account-id/default/deepseek/chat/completions",
    "https://api.deepseek.com/chat/completions",
  ]);
});

test("does not bypass provider rate limits through the direct fallback", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  context.after(() => {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  });
  console.error = () => {};
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response("rate limited", { status: 429 });
  };

  const env = environment();
  const response = await worker.fetch(
    await request(
      { message: "How does barter work?", history: [], locale: "en" },
      { env },
    ),
    env,
  );
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "upstream_rate_limited" });
  assert.equal(calls, 1);
});

test("does not expose secrets when upstream fails", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const originalError = console.error;
  context.after(() => {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    console.error = originalError;
  });
  console.warn = () => {};
  console.error = () => {};
  globalThis.fetch = async () => new Response("failure", { status: 500 });

  const env = environment();
  const response = await worker.fetch(
    await request(
      { message: "How does barter work?", history: [], locale: "en" },
      { env },
    ),
    env,
  );
  const text = await response.text();
  assert.equal(response.status, 502);
  assert.equal(text.includes("test-secret"), false);
  assert.equal(text.includes("failure"), false);
});

test("instructs the answer model to recover Russian slang", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  let call = 0;
  globalThis.fetch = async (_url, options) => {
    call += 1;
    const payload = JSON.parse(options.body);
    if (call === 1) {
      assert.equal(options.headers["cf-aig-cache-ttl"], "604800");
      assert.ok(payload.messages[0].content.includes('"ростер"'));
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                terms: ["starting arsenal", "soulstones", "encounter size"],
              }),
            },
          },
        ],
      });
    }
    assert.equal(options.headers["cf-aig-cache-ttl"], "86400");
    assert.ok(payload.messages[0].content.includes("Do not say that a user's word is absent"));
    return Response.json({
      choices: [
        {
          message: {
            content: "Стартовый арсенал собирается на 25 камней; лидер бесплатный. [стр. 15]",
          },
        },
      ],
    });
  };

  const env = environment();
  const response = await worker.fetch(
    await request(
      {
        message: "На сколько камней собирать ростер?",
        history: [],
        locale: "ru",
      },
      { env },
    ),
    env,
  );
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.match(payload.answer, /25 камней/u);
  assert.equal(call, 2);
});
