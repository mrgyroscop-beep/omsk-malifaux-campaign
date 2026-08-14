const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

const fixture = {
  version: 5,
  crew: {
    name: "KAN-83-84 Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Living"],
  },
  campaign: { length: 8, week: 2, meetingDay: "" },
  leader: {
    name: "Chronicle Keeper",
    archetype: "",
    characteristics: ["Living", ""],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [],
    crewCard: "",
    xp: 7,
    advances: [],
    manualUpgrades: [],
    injuries: [],
    totem: null,
  },
  arsenal: { models: [], equipment: [], equipmentScripSpent: 0, scrip: 10 },
  loadout: { hiredModelIds: [], assignments: [] },
  games: [],
};

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), fixture);
    await page.locator('[data-route="chronicle"]').click();

    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "7");
    await page.selectOption("#advancementTable", "crew-card");
    await page.locator('input[name="crewCardSource"][value="starting"]').check({ force: true });
    await page.locator('[data-crew-advancement-effect="starting:heavy-blow"]').click();
    assert.equal(
      await page.locator("#advancementSubmit").isEnabled(),
      true,
      "Selecting a Tier IV Crew Card effect did not enable saving.",
    );
    await page.locator("#advancementSubmit").click();
    await page.waitForFunction(() =>
      window.MalifauxBuilder.getState().leader.advances.some(
        (advance) => advance.tableId === "crew-card" && advance.name === "Heavy Blow",
      ),
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    assert.equal(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).leader.advances.some(
        (advance) => advance.tableId === "crew-card" && advance.name === "Heavy Blow",
      ),
      true,
      "Tier IV advancement was lost after reopening the chronicle.",
    );

    await page.locator('[data-route="arsenal"]').click();
    await page.locator("#addEquipmentButton").click();
    const groups = await page.locator("#equipmentCatalog optgroup").evaluateAll((nodes) =>
      nodes.map((node) => ({
        label: node.label,
        options: [...node.querySelectorAll("option")].map((option) => option.textContent),
      })),
    );
    assert.ok(groups.some((group) => group.label === "Те, кто жаждет"));
    assert.ok(groups.some((group) => group.label === "Lucky Miss"));
    assert.ok(groups.find((group) => group.label === "Те, кто жаждет").options.some(
      (option) => option.includes("The Book of the Dead"),
    ));
    assert.ok(groups.find((group) => group.label === "Lucky Miss").options.some(
      (option) => option.includes("Martyr"),
    ));

    const bookValue = await page
      .locator("#equipmentCatalog option", { hasText: "The Book of the Dead" })
      .getAttribute("value");
    await page.selectOption("#equipmentCatalog", bookValue);
    await page.locator("#equipmentSubmit").click();
    await page.waitForFunction(() =>
      window.MalifauxBuilder.getState().arsenal.equipment.some(
        (item) => item.name === "The Book of the Dead",
      ),
    );
    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.scrip, 7);
    assert.equal(state.arsenal.equipment.find((item) => item.name === "The Book of the Dead").ratingExempt, false);

    await page.locator("#addEquipmentButton").click();
    const martyrValue = await page
      .locator("#equipmentCatalog option", { hasText: "Martyr" })
      .getAttribute("value");
    await page.selectOption("#equipmentCatalog", martyrValue);
    await page.locator("#equipmentSubmit").click();
    await page.waitForFunction(() =>
      window.MalifauxBuilder.getState().arsenal.equipment.some((item) => item.name === "Martyr"),
    );
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    const martyr = state.arsenal.equipment.find((item) => item.name === "Martyr");
    assert.equal(state.arsenal.scrip, 7);
    assert.equal(martyr.scripPaid, 0);
    assert.equal(martyr.acquisition, "free");
    assert.equal(martyr.ratingExempt, true);

    assert.deepEqual(pageErrors, []);
    console.log("KAN83_84_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
