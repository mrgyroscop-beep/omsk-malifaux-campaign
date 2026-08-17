import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

export class D1Statement {
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
    return { success: true, meta: { changes: Number(result.changes || 0) } };
  }
}

export class FakeD1 {
  constructor({ includeFeedback = false } = {}) {
    this.database = new DatabaseSync(":memory:");
    const migrations = ["0001_cloud_campaigns.sql"];
    if (includeFeedback) migrations.push("0002_feedback.sql");
    migrations.push("0003_accounts.sql");
    migrations.push("0004_password_resets.sql");
    for (const name of migrations) {
      this.database.exec(
        readFileSync(new URL(`../migrations/${name}`, import.meta.url), "utf8"),
      );
    }
  }

  prepare(sql) {
    return new D1Statement(this.database.prepare(sql));
  }

  async batch(statements) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      this.database.exec("COMMIT");
      return results;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
}

export function jsonRequest(url, method, body, token = "", headers = {}) {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Account-Session": token } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function registerUser(env, email = "captain@example.com") {
  const { handleAccountAuthRequest } = await import("../src/account-auth.js");
  const response = await handleAccountAuthRequest(
    jsonRequest("https://worker.example/api/auth/register", "POST", {
      email,
      password: "correct horse battery staple",
      displayName: "Captain",
    }),
    env,
  );
  const payload = await response.json();
  return { response, payload, token: payload.token };
}
