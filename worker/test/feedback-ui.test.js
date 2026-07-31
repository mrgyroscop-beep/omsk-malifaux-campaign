import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("../../feedback.js", import.meta.url), "utf8");

function internals() {
  const sandbox = {
    Uint8Array,
    crypto: {
      randomUUID: () => "bd72f763-bbf4-45aa-a534-e47fb4e18f18",
    },
  };
  sandbox.globalThis = sandbox;
  runInNewContext(source, sandbox);
  return sandbox.MalifauxFeedbackInternals;
}

test("feedback UI normalizes and validates the bilingual form payload", () => {
  const api = internals();
  const draft = api.normalizedDraft({
    category: "idea",
    message: "  Add a printable roster view.  ",
    contact: "  @player  ",
    appVersion: "2026.07.31",
    locale: "en",
    section: "arsenal",
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(draft)),
    {
      category: "idea",
      message: "Add a printable roster view.",
      contact: "@player",
      appVersion: "2026.07.31",
      locale: "en",
      section: "arsenal",
    },
  );
  assert.equal(api.validateDraft(draft), "");
  assert.equal(api.validateDraft({ ...draft, message: "short" }), "message_too_short");
  assert.equal(
    api.validateDraft({ ...draft, contact: "x".repeat(181) }),
    "contact_too_long",
  );
  assert.equal(api.newRequestId(), "bd72f763-bbf4-45aa-a534-e47fb4e18f18");
});

test("page uses the embedded accessible modal instead of Google Forms", () => {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.equal(html.includes("forms.gle"), false);
  assert.match(html, /id="openFeedbackButton"/u);
  assert.match(html, /id="feedbackDialog"/u);
  assert.match(html, /aria-labelledby="feedbackDialogTitle"/u);
  assert.match(html, /minlength="10"/u);
  assert.match(html, /maxlength="2000"/u);
  assert.match(html, /src="feedback\.js\?v=1"/u);
  assert.match(html, /href="feedback\.css\?v=1"/u);
});
