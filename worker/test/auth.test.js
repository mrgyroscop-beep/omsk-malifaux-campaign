import assert from "node:assert/strict";
import test from "node:test";

import {
  issueSession,
  sha256Hex,
  validateTurnstile,
  verifySession,
} from "../src/auth.js";

const ORIGIN = "https://mrgyroscop-beep.github.io";
const ENV = {
  SESSION_SIGNING_KEY: "test-session-signing-key-with-enough-entropy",
  TURNSTILE_SECRET: "turnstile-secret",
};

test("issues an origin-bound session and rejects tampering", async () => {
  const token = await issueSession(ENV, ORIGIN);
  const valid = await verifySession(
    new Request("https://worker.example", {
      headers: { Authorization: `Bearer ${token}` },
    }),
    ENV,
    ORIGIN,
  );
  assert.equal(valid.origin, ORIGIN);
  assert.equal(typeof valid.sid, "string");

  const [encoded, signature] = token.split(".");
  const tamperedSignature = `${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
  const invalid = await verifySession(
    new Request("https://worker.example", {
      headers: { Authorization: `Bearer ${encoded}.${tamperedSignature}` },
    }),
    ENV,
    ORIGIN,
  );
  assert.equal(invalid, null);
});
test("hashes organizer keys without storing the raw value", async () => {
  const hash = await sha256Hex("organizer-key");
  assert.equal(hash.length, 64);
  assert.equal(hash.includes("organizer-key"), false);
});

test("validates Turnstile server-side with action and hostname", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    assert.equal(options.method, "POST");
    assert.equal(options.body.get("secret"), "turnstile-secret");
    assert.equal(options.body.get("response"), "turnstile-response-token");
    return Response.json({
      success: true,
      action: "api_session",
      hostname: "mrgyroscop-beep.github.io",
    });
  };

  const result = await validateTurnstile(
    new Request("https://worker.example", {
      headers: { "CF-Connecting-IP": "203.0.113.8" },
    }),
    ENV,
    "turnstile-response-token",
    ORIGIN,
  );
  assert.deepEqual(result, { success: true });
});

test("rejects Turnstile tokens without the bound action and hostname", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => Response.json({ success: true });

  const result = await validateTurnstile(
    new Request("https://worker.example"),
    ENV,
    "turnstile-response-token",
    ORIGIN,
  );
  assert.deepEqual(result, { success: false, error: "turnstile_failed" });
});
