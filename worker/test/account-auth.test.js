import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  accountAuthConfig,
  handleAccountAuthRequest,
} from "../src/account-auth.js";
import { FakeD1, jsonRequest, registerUser } from "./test-db.js";

function env() {
  return { DB: new FakeD1() };
}

function resetEnv() {
  return {
    DB: new FakeD1(),
    BREVO_API_KEY: "test-brevo-key",
    BREVO_FROM_EMAIL: "archive@example.com",
    BREVO_FROM_NAME: "Malifaux Archive",
    PASSWORD_RESET_BASE_URL: "https://campaign.example/",
  };
}

test("replays all migrations on an empty D1 database", () => {
  const database = new DatabaseSync(":memory:");
  for (const name of [
    "0001_cloud_campaigns.sql",
    "0002_feedback.sql",
    "0003_accounts.sql",
    "0004_password_resets.sql",
  ]) {
    database.exec(readFileSync(new URL(`../migrations/${name}`, import.meta.url), "utf8"));
  }
  const tables = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row) => row.name);
  assert.ok(tables.includes("users"));
  assert.ok(tables.includes("account_sessions"));
  assert.ok(tables.includes("auth_attempts"));
  assert.ok(tables.includes("password_reset_tokens"));
  assert.equal(
    database.prepare("PRAGMA table_info(campaigns)").all().some((row) => row.name === "owner_user_id"),
    true,
  );
  assert.equal(
    database.prepare("PRAGMA table_info(campaigns)").all().some((row) => row.name === "access_mode"),
    true,
  );
});

test("uses a PBKDF2 work factor compatible with the production Worker CPU budget", () => {
  assert.equal(accountAuthConfig.algorithm, "PBKDF2-SHA-256");
  assert.equal(accountAuthConfig.version, 1);
  assert.equal(accountAuthConfig.iterations, 100_000);
});

test("registers with a normalized unique email and versioned password hash", async () => {
  const environment = env();
  const response = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/register", "POST", {
      email: "  Captain@Example.COM ",
      password: "correct horse battery staple",
      displayName: "  Captain  ",
    }),
    environment,
  );
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.user.email, "captain@example.com");
  assert.equal(payload.user.displayName, "Captain");
  assert.match(payload.token, /^[A-Za-z0-9_-]{43}$/u);
  assert.equal("password" in payload, false);

  const user = environment.DB.database.prepare("SELECT * FROM users").get();
  assert.equal(user.email_normalized, "captain@example.com");
  assert.equal(user.password_algorithm, "PBKDF2-SHA-256");
  assert.equal(user.password_version, 1);
  assert.equal(user.password_iterations, 100_000);
  assert.equal(user.password_hash.includes("correct horse"), false);
  assert.equal(user.password_salt.length > 20, true);
  const storedSession = environment.DB.database
    .prepare("SELECT token_hash FROM account_sessions")
    .get();
  assert.equal(storedSession.token_hash.length, 64);
  assert.notEqual(storedSession.token_hash, payload.token);
});

test("rejects duplicate normalized email without exposing an account lookup response", async () => {
  const environment = env();
  await registerUser(environment, "captain@example.com");
  const duplicate = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/register", "POST", {
      email: "CAPTAIN@example.com",
      password: "a different secure password",
      displayName: "Another",
    }),
    environment,
  );
  assert.equal(duplicate.status, 409);
  assert.deepEqual(await duplicate.json(), { error: "registration_unavailable" });
  assert.equal(environment.DB.database.prepare("SELECT count(*) AS count FROM users").get().count, 1);
});

test("logs in, restores after reload, and immediately revokes logout", async () => {
  const environment = env();
  await registerUser(environment);
  const login = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/login", "POST", {
      email: "captain@example.com",
      password: "correct horse battery staple",
    }),
    environment,
  );
  assert.equal(login.status, 200);
  const loggedIn = await login.json();

  const restored = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/me", "GET", undefined, loggedIn.token),
    environment,
  );
  const restoredPayload = await restored.json();
  assert.equal(restoredPayload.user.email, "captain@example.com");
  assert.equal("token" in restoredPayload, false);

  const authorizationOnly = await handleAccountAuthRequest(
    jsonRequest(
      "https://worker.example/api/auth/me",
      "GET",
      undefined,
      "",
      { Authorization: `Bearer ${loggedIn.token}` },
    ),
    environment,
  );
  assert.deepEqual(await authorizationOnly.json(), { user: null });

  const logout = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/logout", "POST", {}, loggedIn.token),
    environment,
  );
  assert.equal(logout.status, 200);
  const revoked = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/me", "GET", undefined, loggedIn.token),
    environment,
  );
  assert.deepEqual(await revoked.json(), { user: null });
  assert.ok(environment.DB.database.prepare("SELECT revoked_at FROM account_sessions WHERE token_hash IS NOT NULL ORDER BY created_at DESC").get().revoked_at);
});

test("uses neutral errors for wrong passwords and rate limits before further hashing", async () => {
  const environment = env();
  await registerUser(environment);
  for (let attempt = 0; attempt < accountAuthConfig.attemptLimit; attempt += 1) {
    const response = await handleAccountAuthRequest(
      jsonRequest(
        "https://worker.example/api/auth/login",
        "POST",
        { email: "captain@example.com", password: "wrong password" },
        "",
        { "CF-Connecting-IP": "203.0.113.5" },
      ),
      environment,
    );
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "invalid_credentials" });
  }
  const limited = await handleAccountAuthRequest(
    jsonRequest(
      "https://worker.example/api/auth/login",
      "POST",
      { email: "captain@example.com", password: "wrong password" },
      "",
      { "CF-Connecting-IP": "203.0.113.5" },
    ),
    environment,
  );
  assert.equal(limited.status, 429);
  assert.deepEqual(await limited.json(), { error: "rate_limited" });
});

test("never authenticates an invalid password value through an internal sentinel", async () => {
  const environment = env();
  const registered = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/register", "POST", {
      email: "sentinel@example.com",
      password: "invalid-password",
      displayName: "Sentinel",
    }),
    environment,
  );
  assert.equal(registered.status, 201);
  for (const password of [null, "x".repeat(129)]) {
    const response = await handleAccountAuthRequest(
      jsonRequest("https://worker.example/api/auth/login", "POST", {
        email: "sentinel@example.com",
        password,
      }),
      environment,
    );
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "invalid_credentials" });
  }
});

test("bounds streamed auth JSON even when Content-Length is understated", async () => {
  const environment = env();
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("{" + "x".repeat(4_500)));
      controller.enqueue(new TextEncoder().encode("x".repeat(4_500) + "}"));
    },
    cancel() {
      cancelled = true;
    },
  });
  const response = await handleAccountAuthRequest(
    new Request("https://worker.example/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": "10" },
      body,
      duplex: "half",
    }),
    environment,
  );
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "request_too_large" });
  assert.equal(cancelled, true);
});

test("expires sessions server-side", async () => {
  const environment = env();
  const registered = await registerUser(environment);
  environment.DB.database
    .prepare("UPDATE account_sessions SET expires_at = ?")
    .run("2000-01-01T00:00:00.000Z");
  const response = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/me", "GET", undefined, registered.token),
    environment,
  );
  assert.deepEqual(await response.json(), { user: null });
  assert.ok(environment.DB.database.prepare("SELECT revoked_at FROM account_sessions").get().revoked_at);
});

test("requests password reset without exposing whether an account exists", async () => {
  const environment = resetEnv();
  await registerUser(environment);
  const delivered = [];
  const dependencies = {
    sendPasswordResetEmail: async (_env, message) => delivered.push(message),
  };

  const existing = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/password-reset/request", "POST", {
      email: "Captain@Example.com",
    }),
    environment,
    dependencies,
  );
  const missing = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/password-reset/request", "POST", {
      email: "missing@example.com",
    }),
    environment,
    dependencies,
  );

  assert.equal(existing.status, 202);
  assert.equal(missing.status, 202);
  assert.deepEqual(await existing.json(), { ok: true });
  assert.deepEqual(await missing.json(), { ok: true });
  assert.equal(delivered.length, 1);
  assert.equal(delivered[0].email, "captain@example.com");
  const resetToken = new URL(delivered[0].resetUrl).hash.replace(/^#reset\//u, "");
  assert.match(resetToken, /^[A-Za-z0-9_-]{43}$/u);
  const stored = environment.DB.database.prepare("SELECT token_hash FROM password_reset_tokens").get();
  assert.equal(stored.token_hash.length, 64);
  assert.notEqual(stored.token_hash, resetToken);
});

test("defers Brevo delivery without delaying the neutral reset response", async () => {
  const environment = resetEnv();
  await registerUser(environment);
  let finishDelivery;
  let background;
  const delivery = new Promise((resolve) => { finishDelivery = resolve; });
  const response = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/password-reset/request", "POST", {
      email: "captain@example.com",
    }),
    environment,
    {
      sendPasswordResetEmail: async () => delivery,
      waitUntil: (promise) => { background = promise; },
    },
  );
  assert.equal(response.status, 202);
  assert.ok(background instanceof Promise);
  finishDelivery();
  await background;
});

test("resets a password once and revokes all existing account sessions", async () => {
  const environment = resetEnv();
  const registered = await registerUser(environment);
  let resetUrl = "";
  await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/password-reset/request", "POST", {
      email: "captain@example.com",
    }),
    environment,
    { sendPasswordResetEmail: async (_env, message) => { resetUrl = message.resetUrl; } },
  );
  const resetToken = new URL(resetUrl).hash.replace(/^#reset\//u, "");
  const confirmed = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/password-reset/confirm", "POST", {
      token: resetToken,
      password: "new correct horse battery staple",
    }),
    environment,
  );
  assert.equal(confirmed.status, 200);
  assert.deepEqual(await confirmed.json(), { ok: true });

  const oldSession = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/me", "GET", undefined, registered.token),
    environment,
  );
  assert.deepEqual(await oldSession.json(), { user: null });
  const oldPassword = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/login", "POST", {
      email: "captain@example.com",
      password: "correct horse battery staple",
    }),
    environment,
  );
  assert.equal(oldPassword.status, 401);
  const newPassword = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/login", "POST", {
      email: "captain@example.com",
      password: "new correct horse battery staple",
    }),
    environment,
  );
  assert.equal(newPassword.status, 200);
  assert.ok(environment.DB.database.prepare("SELECT consumed_at FROM password_reset_tokens").get().consumed_at);

  const replay = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/password-reset/confirm", "POST", {
      token: resetToken,
      password: "another secure password",
    }),
    environment,
  );
  assert.equal(replay.status, 400);
  assert.deepEqual(await replay.json(), { error: "reset_invalid_or_expired" });
});

test("rejects expired password reset tokens and requires email configuration", async () => {
  const unavailable = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/password-reset/request", "POST", {
      email: "captain@example.com",
    }),
    env(),
  );
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), { error: "password_reset_unavailable" });

  const environment = resetEnv();
  await registerUser(environment);
  let resetUrl = "";
  await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/password-reset/request", "POST", {
      email: "captain@example.com",
    }),
    environment,
    { sendPasswordResetEmail: async (_env, message) => { resetUrl = message.resetUrl; } },
  );
  environment.DB.database
    .prepare("UPDATE password_reset_tokens SET expires_at = ?")
    .run("2000-01-01T00:00:00.000Z");
  const expired = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/password-reset/confirm", "POST", {
      token: new URL(resetUrl).hash.replace(/^#reset\//u, ""),
      password: "new correct horse battery staple",
    }),
    environment,
  );
  assert.equal(expired.status, 400);
  assert.deepEqual(await expired.json(), { error: "reset_invalid_or_expired" });
});
