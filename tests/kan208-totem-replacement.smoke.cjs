const assert = require("node:assert/strict");
const { mkdir } = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";
const artifacts = path.resolve(__dirname, "..", ".artifacts", "kan208");

const fixture = {
  version: 6,
  crew: {
    name: "KAN-208 Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Living"],
  },
  campaign: { length: 8, week: 5, meetingDay: "" },
  leader: {
    name: "Totem Keeper",
    archetype: "Generalist",
    characteristics: ["Living", "Construct"],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [],
    crewCard: "",
    xp: 13,
    advances: [],
    manualUpgrades: [],
    injuries: [],
    totem: null,
  },
  arsenal: {
    models: [],
    equipment: [
      {
        id: "eq-kan208-kit",
        name: "Coward Field Kit",
        acquisition: "custom",
        ratingExempt: false,
        scripPaid: 0,
      },
    ],
    equipmentScripSpent: 0,
    scrip: 10,
  },
  loadout: { hiredModelIds: [], assignments: [] },
  games: [],
};

function retainedAbility() {
  return {
    id: "kan208-earned-flight",
    xp: 7,
    maxTier: 4,
    tier: 2,
    tableId: "ability",
    recipient: "totem",
    choiceId: "ability-flight",
    name: "Earned Flight",
    resultType: "ability",
    flip: { card: "6", cheated: false },
    snapshot: {
      id: "ability-flight",
      name: "Earned Flight",
      type: "ability",
      effect: "Earned Totem ability effect",
    },
    scripPaid: 0,
    createdAt: "2026-09-20T00:00:00.000Z",
  };
}

async function stateOf(page) {
  return page.evaluate(() => window.MalifauxBuilder.getState());
}

(async () => {
  await mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), fixture);
    await page.locator('[data-route="chronicle"]').click();

    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "5");
    await page.selectOption("#advancementTable", "totem");
    await page.selectOption("#advancementFlip", "black-joker");
    assert.deepEqual(
      await page.locator("#advancementChoice option").evaluateAll((options) =>
        options.map((option) => option.value),
      ),
      ["sniveling-coward"],
    );
    await page.locator('#totemSetup input[name="totemName"]').fill("Cowardly Custodian");
    await page.locator("#advancementForm").evaluate((form) => form.requestSubmit());
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder.getState().leader.totem));

    let state = await stateOf(page);
    const source = state.leader.advances.find((advance) => advance.tableId === "totem");
    const stableTotemId = state.leader.totem.id;
    const forgedJokerReplacement = structuredClone(state);
    forgedJokerReplacement.leader.totem.replacementProfileId = "mini-master";
    await page.evaluate(
      (value) => window.MalifauxBuilder.replaceState(value),
      forgedJokerReplacement,
    );
    state = await stateOf(page);
    assert.equal(
      state.leader.totem.profileId,
      "sniveling-coward",
      "A forged Joker replacement survived state normalization.",
    );
    state.leader.totem.injuries = [
      {
        id: "kan208-injury",
        name: "Marked Frame",
        nameEn: "Marked Frame",
        effect: "Retained injury",
        effectEn: "Retained injury",
        flip: "9",
        week: 5,
      },
    ];
    state.leader.advances.push(retainedAbility());
    state.loadout.assignments = [
      { equipmentId: "eq-kan208-kit", targetKind: "totem", targetId: null },
    ];
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), state);
    await page.locator('[data-route="arsenal"]').click();

    const replacementButton = page.locator("#arsenalTotemCard [data-replace-totem]");
    await replacementButton.waitFor({ state: "visible" });
    const buttonBox = await replacementButton.boundingBox();
    assert.ok(buttonBox.height >= 44, "Replacement button is below the touch target minimum.");
    await page.locator('[data-locale="en"]').click();
    assert.equal((await replacementButton.textContent()).trim(), "Replace Totem");
    await replacementButton.click();
    assert.equal(await page.locator("#totemReplacementTitle").textContent(), "Replace Totem");
    assert.match(await page.locator("#totemReplacementCurrent").textContent(), /^Current:/u);
    await page.locator('#totemReplacementDialog [data-close-dialog="totemReplacementDialog"]').first().click();
    await page.locator('[data-locale="ru"]').click();
    await replacementButton.click();

    const dialog = page.locator("#totemReplacementDialog");
    await dialog.waitFor({ state: "visible" });
    await dialog.screenshot({ path: path.join(artifacts, "replacement-dialog-mobile.png") });
    const options = await dialog.locator('select[name="replacementProfile"] option').evaluateAll(
      (entries) => entries.map((entry) => ({ value: entry.value, label: entry.textContent })),
    );
    assert.equal(options.length, 13, "The replacement list must contain all non-Joker Totems.");
    assert.equal(options.some((option) => /joker/iu.test(option.value + option.label)), false);
    await dialog.locator('select[name="replacementProfile"]').selectOption("chance-taker");
    await dialog.locator('input[name="conditionConfirmed"]').check();
    await dialog.locator('button[type="submit"]').click();
    await dialog.waitFor({ state: "hidden" });

    state = await stateOf(page);
    assert.equal(state.leader.totem.id, stableTotemId, "Replacement changed the Totem identity.");
    assert.equal(state.leader.totem.profileId, "chance-taker");
    assert.equal(state.leader.totem.replacementProfileId, "chance-taker");
    assert.equal(state.leader.totem.name, "Chance Taker");
    assert.equal(state.leader.totem.customName, "");
    assert.equal(state.leader.totem.stats.df, 6);
    assert.equal(state.leader.totem.injuries[0].id, "kan208-injury");
    assert.equal(state.leader.advances.some((advance) => advance.id === "kan208-earned-flight"), true);
    assert.equal(state.leader.advances.find((advance) => advance.id === source.id).choiceId, "sniveling-coward");
    assert.equal(state.leader.advances.find((advance) => advance.id === source.id).flip.card, "black-joker");
    assert.deepEqual(state.loadout.assignments, [
      { equipmentId: "eq-kan208-kit", targetKind: "totem", targetId: null },
    ]);
    assert.equal(await replacementButton.count(), 0, "Permanent replacement remained available.");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await stateOf(page);
    assert.equal(state.leader.totem.id, stableTotemId);
    assert.equal(state.leader.totem.profileId, "chance-taker");
    assert.equal(state.leader.totem.replacementProfileId, "chance-taker");
    assert.equal(state.leader.totem.customName, "");
    assert.equal(state.leader.totem.injuries[0].id, "kan208-injury");
    assert.equal(state.leader.advances.some((advance) => advance.id === "kan208-earned-flight"), true);
    assert.deepEqual(state.loadout.assignments, [
      { equipmentId: "eq-kan208-kit", targetKind: "totem", targetId: null },
    ]);
    await page.locator('[data-route="arsenal"]').click();
    assert.equal(await page.locator("#arsenalTotemCard [data-replace-totem]").count(), 0);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      "Replacement UI creates horizontal scrolling on mobile.",
    );
    assert.deepEqual(pageErrors, []);
    console.log("KAN208_TOTEM_REPLACEMENT_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
