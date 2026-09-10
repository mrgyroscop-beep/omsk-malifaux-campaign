const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

const herdEm = {
  id: 400,
  slug: "400-herd-em",
  name: "Herd ’Em",
  type: "tactical",
  typeLabel: "Tactical",
  isSignature: false,
  range: "8",
  stat: "0",
  targetNumber: "6",
  description: "Move the target up to its Sp.",
  triggers: [],
};

const fixture = {
  version: 5,
  crew: { name: "Signature check", player: "Smoke Test", faction: "Bayou", keywords: ["Sooey", ""] },
  campaign: { length: 8, week: 1, meetingDay: "" },
  leader: {
    name: "Hog Handler",
    archetype: "Generalist",
    characteristics: ["Living", ""],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [
      { slotId: "attack-1", kind: "attack", mode: "manual", name: "" },
      {
        slotId: "tactical-1",
        kind: "tactical",
        mode: "biggerhat",
        cardId: 133,
        cardSlug: "hog-whisperer",
        entryId: 400,
        name: "Herd ’Em",
        source: "Hog Whisperer",
        snapshot: {
          sourceCard: { id: 133, slug: "hog-whisperer", name: "Hog Whisperer", displayName: "Hog Whisperer" },
          entry: herdEm,
          selectedTrigger: null,
        },
      },
    ],
    crewCard: "",
    xp: 0,
    advances: [],
    manualUpgrades: [],
    injuries: [],
    totem: null,
  },
  arsenal: { models: [], equipment: [], equipmentScripSpent: 0, scrip: 5 },
  loadout: { hiredModelIds: [], assignments: [] },
  games: [],
};

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const page = await browser.newPage({ locale: "ru-RU", viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    const catalog = await page.evaluate(() => ({
      models: Object.keys(globalThis.PlayWyrdSignatureActions.byModel).length,
      markers: Object.values(globalThis.PlayWyrdSignatureActions.byModel).flat().length,
      herdEm: globalThis.PlayWyrdSignatureActions.byModel.HogWhisperer,
      unyieldingResolve: globalThis.PlayWyrdSignatureActions.byModel.Ototo,
    }));
    assert.equal(catalog.models, 706);
    assert.equal(catalog.markers, 811);
    assert.ok(catalog.herdEm.includes("herdem"));
    assert.ok(catalog.unyieldingResolve.includes("unyieldingresolve"));
    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), fixture);
    await page.locator('.nav-item[data-route="leader"]').click();

    const state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.talents[1].snapshot.entry.isSignature, true);

    const talent = page.locator('[data-talent-name="1"]').locator("xpath=ancestor::div[contains(@class, 'talent-row')]");
    assert.equal(await talent.locator('[data-action-marker="signature"]').count(), 1);

    const summary = page.locator('[data-leader-action-name="Herd ’Em"]');
    assert.equal(await summary.locator('[data-action-marker="signature"]').count(), 1);

    await page.evaluate(() => window.renderPrintDossier());
    const printed = page.locator('[data-print-leader-action="Herd ’Em"]');
    assert.equal(await printed.locator('[data-action-marker="signature"]').count(), 1);
    assert.deepEqual(pageErrors, []);
    console.log("KAN202_HERD_EM_SIGNATURE_OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
