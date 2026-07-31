const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

function abilityAdvance({
  id,
  xp,
  recipient,
  choiceId,
  name,
  effect,
  flip,
  scripPaid = 0,
  source = "",
}) {
  return {
    id,
    xp,
    maxTier: 4,
    tier: 2,
    tableId: "ability",
    recipient,
    choiceId,
    name,
    resultType: "ability",
    flip: { card: String(flip), cheated: false },
    snapshot: {
      id: choiceId,
      name,
      type: "ability",
      effect,
      sourceRevision: "fixture-v1",
    },
    source,
    scripPaid,
    createdAt: "2026-07-31T00:00:00.000Z",
  };
}

const fixture = {
  version: 4,
  crew: {
    name: "KAN-8 Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Living"],
  },
  campaign: { length: 8, week: 5, meetingDay: "" },
  leader: {
    name: "Ability Keeper",
    archetype: "Generalist",
    characteristics: ["Living", "Construct"],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [],
    crewCard: "",
    xp: 25,
    injuries: [
      {
        id: "leader-injury",
        name: "Leader Wound",
        nameEn: "Leader Wound",
        effect: "Leader injury effect",
        effectEn: "Leader injury effect",
        week: 4,
      },
    ],
    advances: [
      abilityAdvance({
        id: "leader-ruthless",
        xp: 3,
        recipient: "leader",
        choiceId: "ability-ruthless",
        name: "Ruthless archived",
        effect: "Standalone Ruthless snapshot",
        flip: 1,
      }),
      abilityAdvance({
        id: "leader-paid",
        xp: 5,
        recipient: "leader",
        choiceId: "ability-butterfly-jump",
        name: "Butterfly Jump archived",
        effect: "Paid autonomous snapshot",
        flip: 11,
        scripPaid: 2,
      }),
      {
        id: "totem-create",
        xp: 7,
        maxTier: 4,
        tier: 3,
        tableId: "totem",
        recipient: "leader",
        choiceId: "chance-taker",
        name: "Chance Taker",
        resultType: "totem",
        flip: { card: "7", cheated: false },
        snapshot: { id: "chance-taker", name: "Chance Taker" },
        acquiredTotemId: "kan8-totem",
        scripPaid: 0,
      },
      abilityAdvance({
        id: "totem-chatty",
        xp: 11,
        recipient: "totem",
        choiceId: "ability-chatty",
        name: "Chatty archived",
        effect: "Totem snapshot one",
        flip: 8,
      }),
      abilityAdvance({
        id: "totem-stealth",
        xp: 13,
        recipient: "totem",
        choiceId: "ability-stealth",
        name: "Stealth archived",
        effect: "Totem snapshot two",
        flip: 12,
        scripPaid: 1,
      }),
    ],
    totem: {
      id: "kan8-totem",
      profileId: "chance-taker",
      name: "Ability Totem",
      size: 1,
      base: 30,
      characteristics: ["Living"],
      injuries: [
        {
          id: "totem-injury",
          name: "Totem Wound",
          nameEn: "Totem Wound",
          effect: "Totem injury effect",
          effectEn: "Totem injury effect",
          week: 5,
        },
      ],
      acquiredBy: "totem-create",
    },
  },
  arsenal: {
    models: [
      {
        id: "ordinary-model",
        name: "Ordinary Minion",
        cost: 5,
        type: "Minion",
        keywords: "Marshal",
        modelLimit: 2,
        injuries: [],
      },
    ],
    equipment: [],
    equipmentScripSpent: 0,
    scrip: 8,
  },
  loadout: { hiredModelIds: ["ordinary-model"], assignments: [] },
  games: [],
};

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), fixture);

    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(
      state.leader.advances.filter(
        (advance) => advance.tableId === "ability" && advance.recipient === "leader",
      ).length,
      2,
    );
    assert.equal(
      state.leader.advances.filter(
        (advance) => advance.tableId === "ability" && advance.recipient === "totem",
      ).length,
      2,
    );

    await page.locator('.nav-item[data-route="leader"]').click();
    const leaderPermanent = page.locator("#leaderPermanentRecords");
    assert.match(await leaderPermanent.textContent(), /Способности/);
    assert.match(await leaderPermanent.textContent(), /Травмы/);
    assert.match(await leaderPermanent.textContent(), /Ruthless/);
    assert.match(await leaderPermanent.textContent(), /Leader Wound/);
    const totemCard = page.locator("#totemCard");
    assert.match(await totemCard.textContent(), /Chatty/);
    assert.match(await totemCard.textContent(), /Stealth/);
    assert.match(await totemCard.textContent(), /Totem Wound/);
    assert.equal(
      await totemCard.locator('[data-permanent-section="abilities"]').count(),
      1,
    );
    assert.equal(
      await totemCard.locator('[data-permanent-section="injuries"]').count(),
      1,
    );

    await page.locator('[data-route="arsenal"]').click();
    const currentRoster = page.locator("#activeLoadoutSummary");
    assert.match(await currentRoster.textContent(), /Ruthless/);
    assert.match(await currentRoster.textContent(), /Chatty/);
    assert.match(await currentRoster.textContent(), /Leader Wound/);
    assert.match(await currentRoster.textContent(), /Totem Wound/);
    const ordinaryRow = page.locator(".model-row").filter({ hasText: "Ordinary Minion" });
    assert.equal(
      await ordinaryRow.locator("[data-delete-ability-advancement], [data-add-ability]").count(),
      0,
      "Ordinary models expose ability controls.",
    );
    assert.equal(await page.locator("#ratingAdvances").inputValue(), "5");
    assert.equal(await page.locator("#ratingInjuries").inputValue(), "2");

    await page.locator('[data-route="chronicle"]').click();
    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "20");
    await page.selectOption("#advancementTable", "ability");
    assert.deepEqual(
      await page.locator("#advancementTarget option").evaluateAll((options) =>
        options.map((option) => option.value),
      ),
      ["leader", "totem"],
      "Ability recipient list contains a non-leader/non-Totem target.",
    );
    await page.selectOption("#advancementTarget", "leader");
    await page.selectOption("#advancementFlip", "1");
    const advancesBeforeTamper = (
      await page.evaluate(() => window.MalifauxBuilder.getState())
    ).leader.advances.length;
    const ratingBeforeTamper = await page.locator("#ratingAdvances").inputValue();
    await page.evaluate(() => {
      const target = document.querySelector("#advancementTarget");
      target.append(new Option("Ordinary model", "model:ordinary-model"));
      target.value = "model:ordinary-model";
      document.querySelector("#advancementChoice").value = "ability-evasive";
      document.querySelector("#advancementForm").requestSubmit();
    });
    await page.waitForTimeout(50);
    assert.equal(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).leader.advances.length,
      advancesBeforeTamper,
      "DOM-injected model recipient saved an ability.",
    );
    assert.equal(
      await page.locator("#ratingAdvances").inputValue(),
      ratingBeforeTamper,
      "DOM-injected model recipient changed CR.",
    );
    assert.match(
      await page.locator("#toastRegion").textContent(),
      /только лидеру|only be assigned to the leader/i,
    );
    await page.selectOption("#advancementTarget", "leader");
    await page.selectOption("#advancementFlip", "1");
    const duplicateOption = page.locator(
      '#advancementChoice option[value="ability-ruthless"]',
    );
    assert.equal(
      await duplicateOption.evaluate((option) => option.disabled),
      true,
      "Duplicate ability is selectable.",
    );
    const advancesBeforeDuplicate = (
      await page.evaluate(() => window.MalifauxBuilder.getState())
    ).leader.advances.length;
    await page.evaluate(() => {
      document.querySelector("#advancementChoice").value = "ability-ruthless";
      document.querySelector("#advancementForm").requestSubmit();
    });
    await page.waitForTimeout(50);
    assert.equal(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).leader.advances.length,
      advancesBeforeDuplicate,
      "A forbidden duplicate ability was saved.",
    );
    assert.match(
      await page.locator("#toastRegion").textContent(),
      /уже назначена|already assigned/i,
    );

    await page.selectOption("#advancementChoice", "ability-evasive");
    await page.locator("#advancementForm").evaluate((form) => form.requestSubmit());
    await page.waitForFunction(() =>
      window.MalifauxBuilder.getState().leader.advances.some(
        (advance) => advance.choiceId === "ability-evasive",
      ),
    );
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    const evasive = state.leader.advances.find(
      (advance) => advance.choiceId === "ability-evasive",
    );
    assert.equal(evasive.recipient, "leader");
    assert.equal(evasive.snapshot.type, "ability");
    assert.equal(evasive.snapshot.name, "Evasive");
    assert.equal(evasive.flip.card, "1");

    const serialized = await page.evaluate(() =>
      JSON.stringify(window.MalifauxBuilder.getState()),
    );
    await page.evaluate((json) => {
      window.MalifauxAdvancementData = {
        tier2: { abilities: { always: [], byValue: {} } },
      };
      window.MalifauxBuilder.replaceState(JSON.parse(json));
    }, serialized);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(
      state.leader.advances.find((advance) => advance.id === "leader-ruthless").snapshot,
      { id: "ability-ruthless", value: 1, name: "Ruthless", page: 50 },
      "Known ability did not recover its canonical catalog snapshot.",
    );

    await page.evaluate(() => window.renderPrintDossier());
    const printText = await page.locator("#printDossier").textContent();
    assert.match(printText, /Способности/);
    assert.match(printText, /Травмы/);
    assert.match(printText, /Ruthless/);
    assert.match(printText, /Chatty/);
    assert.match(printText, /Leader Wound/);
    assert.match(printText, /Totem Wound/);

    await page.locator('.nav-item[data-route="leader"]').click();
    const paidDelete = page.locator(
      '#leaderPermanentRecords [data-delete-ability-advancement="leader-paid"]',
    );
    page.once("dialog", (dialog) => dialog.dismiss());
    await paidDelete.click();
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.advances.some((advance) => advance.id === "leader-paid"), true);
    assert.equal(state.arsenal.scrip, 8);
    page.once("dialog", (dialog) => dialog.accept());
    await paidDelete.click();
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.advances.some((advance) => advance.id === "leader-paid"), false);
    assert.equal(state.arsenal.scrip, 8, "Forged ability surcharge produced a refund.");
    assert.equal(await page.locator("#ratingAdvances").inputValue(), "5");

    await page.locator('[data-route="chronicle"]').click();
    const totemDelete = page.locator('[data-delete-advancement="totem-create"]');
    page.once("dialog", (dialog) => dialog.accept());
    await totemDelete.click();
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.totem, null, "Deleting Totem advancement kept the Totem.");
    assert.equal(
      state.leader.advances.some((advance) => advance.recipient === "totem"),
      false,
      "Deleting Totem kept dependent Totem abilities.",
    );
    assert.equal(state.arsenal.scrip, 8, "Forged Totem ability surcharge produced a refund.");
    assert.equal(await page.locator("#ratingAdvances").inputValue(), "2");

    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "25");
    await page.selectOption("#advancementTable", "ability");
    assert.deepEqual(
      await page.locator("#advancementTarget option").evaluateAll((options) =>
        options.map((option) => option.value),
      ),
      ["leader"],
      "Totem remains an ability recipient after it was removed.",
    );
    await page.locator("#advancementDialog").evaluate((dialog) => dialog.close());

    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    state.leader.advances.push(
      abilityAdvance({
        id: "duplicate-leader-ruthless",
        xp: 17,
        recipient: "leader",
        choiceId: "ability-ruthless",
        name: "Duplicate with another display name",
        effect: "Must be discarded",
        flip: 1,
      }),
      abilityAdvance({
        id: "same-name-choice-a",
        xp: 13,
        recipient: "leader",
        choiceId: "ability-flight",
        name: "Shared display name",
        effect: "First distinct choice",
        flip: 6,
      }),
      abilityAdvance({
        id: "same-name-choice-b",
        xp: 25,
        recipient: "leader",
        choiceId: "ability-deadly-pursuit",
        name: "Shared display name",
        effect: "Second distinct choice",
        flip: 6,
      }),
      abilityAdvance({
        id: "fallback-first",
        xp: 5,
        recipient: "leader",
        choiceId: "",
        name: "Fallback Ability",
        source: "Source One",
        effect: "First fallback identity",
        flip: 6,
      }),
      abilityAdvance({
        id: "fallback-duplicate",
        xp: 8,
        recipient: "leader",
        choiceId: "",
        name: "  fallback   ability ",
        source: "source one",
        effect: "Normalized duplicate",
        flip: 6,
      }),
      abilityAdvance({
        id: "fallback-other-source",
        xp: 11,
        recipient: "leader",
        choiceId: "",
        name: "Fallback Ability",
        source: "Source Two",
        effect: "Same name, distinct source",
        flip: 6,
      }),
    );
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), state);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(
      state.leader.advances.some(
        (advance) => advance.id === "duplicate-leader-ruthless",
      ),
      false,
      "Import kept a duplicate leader ability.",
    );
    assert.deepEqual(
      state.leader.advances
        .filter((advance) => ["ability-deadly-pursuit", "ability-flight"].includes(advance.choiceId))
        .map((advance) => advance.choiceId)
        .sort(),
      ["ability-deadly-pursuit", "ability-flight"],
      "Distinct choices with the same display name were deduplicated.",
    );
    assert.equal(
      state.leader.advances.some((advance) => advance.id === "fallback-first"),
      true,
    );
    assert.equal(
      state.leader.advances.some((advance) => advance.id === "fallback-duplicate"),
      false,
      "Fallback name/source identity was not normalized before deduplication.",
    );
    assert.equal(
      state.leader.advances.some(
        (advance) => advance.id === "fallback-other-source",
      ),
      true,
      "Same-name abilities from different sources were deduplicated.",
    );

    state.leader.advances.push(
      abilityAdvance({
        id: "orphan-totem-ability",
        xp: 13,
        recipient: "totem",
        choiceId: "ability-flight",
        name: "Orphan Flight",
        effect: "Must be removed safely",
        flip: 6,
        scripPaid: 3,
      }),
      abilityAdvance({
        id: "duplicate-orphan-totem-ability",
        xp: 17,
        recipient: "totem",
        choiceId: "ability-flight",
        name: "Duplicate Orphan Flight",
        effect: "Must be deduplicated before refund",
        flip: 6,
        scripPaid: 3,
      }),
    );
    const scripBeforeOrphanImport = state.arsenal.scrip;
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), state);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(
      state.leader.advances.some((advance) => advance.id === "orphan-totem-ability"),
      false,
      "Import kept a Totem ability without a Totem.",
    );
    assert.equal(
      state.arsenal.scrip,
      scripBeforeOrphanImport,
      "Forged orphaned ability surcharge changed available scrip.",
    );
    assert.equal(
      state.leader.advances.some(
        (advance) => advance.id === "duplicate-orphan-totem-ability",
      ),
      false,
    );

    const stableAdvanceIds = state.leader.advances.map((advance) => advance.id);
    const stableScrip = state.arsenal.scrip;
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(
      state.leader.advances.map((advance) => advance.id),
      stableAdvanceIds,
      "Ability import deduplication was not stable after reload.",
    );
    assert.equal(state.arsenal.scrip, stableScrip, "Orphan refund repeated after reload.");

    const stableImportedState = state;
    const limitXpSlots = [1, 2, 3, 5, 7, 9, 11, 13, 17, 20, 21, 25, 30, 35, 39];
    const limitUniqueAdvances = limitXpSlots.map((xp, index) =>
      abilityAdvance({
        id: `limit-unique-${index + 1}`,
        xp,
        recipient: "leader",
        choiceId: `limit-choice-${index + 1}`,
        name: `Limit unique ${index + 1}`,
        effect: `Limit effect ${index + 1}`,
        flip: (index % 13) + 1,
      }),
    );
    const duplicateBeforeLastUnique = abilityAdvance({
      id: "limit-duplicate-first",
      xp: 2,
      recipient: "leader",
      choiceId: "limit-choice-1",
      name: "Duplicate of the first limit ability",
      effect: "Must not consume an import slot",
      flip: 2,
    });
    const limitImportState = JSON.parse(JSON.stringify(stableImportedState));
    limitImportState.leader.xp = 39;
    limitImportState.leader.advances = [
      limitUniqueAdvances[0],
      duplicateBeforeLastUnique,
      ...limitUniqueAdvances.slice(1),
    ];
    assert.equal(limitImportState.leader.advances.length, limitXpSlots.length + 1);
    await page.evaluate(
      (value) => window.MalifauxBuilder.replaceState(value),
      limitImportState,
    );
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(
      state.leader.advances.map((advance) => advance.id),
      limitUniqueAdvances.map((advance) => advance.id),
      "An early duplicate consumed the slot of the final unique advancement.",
    );
    assert.equal(
      state.leader.advances.at(-1)?.id,
      "limit-unique-15",
      "The final unique advancement was lost at the import limit.",
    );

    await page.evaluate(
      (value) => window.MalifauxBuilder.replaceState(value),
      stableImportedState,
    );
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(state.leader.advances.map((advance) => advance.id), stableAdvanceIds);
    assert.equal(state.arsenal.scrip, stableScrip, "Orphan refund regressed after limit import.");

    await page.locator('.nav-item[data-route="leader"]').click();
    await page.locator('[data-locale="en"]').click();
    assert.match(await page.locator("#leaderPermanentRecords").textContent(), /Abilities/);
    assert.match(await page.locator("#leaderPermanentRecords").textContent(), /Injuries/);
    await page.locator('[data-locale="ru"]').click();

    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    assert.ok(overflow <= 1, `Mobile ability layout overflows by ${overflow}px.`);
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
  }

  process.stdout.write("KAN8_SMOKE_OK\n");
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
