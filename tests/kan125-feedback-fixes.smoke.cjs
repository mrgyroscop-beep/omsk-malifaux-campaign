const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";
const campaignId = "feedbackdemo01";

(async () => {
  const cloudSource = await readFile(path.join(root, "cloud.js"), "utf8");
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ locale: "ru-RU" });
  await context.addInitScript((id) => {
    window.MalifauxBuilder = {
      getLocale: () => "ru",
      getState: () => ({ crew: { name: "Feedback Crew" } }),
      notify: () => {},
      replaceState: () => {},
    };
    localStorage.setItem("m4e-cloud-campaign-v1", JSON.stringify({ campaignId: id }));
  }, campaignId);

  const page = await context.newPage();
  const pageErrors = [];
  let campaignGets = 0;
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.route("https://app.example.test/**", (route) => {
    if (new URL(route.request().url()).pathname === "/cloud.js") {
      return route.fulfill({
        status: 200,
        contentType: "text/javascript; charset=utf-8",
        body: cloudSource,
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><html><head>
      <meta name="app-api-url" content="https://api.example.test">
      <meta name="public-site-url" content="https://app.example.test/">
    </head><body>
      <button id="openCloudButton" type="button">Cloud</button>
      <dialog id="cloudDialog"><div id="cloudDialogContent"></div></dialog>
      <dialog id="securityDialog"><button id="securityDialogClose" type="button">Close</button><div id="securityStatus"></div><div id="turnstileWidget"></div></dialog>
      <script src="/cloud.js"></script>
    </body></html>`,
    });
  });
  await page.route(`https://api.example.test/api/campaigns/${campaignId}`, async (route) => {
    campaignGets += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        campaign: {
          id: campaignId,
          name: "Feedback Crew",
          dossier: {},
          createdAt: "2026-08-10T00:00:00.000Z",
          updatedAt: "2026-08-10T00:00:00.000Z",
        },
        players: [],
        events: [],
      }),
    });
  });

  try {
    await page.goto(`https://app.example.test/?campaign=${campaignId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(() => document.querySelector("#cloudDialog")?.open);
    assert.equal(new URL(page.url()).searchParams.has("campaign"), false);
    assert.ok(campaignGets >= 1, "The first public-link visit did not load the campaign.");

    await page.locator("#cloudDialog").evaluate((dialog) => dialog.close());
    await page.reload({ waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("#cloudDialog").evaluate((dialog) => dialog.open), false);

    await page.locator("#openCloudButton").click();
    assert.equal(await page.locator("#cloudDialog").evaluate((dialog) => dialog.open), true);
    assert.deepEqual(pageErrors, []);
    console.log("KAN125_FEEDBACK_FIXES_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
