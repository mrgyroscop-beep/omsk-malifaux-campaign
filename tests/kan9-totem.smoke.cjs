const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

const fixture = {
  version: 4,
  crew: {
    name: "KAN-9 Crew",
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
    injuries: [],
    totem: null,
  },
  arsenal: {
    models: [],
    equipment: [
      {
        id: "eq-totem-kit",
        name: "Totem Field Kit",
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

function earnedTotemAbility() {
  return {
    id: "totem-earned-flight",
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
    scripPaid: 2,
    createdAt: "2026-07-31T00:00:00.000Z",
  };
}

async function stateOf(page) {
  return page.evaluate(() => window.MalifauxBuilder.getState());
}

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
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), fixture);
    await page.locator('[data-route="chronicle"]').click();

    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "5");
    await page.selectOption("#advancementTable", "totem");
    await page.selectOption("#advancementFlip", "7");
    assert.deepEqual(
      await page.locator("#advancementChoice option").evaluateAll((options) =>
        options.map((option) => option.value),
      ),
      ["chance-taker"],
      "Totem advancement did not use an exact campaign-catalog flip.",
    );
    await page.selectOption("#advancementFlip", "8");
    assert.deepEqual(
      await page.locator("#advancementChoice option").evaluateAll((options) =>
        options.map((option) => option.value),
      ),
      ["night-marketeer"],
      "Another exact flip exposed the wrong Totem profile.",
    );

    await page.selectOption("#advancementFlip", "7");
    await page.locator("#advancementChoice").evaluate((select) => {
      const option = document.createElement("option");
      option.value = "dom-injected-totem";
      option.textContent = "DOM injected Totem";
      select.append(option);
      select.value = option.value;
    });
    await page.locator("#advancementForm").evaluate((form) => form.requestSubmit());
    await page.waitForTimeout(50);
    assert.equal((await stateOf(page)).leader.totem, null, "DOM-injected profile created a Totem.");
    assert.equal((await stateOf(page)).leader.advances.length, 0);

    await page.selectOption("#advancementChoice", "chance-taker");
    await page.locator('#totemSetup input[name="totemName"]').fill("Lucky Ledger");
    await page.locator('#totemSetup input[name="totemSize"]').fill("2");
    await page.selectOption('#totemSetup select[name="totemBase"]', "40");
    await page.locator('#totemSetup input[name="totemCharacteristic1"]').fill("Construct");
    await page.locator('#totemSetup input[name="totemCharacteristic2"]').fill("Enforcer");
    await page.locator("#advancementForm").evaluate((form) => form.requestSubmit());
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder.getState().leader.totem));

    let state = await stateOf(page);
    const source = state.leader.advances.find((advance) => advance.tableId === "totem");
    assert.ok(source, "Valid Tier III Totem source advancement was not stored.");
    assert.equal(source.tier, 3);
    assert.equal(source.choiceId, "chance-taker");
    assert.equal(source.flip.card, "7");
    assert.equal(state.leader.totem.sourceAdvancementId, source.id);
    assert.equal(state.leader.totem.acquiredBy, source.id);
    assert.equal(state.leader.totem.profileId, "chance-taker");
    assert.equal(state.leader.totem.customName, "Lucky Ledger");
    assert.equal(state.leader.totem.name, "Lucky Ledger");
    assert.equal(state.leader.totem.snapshot.name, "Chance Taker");
    assert.equal(state.leader.totem.stats.df, 6);
    assert.equal(state.leader.totem.size, 2);
    assert.equal(state.leader.totem.base, 40);
    assert.equal(state.leader.totem.cost, 0);
    assert.equal(state.leader.totem.permanentHired, true);
    assert.deepEqual(state.leader.totem.keywords, ["Marshal", "Living"]);
    assert.equal(state.arsenal.models.length, 0, "Totem leaked into arsenal models.");
    assert.deepEqual(state.loadout.hiredModelIds, [], "Totem leaked into hired model IDs.");
    const stableTotemId = state.leader.totem.id;
    const stableSnapshot = state.leader.totem.snapshot;

    await page.locator("#addAdvancementButton").click();
    await page.locator("#advancementTable").evaluate((select) => {
      const option = document.createElement("option");
      option.value = "totem";
      option.textContent = "Injected second Totem";
      select.append(option);
      select.value = option.value;
    });
    await page.locator("#advancementForm").evaluate((form) => form.requestSubmit());
    await page.waitForTimeout(50);
    assert.equal((await stateOf(page)).leader.advances.filter((advance) => advance.tableId === "totem").length, 1);
    assert.equal((await stateOf(page)).leader.totem.id, stableTotemId, "Second Totem replaced the first.");
    await page.locator("#advancementDialog").evaluate((dialog) => dialog.close());

    state = await stateOf(page);
    state.leader.totem.injuries = [
      {
        id: "totem-injury-nine",
        name: "Marked Frame",
        nameEn: "Marked Frame",
        effect: "Totem injury effect",
        effectEn: "Totem injury effect",
        flip: "9",
        week: 5,
      },
    ];
    state.leader.advances.push(earnedTotemAbility());
    state.loadout.assignments = [
      { equipmentId: "eq-totem-kit", targetKind: "totem", targetId: null },
    ];
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), state);
    state = await stateOf(page);
    assert.equal(state.leader.totem.id, stableTotemId);
    assert.deepEqual(state.leader.totem.snapshot, stableSnapshot);
    assert.equal(await page.locator("#ratingResult").textContent(), "2");

    await page.locator('.nav-item[data-route="leader"]').click();
    await page.locator('[data-locale="en"]').click();
    const leaderCardText = await page.locator("#totemCard").textContent();
    for (const expected of [
      "Lucky Ledger",
      "Lucky Draw",
      "Lucky Guess",
      "Trust to Luck",
      "Marked Frame",
      "Flight",
      "Totem Field Kit",
      "Always hired",
      "Cost 0",
      "Marshal",
    ]) {
      assert.match(leaderCardText, new RegExp(expected), `Leader Totem card misses ${expected}.`);
    }

    await page.locator('[data-route="arsenal"]').click();
    assert.equal(await page.locator("#arsenalTotemCardShell").isVisible(), true);
    const arsenalCardText = await page.locator("#arsenalTotemCard").textContent();
    for (const expected of [
      "Lucky Ledger",
      "Lucky Draw",
      "Lucky Guess",
      "Trust to Luck",
      "Marked Frame",
      "Flight",
      "Totem Field Kit",
    ]) {
      assert.match(arsenalCardText, new RegExp(expected), `Arsenal Totem card misses ${expected}.`);
    }
    assert.match(await page.locator("#activeLoadoutSummary").textContent(), /Lucky Ledger/);
    assert.match(await page.locator("#activeLoadoutSummary").textContent(), /Totem Field Kit/);

    await page.evaluate(() => {
      const profile = window.MalifauxAdvancementData.tier3.totems.find(
        (entry) => entry.id === "chance-taker",
      );
      try {
        profile.name = "Mutated Catalog Totem";
        profile.stats.df = 99;
      } catch {}
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await stateOf(page);
    assert.equal(state.leader.totem.id, stableTotemId, "Totem ID changed after reload.");
    assert.deepEqual(state.leader.totem.snapshot, stableSnapshot, "Totem snapshot changed after reload.");
    assert.equal(state.leader.totem.stats.df, 6);
    const persisted = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("m4e-untold-campaign-v1")),
    );
    assert.equal(persisted.leader.totem.sourceAdvancementId, source.id);
    assert.deepEqual(persisted.leader.totem.snapshot, stableSnapshot);

    await page.evaluate(() => window.renderPrintDossier());
    const printText = await page.locator("#printDossier").textContent();
    for (const expected of [
      "Lucky Ledger",
      "Lucky Draw",
      "Lucky Guess",
      "Marked Frame",
      "Flight",
      "Totem Field Kit",
    ]) {
      assert.match(printText, new RegExp(expected), `Print Totem card misses ${expected}.`);
    }

    await page.locator('[data-route="chronicle"]').click();
    const sourceDelete = page.locator(`[data-delete-advancement="${source.id}"]`);
    page.once("dialog", (dialog) => dialog.dismiss());
    await sourceDelete.click();
    state = await stateOf(page);
    assert.ok(state.leader.totem, "Cancel deleted the Totem.");
    assert.equal(state.arsenal.scrip, 10);
    assert.equal(state.loadout.assignments.some((assignment) => assignment.targetKind === "totem"), true);

    page.once("dialog", (dialog) => dialog.accept());
    await sourceDelete.click();
    state = await stateOf(page);
    assert.equal(state.leader.totem, null, "Source deletion kept the Totem ghost.");
    assert.equal(state.leader.advances.some((advance) => advance.recipient === "totem"), false);
    assert.equal(state.leader.advances.some((advance) => advance.id === source.id), false);
    assert.equal(state.loadout.assignments.some((assignment) => assignment.targetKind === "totem"), false);
    assert.equal(state.arsenal.equipment.some((item) => item.id === "eq-totem-kit"), true);
    assert.equal(state.arsenal.scrip, 10, "Forged ability surcharge produced a cascade refund.");
    assert.equal(await page.locator("#ratingResult").textContent(), "0");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    assert.equal((await stateOf(page)).arsenal.scrip, 10, "Cascade changed scrip after reload.");

    const legacy = JSON.parse(JSON.stringify(state));
    legacy.arsenal.scrip = 10;
    legacy.leader.xp = 13;
    legacy.leader.advances = [source, earnedTotemAbility()];
    legacy.leader.totem = {
      id: stableTotemId,
      profileId: "chance-taker",
      profile: stableSnapshot,
      name: "Legacy Lucky",
      stats: stableSnapshot.stats,
      size: 2,
      base: 40,
      characteristics: ["Construct", "Enforcer"],
      injuries: [{ id: "legacy-injury", name: "Legacy Scar", effect: "Legacy effect" }],
      acquiredBy: source.id,
    };
    legacy.loadout.assignments = [
      { equipmentId: "eq-totem-kit", targetKind: "totem", targetId: null },
    ];
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), legacy);
    state = await stateOf(page);
    assert.equal(state.leader.totem.id, stableTotemId);
    assert.equal(state.leader.totem.sourceAdvancementId, source.id);
    assert.equal(state.leader.totem.cost, 0);
    assert.equal(state.leader.totem.permanentHired, true);
    assert.deepEqual(state.leader.totem.snapshot, stableSnapshot);
    assert.equal(state.leader.totem.injuries[0].name, "Legacy Scar");

    const invalidImport = JSON.parse(JSON.stringify(legacy));
    invalidImport.arsenal.scrip = 4;
    invalidImport.leader.advances[0].flip.card = "8";
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), invalidImport);
    state = await stateOf(page);
    assert.equal(state.leader.totem, null, "Invalid imported Totem source survived normalization.");
    assert.equal(state.leader.advances.some((advance) => advance.tableId === "totem"), false);
    assert.equal(state.leader.advances.some((advance) => advance.recipient === "totem"), false);
    assert.equal(state.loadout.assignments.some((assignment) => assignment.targetKind === "totem"), false);
    assert.equal(state.arsenal.scrip, 4, "Invalid Totem cleanup trusted forged orphan scrip.");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    assert.equal((await stateOf(page)).arsenal.scrip, 4, "Invalid import changed scrip after reload.");

    const tierSpoofImport = JSON.parse(JSON.stringify(legacy));
    tierSpoofImport.arsenal.scrip = 4;
    tierSpoofImport.leader.advances = [
      { ...source, xp: 1 },
      earnedTotemAbility(),
    ];
    tierSpoofImport.leader.totem.sourceAdvancementId = source.id;
    await page.evaluate(
      (value) => window.MalifauxBuilder.replaceState(value),
      tierSpoofImport,
    );
    state = await stateOf(page);
    assert.equal(state.leader.totem, null, "Tier III Totem survived in an XP 1/Tier I slot.");
    assert.equal(state.leader.advances.some((advance) => advance.tableId === "totem"), false);
    assert.equal(state.leader.advances.some((advance) => advance.recipient === "totem"), false);
    assert.equal(state.loadout.assignments.some((assignment) => assignment.targetKind === "totem"), false);
    assert.equal(state.arsenal.scrip, 4, "Tier-spoof cleanup trusted forged orphan scrip.");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    assert.equal((await stateOf(page)).arsenal.scrip, 4, "Tier-spoof import changed scrip after reload.");

    const selfRecipientImport = JSON.parse(JSON.stringify(legacy));
    selfRecipientImport.arsenal.scrip = 4;
    selfRecipientImport.leader.advances = [
      { ...source, recipient: "totem" },
      earnedTotemAbility(),
    ];
    selfRecipientImport.leader.totem.sourceAdvancementId = source.id;
    await page.evaluate(
      (value) => window.MalifauxBuilder.replaceState(value),
      selfRecipientImport,
    );
    state = await stateOf(page);
    assert.equal(state.leader.totem, null, "Self-recipient Totem source survived import.");
    assert.equal(state.leader.advances.some((advance) => advance.tableId === "totem"), false);
    assert.equal(state.leader.advances.some((advance) => advance.recipient === "totem"), false);
    assert.equal(state.loadout.assignments.some((assignment) => assignment.targetKind === "totem"), false);
    assert.equal(state.arsenal.scrip, 4, "Self-recipient cleanup trusted forged orphan scrip.");

    const linkedSource = {
      ...source,
      xp: 7,
      acquiredTotemId: stableTotemId,
    };
    const competingSource = {
      ...source,
      id: "competing-night-source",
      xp: 5,
      choiceId: "night-marketeer",
      name: "Night Marketeer",
      flip: { card: "8", cheated: false },
      snapshot: { id: "night-marketeer", name: "Night Marketeer" },
      acquiredTotemId: "competing-night-totem",
    };
    const linkedAbility = { ...earnedTotemAbility(), xp: 11 };
    const forgedSnapshot = {
      ...stableSnapshot,
      name: "Forged Catalog Name",
      stats: { ...stableSnapshot.stats, df: 99 },
      abilities: [
        ...(stableSnapshot.abilities || []),
        { id: "forged-ability", name: "Forged Ability", text: "Must disappear" },
      ],
    };
    const forgedSource = {
      ...linkedSource,
      snapshot: forgedSnapshot,
      acquiredTotemId: "spoofed-source-totem-id",
    };
    const forgedImport = JSON.parse(JSON.stringify(legacy));
    forgedImport.arsenal.scrip = 5;
    forgedImport.leader.advances = [forgedSource, linkedAbility];
    forgedImport.leader.totem = {
      ...forgedImport.leader.totem,
      id: stableTotemId,
      sourceAdvancementId: source.id,
      acquiredBy: source.id,
      customName: "Canonical Lucky",
      name: "Spoofed top-level display",
      snapshot: forgedSnapshot,
      profile: forgedSnapshot,
      stats: forgedSnapshot.stats,
    };
    forgedImport.loadout.assignments = [
      {
        equipmentId: "eq-totem-kit",
        targetKind: "totem",
        targetId: "spoofed-source-totem-id",
      },
    ];
    await page.evaluate(
      (value) => window.MalifauxBuilder.replaceState(value),
      forgedImport,
    );
    state = await stateOf(page);
    assert.equal(state.leader.totem.id, stableTotemId, "Source ID spoof replaced stored Totem ID.");
    assert.equal(state.leader.totem.customName, "Canonical Lucky");
    assert.equal(state.leader.totem.name, "Canonical Lucky");
    assert.equal(state.leader.totem.snapshot.name, "Chance Taker");
    assert.equal(state.leader.totem.snapshot.stats.df, 6);
    assert.equal(state.leader.totem.stats.df, 6);
    assert.equal(
      state.leader.totem.snapshot.abilities.some((ability) => ability.id === "forged-ability"),
      false,
      "Forged stored/source ability survived catalog canonicalization.",
    );
    const normalizedForgedSource = state.leader.advances.find(
      (advance) => advance.id === source.id,
    );
    assert.equal(normalizedForgedSource.acquiredTotemId, stableTotemId);
    assert.equal(normalizedForgedSource.snapshot.stats.df, 6);
    assert.equal(
      normalizedForgedSource.snapshot.abilities.some(
        (ability) => ability.id === "forged-ability",
      ),
      false,
    );
    assert.deepEqual(
      state.loadout.assignments,
      [{ equipmentId: "eq-totem-kit", targetKind: "totem", targetId: null }],
      "Existing Totem assignment was not safely relinked.",
    );
    await page.locator('.nav-item[data-route="leader"]').click();
    assert.doesNotMatch(await page.locator("#totemCard").textContent(), /Forged Ability/);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await stateOf(page);
    assert.equal(state.leader.totem.id, stableTotemId);
    assert.equal(state.leader.totem.snapshot.stats.df, 6);
    assert.equal(state.leader.advances.find((advance) => advance.id === source.id).acquiredTotemId, stableTotemId);
    assert.deepEqual(
      state.loadout.assignments,
      [{ equipmentId: "eq-totem-kit", targetKind: "totem", targetId: null }],
    );

    const linkedSecondImport = JSON.parse(JSON.stringify(legacy));
    linkedSecondImport.arsenal.scrip = 5;
    linkedSecondImport.leader.advances = [
      competingSource,
      linkedSource,
      linkedAbility,
    ];
    linkedSecondImport.leader.totem.sourceAdvancementId = source.id;
    linkedSecondImport.leader.totem.acquiredBy = source.id;
    await page.evaluate(
      (value) => window.MalifauxBuilder.replaceState(value),
      linkedSecondImport,
    );
    state = await stateOf(page);
    assert.equal(state.leader.totem.sourceAdvancementId, source.id);
    assert.equal(state.leader.totem.profileId, "chance-taker");
    assert.equal(state.leader.totem.snapshot.id, "chance-taker");
    assert.deepEqual(
      state.leader.advances
        .filter((advance) => advance.tableId === "totem")
        .map((advance) => advance.id),
      [source.id],
      "A competing earlier source replaced the explicitly linked source.",
    );
    assert.equal(state.leader.advances.some((advance) => advance.id === linkedAbility.id), true);
    assert.equal(state.arsenal.scrip, 5);
    const linkedStableId = state.leader.totem.id;
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await stateOf(page);
    assert.equal(state.leader.totem.id, linkedStableId);
    assert.equal(state.leader.totem.sourceAdvancementId, source.id);
    assert.equal(state.arsenal.scrip, 5);

    const missingLinkFallback = JSON.parse(JSON.stringify(linkedSecondImport));
    missingLinkFallback.leader.totem.sourceAdvancementId = "missing-source";
    missingLinkFallback.leader.totem.acquiredBy = "missing-source";
    await page.evaluate(
      (value) => window.MalifauxBuilder.replaceState(value),
      missingLinkFallback,
    );
    state = await stateOf(page);
    assert.equal(state.leader.totem.sourceAdvancementId, competingSource.id);
    assert.equal(state.leader.totem.profileId, "night-marketeer");
    assert.equal(state.leader.totem.snapshot.id, "night-marketeer");
    assert.deepEqual(
      state.leader.advances
        .filter((advance) => advance.tableId === "totem")
        .map((advance) => advance.id),
      [competingSource.id],
      "Missing saved link did not fall back to the first valid source.",
    );

    const invalidSavedSource = {
      ...linkedSource,
      id: "invalid-saved-source",
      xp: 1,
    };
    const invalidLinkFallback = JSON.parse(JSON.stringify(linkedSecondImport));
    invalidLinkFallback.leader.advances = [
      invalidSavedSource,
      competingSource,
      linkedSource,
      linkedAbility,
    ];
    invalidLinkFallback.leader.totem.sourceAdvancementId = invalidSavedSource.id;
    invalidLinkFallback.leader.totem.acquiredBy = invalidSavedSource.id;
    await page.evaluate(
      (value) => window.MalifauxBuilder.replaceState(value),
      invalidLinkFallback,
    );
    state = await stateOf(page);
    assert.equal(state.leader.totem.sourceAdvancementId, competingSource.id);
    assert.equal(state.leader.totem.profileId, "night-marketeer");
    assert.equal(state.leader.advances.some((advance) => advance.id === invalidSavedSource.id), false);
    assert.equal(state.leader.advances.some((advance) => advance.id === linkedSource.id), false);
    assert.equal(state.loadout.assignments.some((assignment) => assignment.targetKind === "totem"), true);
    const fallbackStableId = state.leader.totem.id;
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await stateOf(page);
    assert.equal(state.leader.totem.id, fallbackStableId);
    assert.equal(state.leader.totem.sourceAdvancementId, competingSource.id);
    assert.equal(state.leader.totem.profileId, "night-marketeer");
    assert.equal(state.arsenal.scrip, 5, "Fallback import changed scrip across reload.");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-route="arsenal"]').click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    assert.ok(overflow <= 1, `Mobile Totem layout overflows by ${overflow}px.`);
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
  }

  process.stdout.write("KAN9_SMOKE_OK\n");
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
