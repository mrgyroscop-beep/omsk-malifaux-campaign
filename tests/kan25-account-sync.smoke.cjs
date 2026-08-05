const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";
const token = "a".repeat(43);
const user = { id: "user-kan25", email: "captain@example.com", displayName: "Captain" };
const local = {
  version: 5,
  crew: { name: "Local Tide", player: "Captain", faction: "Neverborn", keywords: [] },
  campaign: { length: 8, week: 2, meetingDay: "" },
  leader: {
    name: "Harbour Witch",
    archetype: "Generalist",
    characteristics: ["Living", ""],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [],
    crewCard: "",
    xp: 3,
    advances: [{ id: "advance-local", xp: 1, name: "Local advance" }],
    manualUpgrades: [],
    injuries: [],
    totem: null,
  },
  arsenal: { models: [], equipment: [], equipmentScripSpent: 0, scrip: 5 },
  loadout: { hiredModelIds: [], assignments: [] },
  games: [],
};

let remote = {
  id: "accountcampaign01",
  name: "Remote Fog",
  dossier: {
    ...structuredClone(local),
    crew: { ...local.crew, name: "Remote Fog" },
    leader: { ...local.leader, xp: 4, advances: [{ id: "advance-remote", xp: 1, name: "Remote advance" }] },
  },
  revision: 4,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-05T00:00:00.000Z",
};
let accountGets = 0;
let accountPuts = 0;

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

async function contrastRatio(locator) {
  return locator.evaluate((element) => {
    const parse = (value) => (value.match(/[\d.]+/gu) || []).slice(0, 3).map(Number);
    const luminance = (rgb) => {
      const channels = rgb.map((value) => {
        const channel = value / 255;
        return channel <= 0.03928
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const style = getComputedStyle(element);
    const foreground = luminance(parse(style.color));
    const background = luminance(parse(style.backgroundColor));
    return (Math.max(foreground, background) + 0.05) /
      (Math.min(foreground, background) + 0.05);
  });
}

async function startServer() {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://localhost").pathname;
      const relative = pathname === "/" ? "index.html" : pathname.slice(1);
      const target = path.resolve(root, relative);
      if (!target.startsWith(root)) throw new Error("outside root");
      const body = await readFile(target);
      response.writeHead(200, { "Content-Type": contentType(target) });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

(async () => {
  const indexSource = await readFile(path.join(root, "index.html"), "utf8");
  assert.match(indexSource, /<script src="app\.js\?v=28"><\/script>/u);
  const server = await startServer();
  const port = server.address().port;
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ locale: "ru-RU", viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(
    ({ sessionToken, state }) => {
      if (!sessionStorage.getItem("m4e-account-session-v1")) {
        sessionStorage.setItem(
          "m4e-account-session-v1",
          JSON.stringify({ token: sessionToken, expiresAt: "2099-01-01T00:00:00.000Z" }),
        );
      }
      if (!localStorage.getItem("m4e-untold-campaign-v1")) {
        localStorage.setItem("m4e-untold-campaign-v1", JSON.stringify(state));
      }
    },
    { sessionToken: token, state: local },
  );
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.route("**/api/auth/me", async (route) => {
    assert.equal(route.request().headers()["x-account-session"], token);
    assert.equal(route.request().headers().authorization, undefined);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user }) });
  });
  await page.route("**/api/auth/logout", async (route) => {
    assert.equal(route.request().headers()["x-account-session"], token);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.route("**/api/account/campaign", async (route) => {
    assert.equal(route.request().headers()["x-account-session"], token);
    assert.equal(route.request().headers().authorization, undefined);
    if (route.request().method() === "GET") {
      accountGets += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ campaign: remote }) });
      return;
    }
    const body = route.request().postDataJSON();
    accountPuts += 1;
    assert.equal(body.revision, remote.revision);
    remote = {
      ...remote,
      name: body.name,
      dossier: body.dossier,
      revision: remote.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ campaign: remote }) });
  });

  try {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder && window.MalifauxAccount));
    await page.waitForFunction(() => window.MalifauxAccount.getUser()?.email === "captain@example.com");
    await page.locator("#openAccountButton").click();
    await page.locator(".account-conflict").waitFor();
    const syncButton = page.locator('[data-account-action="sync"]');
    assert.ok((await contrastRatio(syncButton)) >= 4.5, "Sync button lacks normal-state contrast.");
    await syncButton.hover();
    assert.ok((await contrastRatio(syncButton)) >= 4.5, "Sync button lacks hover-state contrast.");
    await syncButton.focus();
    assert.ok((await contrastRatio(syncButton)) >= 4.5, "Sync button lacks focus-state contrast.");
    assert.notEqual(
      await syncButton.evaluate((element) => getComputedStyle(element).outlineStyle),
      "none",
      "Sync button has no visible focus indicator.",
    );
    await syncButton.evaluate((element) => { element.disabled = true; });
    assert.ok((await contrastRatio(syncButton)) >= 4.5, "Sync button lacks disabled-state contrast.");
    await syncButton.evaluate((element) => { element.disabled = false; });
    assert.ok(
      (await page.locator(".account-conflict").textContent()).includes(
        "\u0434\u0432\u0435 \u0438\u0437\u043c\u0435\u043d\u0451\u043d\u043d\u044b\u0435 \u043a\u043e\u043f\u0438\u0438",
      ),
      "The Russian conflict heading was not rendered.",
    );
    assert.equal((await page.evaluate(() => window.MalifauxBuilder.getState())).crew.name, "Local Tide");

    await page.locator('[data-account-action="keep-local"]').click();
    await page.waitForFunction(() => document.querySelector(".account-sync-state")?.classList.contains("is-synced"));
    assert.equal(remote.dossier.crew.name, "Local Tide");
    assert.equal(remote.dossier.leader.advances[0].id, "advance-local");

    const edited = structuredClone(local);
    edited.crew.name = "Device Edit";
    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), edited);
    await page.waitForFunction(() => document.querySelector(".account-sync-state")?.classList.contains("is-synced"));
    await page.waitForFunction(() => window.MalifauxBuilder.getState().crew.name === "Device Edit");
    for (let attempt = 0; attempt < 30 && remote.dossier.crew.name !== "Device Edit"; attempt += 1) {
      await page.waitForTimeout(100);
    }
    assert.equal(
      remote.dossier.crew.name,
      "Device Edit",
      `A local save was not synchronized automatically (GET ${accountGets}, PUT ${accountPuts}).`,
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.MalifauxAccount?.getUser()?.email === "captain@example.com");
    assert.equal((await page.evaluate(() => window.MalifauxBuilder.getState())).crew.name, "Device Edit");

    await page.locator("#openAccountButton").click();
    await page.locator('[data-account-action="logout"]').click();
    await page.waitForFunction(() => window.MalifauxAccount.getUser() === null);
    assert.equal(await page.locator("#accountDialogKicker").textContent(), "Личный журнал");
    assert.doesNotMatch(await page.locator("#accountDialogKicker").textContent(), /судовой/u);
    assert.equal((await page.evaluate(() => window.MalifauxBuilder.getState())).crew.name, "Device Edit");
    assert.ok(
      (await page.locator("#accountDialogContent").textContent()).includes(
        "\u0411\u0435\u0437 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430 \u0431\u0438\u043b\u0434\u0435\u0440",
      ),
      "The Russian guest-mode copy was not rendered.",
    );
    const accountModeGroup = page.locator(".account-tabs");
    assert.equal(await accountModeGroup.getAttribute("role"), "group");
    assert.equal(await page.locator('#accountDialogContent [role="tablist"]').count(), 0);
    assert.equal(
      await page.locator('[data-account-mode="login"]').getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await page.locator('[data-account-mode="register"]').getAttribute("aria-pressed"),
      "false",
    );
    await page.locator('[data-account-mode="register"]').click();
    assert.equal(
      await page.locator('[data-account-mode="register"]').getAttribute("aria-pressed"),
      "true",
    );

    await page.locator("#accountDialogClose").click();
    await page.locator('[data-locale="en"]').click();
    await page.locator("#openAccountButton").click();
    assert.equal(await page.locator("#accountDialogKicker").textContent(), "Personal log");
    assert.match(await page.locator("#accountDialogContent").textContent(), /Guest mode remains available/u);
    assert.deepEqual(pageErrors, []);

    const legacyCampaignId = "legacycampaign01";
    const legacyOrganizerToken = "legacy-organizer-token-that-is-long-enough";
    let legacyClaimed = false;
    let legacyPrivatePut = false;
    const claimContext = await browser.newContext({
      locale: "ru-RU",
      viewport: { width: 1280, height: 900 },
    });
    await claimContext.addInitScript(
      ({ sessionToken, state, campaignId, organizerToken }) => {
        sessionStorage.setItem(
          "m4e-account-session-v1",
          JSON.stringify({ token: sessionToken, expiresAt: "2099-01-01T00:00:00.000Z" }),
        );
        localStorage.setItem("m4e-untold-campaign-v1", JSON.stringify(state));
        localStorage.setItem("m4e-cloud-campaign-v1", JSON.stringify({ campaignId }));
        localStorage.setItem(
          "m4e-cloud-organizer-keys-v1",
          JSON.stringify({ [campaignId]: organizerToken }),
        );
      },
      {
        sessionToken: token,
        state: local,
        campaignId: legacyCampaignId,
        organizerToken: legacyOrganizerToken,
      },
    );
    const claimPage = await claimContext.newPage();
    const claimPageErrors = [];
    claimPage.on("pageerror", (reason) => claimPageErrors.push(reason.message));
    await claimPage.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user }),
      });
    });
    await claimPage.route("**/api/account/campaign/claim", async (route) => {
      const request = route.request();
      assert.equal(request.headers()["x-account-session"], token);
      assert.equal(request.headers()["x-organizer-token"], legacyOrganizerToken);
      assert.equal(request.headers().authorization, undefined);
      assert.equal(request.postDataJSON().campaignId, legacyCampaignId);
      legacyClaimed = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          campaign: {
            id: legacyCampaignId,
            name: "Legacy file",
            dossier: local,
            revision: 3,
            accessMode: "legacy_public",
            createdAt: "2026-08-01T00:00:00.000Z",
            updatedAt: "2026-08-05T00:00:00.000Z",
          },
        }),
      });
    });
    await claimPage.route("**/api/account/campaign", async (route) => {
      const request = route.request();
      if (request.method() === "PUT") {
        legacyPrivatePut = true;
        await route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          campaign: legacyClaimed
            ? {
                id: legacyCampaignId,
                name: "Legacy file",
                dossier: local,
                revision: 3,
                accessMode: "legacy_public",
                createdAt: "2026-08-01T00:00:00.000Z",
                updatedAt: "2026-08-05T00:00:00.000Z",
              }
            : null,
        }),
      });
    });
    try {
      await claimPage.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded" });
      await claimPage.waitForFunction(() => window.MalifauxAccount?.getUser()?.id === "user-kan25");
      await claimPage.locator("#openAccountButton").click();
      await claimPage.locator('[data-account-action="claim"]').waitFor();
      assert.equal(legacyPrivatePut, false, "A private dossier was created before legacy claim.");
      await claimPage.locator('[data-account-action="claim"]').click();
      for (let attempt = 0; attempt < 30 && !legacyClaimed; attempt += 1) {
        await claimPage.waitForTimeout(100);
      }
      assert.equal(legacyClaimed, true, "Legacy campaign was not linked through the account UI.");
      assert.equal(legacyPrivatePut, false, "Legacy claim created a duplicate private dossier.");
      await claimPage.waitForFunction(() => !document.querySelector('[data-account-action="claim"]'));
      assert.deepEqual(claimPageErrors, []);
    } finally {
      await claimContext.close();
    }
    console.log("KAN25_ACCOUNT_SYNC_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
