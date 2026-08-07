const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

const fixture = {
  version: 6,
  crew: {
    name: "Feedback Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Living"],
  },
  campaign: { length: 8, week: 2, meetingDay: "", ratingAdjustment: 0 },
  leader: {
    name: "Ledger Keeper",
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
    models: [{
      id: "model-starting",
      name: "Starting Model",
      cost: 25,
      type: "Minion",
      henchman: false,
      keywords: "Marshal",
      versatile: false,
      outOfKeyword: false,
      modelLimit: 1,
      characteristics: [],
      injuries: [],
      addedWeek: 1,
      scripPaid: 0,
    }],
    equipment: [],
    equipmentScripSpent: 0,
    scrip: 50,
    scripTransactions: [],
  },
  loadout: { hiredModelIds: [], assignments: [] },
  games: [],
};

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ locale: "ru-RU", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), fixture);
    await page.locator('[data-route="arsenal"]').click();

    await page.locator("#addModelButton").click();
    await page.locator('#modelForm input[name="name"]').fill("Week Two Model");
    await page.locator('#modelForm input[name="cost"]').fill("10");
    await page.locator("#modelForm .button-wide").click();
    await page.waitForFunction(() =>
      window.MalifauxBuilder.getState().arsenal.models.some((model) => model.name === "Week Two Model"),
    );
    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models.reduce((sum, model) => sum + model.cost, 0), 35);
    assert.equal(state.arsenal.scrip, 45, "Week-two hire did not receive the first-hire discount.");

    await page.locator('[data-edit-model-characteristics="model-starting"]').click();
    await page.locator('#modelCharacteristicsForm textarea[name="characteristics"]').fill("Undead, Construct");
    await page.locator("#modelCharacteristicsForm .button-wide").click();
    await page.waitForFunction(() =>
      window.MalifauxBuilder.getState().arsenal.models[0].characteristics.length === 2,
    );
    assert.match(await page.locator("#modelList").textContent(), /Undead.*Construct/su);

    const scripForm = page.locator("#scripTransactionForm");
    await scripForm.locator('input[name="amount"]').fill("3");
    await scripForm.locator('input[name="reason"]').fill("Недельное событие");
    await scripForm.locator('[data-scrip-kind="credit"]').click();
    await page.waitForFunction(() => window.MalifauxBuilder.getState().arsenal.scrip === 48);

    await scripForm.locator('input[name="amount"]').fill("2");
    await scripForm.locator('[data-scrip-kind="debit"]').click();
    await page.waitForFunction(() => window.MalifauxBuilder.getState().arsenal.scrip === 46);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(state.arsenal.scripTransactions.map(({ kind, amount }) => ({ kind, amount })), [
      { kind: "credit", amount: 3 },
      { kind: "debit", amount: 2 },
    ]);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(state.arsenal.models[0].characteristics, ["Undead", "Construct"]);
    assert.equal(state.arsenal.scrip, 46);
    assert.equal(state.arsenal.scripTransactions.length, 2);

    await page.locator('[data-route="chronicle"]').click();
    await page.locator("#gameForm button[type=submit]").click();
    assert.equal((await page.evaluate(() => window.MalifauxBuilder.getState())).games.length, 0);
    await page.locator('#gameForm input[name="barterFlip"]').fill("9 C/T");
    await page.locator("#gameForm button[type=submit]").click();
    await page.waitForFunction(() => window.MalifauxBuilder.getState().games.length === 1);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.games[0].barterFlip, "9 C/T");
    assert.match(await page.locator("#gameLog").textContent(), /Barter: 9 C\/T/u);

    await page.setViewportSize({ width: 375, height: 812 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      false,
      "Feedback controls introduced horizontal overflow on mobile.",
    );
    assert.deepEqual(pageErrors, []);
    console.log("KAN106_112_FEEDBACK_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
