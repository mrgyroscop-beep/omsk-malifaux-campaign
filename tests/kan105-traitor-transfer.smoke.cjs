const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const appUrl = /^[a-z][a-z0-9+.-]*:/iu.test(appPath) ? appPath : pathToFileURL(appPath).href;
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";
const screenshotDir = process.env.KAN105_SCREENSHOT_DIR || "";

const fixture = {
  version: 6,
  crew: {
    name: "Red Library",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Witch Hunter"],
  },
  campaign: { length: 8, week: 1, meetingDay: "", ratingAdjustment: 0 },
  leader: {
    name: "New Leader",
    archetype: "",
    characteristics: ["Living", ""],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [],
    crewCard: "",
    xp: 0,
    advances: [],
    manualUpgrades: [],
    injuries: [],
    totem: null,
  },
  arsenal: {
    models: [],
    equipment: [],
    equipmentScripSpent: 0,
    scrip: 7,
    scripTransactions: [],
  },
  loadout: { hiredModelIds: [], assignments: [] },
  games: [{ id: "game-1", week: 1, opponent: "Old Crew", vp: 0, barterFlip: "5 R/M" }],
};

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ locale: "ru-RU", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(appUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), fixture);
    await page.locator('[data-route="arsenal"]').click();

    await page.locator("#addModelButton").click();
    await page.locator('#modelForm input[name="name"]').fill("Turncoat Marshal");
    await page.locator('#modelForm input[name="cost"]').fill("8");
    await page.locator("#modelForm .button-wide").click();
    assert.equal(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).arsenal.models.length,
      0,
      "Ordinary week-one hiring should remain locked after a game.",
    );

    await page.locator('#modelForm input[name="traitorTransfer"]').check();
    assert.equal(
      await page.locator('#modelForm input[name="keywords"]').inputValue(),
      "Marshal, Witch Hunter",
    );
    assert.equal(
      await page.locator('#modelForm input[name="keywords"]').evaluate((element) => element.readOnly),
      true,
    );
    assert.match(await page.locator("#modelForm .button-wide").textContent(), /Traitor/u);

    if (screenshotDir) {
      fs.mkdirSync(screenshotDir, { recursive: true });
      await page.locator("#modelDialog").screenshot({
        path: path.join(screenshotDir, "KAN-105-traitor-mode.png"),
      });
    }

    await page.locator("#modelForm .button-wide").click();
    await page.waitForFunction(() =>
      window.MalifauxBuilder.getState().arsenal.models.some((model) => model.name === "Turncoat Marshal"),
    );

    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    const model = state.arsenal.models.find((item) => item.name === "Turncoat Marshal");
    assert.equal(model.acquisition, "traitor");
    assert.equal(model.keywords, "Marshal, Witch Hunter");
    assert.equal(model.scripPaid, 0);
    assert.equal(model.addedWeek, 1);
    assert.equal(state.arsenal.scrip, 7, "Traitor transfer must not spend scrip.");
    assert.match(await page.locator("#modelList").textContent(), /Traitor · бесплатно/u);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.locator('[data-route="arsenal"]').click();
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models[0].acquisition, "traitor");

    if (screenshotDir) {
      await page.locator("#modelList").screenshot({
        path: path.join(screenshotDir, "KAN-105-traitor-transfer.png"),
      });
    }

    await page.setViewportSize({ width: 375, height: 812 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      false,
      "Traitor controls introduced horizontal overflow on mobile.",
    );
    assert.deepEqual(pageErrors, []);
    console.log("KAN105_TRAITOR_TRANSFER_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
