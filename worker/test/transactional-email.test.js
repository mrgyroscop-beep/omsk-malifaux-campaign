import assert from "node:assert/strict";
import test from "node:test";

import {
  EmailConfigurationError,
  passwordResetUrl,
  sendPasswordResetEmail,
} from "../src/transactional-email.js";

const environment = {
  BREVO_API_KEY: "secret-test-key",
  BREVO_FROM_EMAIL: "archive@example.com",
  BREVO_FROM_NAME: "Malifaux Archive",
  PASSWORD_RESET_BASE_URL: "https://campaign.example/",
};

test("builds a fragment reset URL and sends a bounded Brevo API request", async () => {
  const token = "a".repeat(43);
  const resetUrl = passwordResetUrl(environment, token);
  assert.equal(resetUrl, `https://campaign.example/#reset/${token}`);
  let captured;
  await sendPasswordResetEmail(
    environment,
    {
      email: "captain@example.com",
      displayName: "<Captain>",
      resetUrl,
    },
    async (url, options) => {
      captured = { url, options };
      return new Response(null, { status: 201 });
    },
  );

  assert.equal(captured.url, "https://api.brevo.com/v3/smtp/email");
  assert.equal(captured.options.headers["api-key"], environment.BREVO_API_KEY);
  const payload = JSON.parse(captured.options.body);
  assert.deepEqual(payload.sender, {
    name: "Malifaux Archive",
    email: "archive@example.com",
  });
  assert.deepEqual(payload.to, [{ email: "captain@example.com", name: "<Captain>" }]);
  assert.match(payload.htmlContent, /&lt;Captain&gt;/u);
  assert.match(payload.htmlContent, /#reset\/a{43}/u);
  assert.equal(payload.htmlContent.includes(environment.BREVO_API_KEY), false);
});

test("rejects missing Brevo configuration before making a request", async () => {
  let called = false;
  await assert.rejects(
    sendPasswordResetEmail(
      {},
      { email: "captain@example.com", resetUrl: "https://example.com" },
      async () => { called = true; },
    ),
    EmailConfigurationError,
  );
  assert.equal(called, false);
});
