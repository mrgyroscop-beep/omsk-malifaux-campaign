const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

const legacyFixture = {
  version: 5,
  crew: {
    name: "KAN-94 Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Living"],
  },
  campaign: { length: 8, week: 3, meetingDay: "Thursday" },
  leader: {
    name: "Rating Keeper",
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
  arsenal: {
    models: [],
    equipment: [
      {
        id: "eq-rating",
        name: "Field Kit",
        acquisition: "custom",
        ratingExempt: false,
        scripPaid: 0,
      },
    ],
    equipmentScripSpent: 0,
    scrip: 0,
  },
  loadout: {
    hiredModelIds: [],
    assignments: [{ equipmentId: "eq-rating", targetKind: "leader", targetId: null }],
  },
  games: [],
};

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate((fixture) => window.MalifauxBuilder.replaceState(fixture), legacyFixture);
    await page.locator('[data-route="arsenal"]').click();

    const adjustment = page.locator("#ratingAdjustment");
    assert.equal(await adjustment.isEditable(), true, "Manual adjustment is not editable.");
    assert.equal(await adjustment.inputValue(), "0", "Legacy campaign did not migrate to zero.");
    assert.equal(await page.locator("#ratingEquipment").inputValue(), "1");
    assert.equal(await page.locator("#ratingResult").textContent(), "1");
    assert.match(await page.locator("#ratingBreakdown").textContent(), /Авто 1.*\+0/u);

    await adjustment.fill("3");
    await page.waitForFunction(
      () => window.MalifauxBuilder.getState().campaign.ratingAdjustment === 3,
    );
    assert.equal(await page.locator("#ratingResult").textContent(), "4");
    assert.equal(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("m4e-untold-campaign-v1")).campaign.ratingAdjustment,
      ),
      3,
      "Adjustment was not saved to localStorage.",
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    assert.equal(await adjustment.inputValue(), "3", "Adjustment was lost after reload.");
    assert.equal(await page.locator("#ratingResult").textContent(), "4");

    const exported = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(exported.version, 6);
    assert.equal(exported.campaign.ratingAdjustment, 3);
    await page.evaluate(() => window.MalifauxBuilder.replaceState({ version: 5 }));
    assert.equal(await adjustment.inputValue(), "0");
    await page.locator("#importFile").setInputFiles({
      name: "kan94-rating.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(exported)),
    });
    await page.waitForFunction(
      () => window.MalifauxBuilder.getState().campaign.ratingAdjustment === 3,
    );
    assert.equal(await adjustment.inputValue(), "3", "JSON import lost the adjustment.");

    await adjustment.fill("-2");
    assert.equal(await page.locator("#ratingResult").textContent(), "-1");
    assert.match(await page.locator("#ratingBreakdown").textContent(), /поправка -2/u);

    await page.locator('[data-locale="en"]').click();
    assert.equal(await page.locator(".rating-adjustment-copy b").textContent(), "Manual adjustment");
    assert.match(
      await page.locator("#ratingAdjustmentHint").textContent(),
      /actual rating differs from the automatic total/i,
    );
    assert.match(await page.locator("#ratingBreakdown").textContent(), /Auto 1.*adjustment -2/u);

    await page.setViewportSize({ width: 375, height: 812 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      false,
      "Rating adjustment introduced horizontal overflow on mobile.",
    );
    assert.deepEqual(pageErrors, []);
    console.log("KAN94_RATING_ADJUSTMENT_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
