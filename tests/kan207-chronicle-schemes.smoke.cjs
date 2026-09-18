const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

const fixture = {
  version: 5,
  crew: {
    name: "KAN-207 Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Living"],
  },
  campaign: { length: 8, week: 2, meetingDay: "" },
  leader: {
    name: "Chronicle Keeper",
    archetype: "Generalist",
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
  arsenal: { models: [], equipment: [], equipmentScripSpent: 0, scrip: 0 },
  loadout: { hiredModelIds: [], assignments: [] },
  games: [],
};

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ locale: "ru-RU" });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), fixture);
    await page.locator('[data-route="chronicle"]').click();

    const schemes = page.locator('#gameForm input[name="schemes"]');
    assert.equal(await schemes.getAttribute("max"), null, "The form must accept four completed schemes.");
    await schemes.fill("4");
    await page.locator('#gameForm input[name="barterFlip"]').fill("9 C/T");
    assert.equal(
      await page.locator("#previewHand").textContent(),
      "4",
      "Aftermath hand must remain capped at three scheme cards plus the base card.",
    );

    await page.locator("#gameForm").evaluate((form) => form.requestSubmit());
    await page.waitForFunction(() => window.MalifauxBuilder.getState().games.length === 1);
    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.games[0].schemes, 4, "The actual scheme count was not saved.");
    assert.equal(state.games[0].hand, 4, "The saved Aftermath hand exceeded its rules cap.");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.games[0].schemes, 4, "The fourth scheme was lost after reload.");
    assert.equal(state.games[0].hand, 4, "The capped hand changed after reload.");
    assert.deepEqual(pageErrors, []);
    console.log("KAN207_CHRONICLE_SCHEMES_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
