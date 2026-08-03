const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

const fixture = {
  version: 4,
  crew: {
    name: "KAN-10 Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Living"],
  },
  campaign: { length: 8, week: 5, meetingDay: "" },
  leader: {
    name: "Advancement Keeper",
    archetype: "Generalist",
    characteristics: ["Living", "Construct"],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [
      {
        name: "Test Blade",
        snapshot: {
          sourceCard: { id: "kan10-card", name: "KAN-10 Source" },
          entry: {
            id: "kan10-test-blade",
            name: "Test Blade",
            type: "attack",
            stat: "5",
            resistedBy: "Df",
            triggers: [{ name: "Base Trigger A" }, { name: "Base Trigger B" }],
          },
        },
      },
    ],
    crewCard: "",
    xp: 13,
    injuries: [],
    advances: [
      {
        id: "test-blade-advance",
        xp: 3,
        maxTier: 2,
        tier: 2,
        tableId: "action",
        recipient: "leader",
        choiceId: "legacy-test-blade",
        name: "Test Blade",
        resultType: "action",
        flip: { card: "1", cheated: false },
        snapshot: {
          id: "legacy-test-blade",
          name: "Test Blade",
          type: "attack",
          skill: 5,
          resist: "Df",
          triggers: [{ name: "Base Trigger A" }, { name: "Base Trigger B" }],
        },
        scripPaid: 0,
      },
    ],
  },
  arsenal: { models: [], equipment: [], equipmentScripSpent: 0, scrip: 5 },
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

    const catalog = await page.evaluate(() => {
      const data = window.MalifauxAdvancementData;
      return {
        version: data.version,
        frozen: Object.isFrozen(data) && Object.isFrozen(data.tables),
        xpTrack: [...data.xpTrack],
        schema: data.schema,
        tables: Object.values(data.tables).map((table) => ({
          id: table.id,
          tier: table.tier,
          pages: table.pages,
          recipients: table.recipients,
          repeatability: table.repeatability,
        })),
      };
    });
    assert.equal(catalog.version, 2);
    assert.equal(catalog.frozen, true);
    assert.equal(catalog.xpTrack.length, 39);
    assert.equal(catalog.schema.xpPositions, 39);
    assert.deepEqual(catalog.schema.tierRange, [1, 4]);
    assert.deepEqual(
      catalog.xpTrack.flatMap((tier, index) => (tier ? [index + 1] : [])),
      [1, 2, 3, 5, 7, 9, 11, 13, 17, 20, 21, 25, 30, 35, 39],
    );
    assert.ok(catalog.tables.length >= 7);
    catalog.tables.forEach((table) => {
      assert.ok(table.id);
      assert.ok(table.tier >= 1 && table.tier <= 4);
      assert.ok(table.pages.length);
      assert.ok(table.recipients.length);
      assert.ok(table.repeatability);
    });

    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), fixture);
    await page.locator('[data-route="chronicle"]').click();
    assert.equal(await page.locator("#xpTrack .xp-box").count(), 39);

    // A forged Tier II table must not be accepted in the Tier I XP 1 slot.
    await page.locator("#addAdvancementButton").click();
    const beforeTierTamper = await page.evaluate(
      () => window.MalifauxBuilder.getState().leader.advances.length,
    );
    await page.evaluate(() => {
      const table = document.querySelector("#advancementTable");
      table.append(new Option("Ability", "ability"));
      table.value = "ability";
      document.querySelector("#advancementFlip").innerHTML = '<option value="1">1</option>';
      document.querySelector("#advancementFlip").value = "1";
      document.querySelector("#advancementChoice").innerHTML =
        '<option value="ability-ruthless">Ruthless</option>';
      document.querySelector("#advancementChoice").value = "ability-ruthless";
      document.querySelector("#advancementName").value = "Ruthless";
      document.querySelector("#advancementForm").requestSubmit();
    });
    await page.waitForTimeout(50);
    assert.equal(
      await page.evaluate(() => window.MalifauxBuilder.getState().leader.advances.length),
      beforeTierTamper,
      "DOM-forged table bypassed the XP Tier limit.",
    );
    await page.locator("#advancementDialog").evaluate((dialog) => dialog.close());

    // The surcharge must come from the stored action, not the readonly display field.
    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "5");
    await page.selectOption("#advancementTable", "attack-modification");
    await page.selectOption("#advancementFlip", "1");
    await page.selectOption("#advancementChoice", "attack-1-dismember");
    await page.selectOption("#advancementAppliesTo", "Test Blade");
    assert.equal(await page.locator("#advancementExistingTriggers").getAttribute("readonly"), "");
    assert.equal(await page.locator("#advancementExistingTriggers").inputValue(), "2");
    assert.equal(await page.locator("#advancementScripCost").inputValue(), "2");
    await page.evaluate(() => {
      document.querySelector("#advancementExistingTriggers").value = "0";
      document.querySelector("#advancementScripCost").value = "0";
      document.querySelector("#advancementForm").requestSubmit();
    });
    await page.waitForFunction(() =>
      window.MalifauxBuilder.getState().leader.advances.some(
        (advance) => advance.choiceId === "attack-1-dismember",
      ),
    );
    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    const dismember = state.leader.advances.find(
      (advance) => advance.choiceId === "attack-1-dismember",
    );
    assert.equal(dismember.scripPaid, 2);
    assert.equal(state.arsenal.scrip, 3);

    // The same trigger cannot be added to the same action twice.
    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "7");
    await page.selectOption("#advancementTable", "attack-modification");
    await page.selectOption("#advancementFlip", "1");
    await page.selectOption("#advancementChoice", "attack-1-dismember");
    await page.selectOption("#advancementAppliesTo", "Test Blade");
    const beforeDuplicate = state.leader.advances.length;
    await page.evaluate(() => document.querySelector("#advancementForm").requestSubmit());
    await page.waitForTimeout(50);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.advances.length, beforeDuplicate);
    await page.locator("#advancementDialog").evaluate((dialog) => dialog.close());

    // Record one Tier II result so rollback covers several advancement kinds.
    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "7");
    await page.selectOption("#advancementTable", "ability");
    await page.selectOption("#advancementFlip", "1");
    await page.selectOption("#advancementChoice", "ability-ruthless");
    await page.evaluate(() => {
      document.querySelector("#advancementName").value = "Forged DOM name";
      document.querySelector("#advancementForm").requestSubmit();
    });
    await page.waitForFunction(() =>
      window.MalifauxBuilder.getState().leader.advances.some(
        (advance) => advance.choiceId === "ability-ruthless",
      ),
    );
    const canonicalRuthless = (
      await page.evaluate(() => window.MalifauxBuilder.getState())
    ).leader.advances.find((advance) => advance.choiceId === "ability-ruthless");
    assert.equal(canonicalRuthless.name, "Ruthless");
    assert.equal(canonicalRuthless.snapshot.name, "Ruthless");

    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    state.games = [
      {
        id: "kan10-game",
        week: 5,
        opponent: "Rollback",
        vp: 0,
        schemes: 0,
        won: false,
        lost: true,
        pathGoal: false,
        withdrewEarly: false,
        withdrewLate: false,
        ratingGap: 0,
        hand: 1,
        scrip: 0,
        xp: 9,
        creditedXp: 9,
        loadoutSnapshot: null,
      },
    ];
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), state);

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.locator('[data-delete-game-index="0"]').click();
    assert.equal(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).games.length,
      1,
      "Cancelled rollback changed state.",
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator('[data-delete-game-index="0"]').click();
    await page.waitForFunction(() => window.MalifauxBuilder.getState().games.length === 0);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.xp, 4);
    assert.deepEqual(state.leader.advances.map((advance) => advance.id), ["test-blade-advance"]);
    assert.equal(state.arsenal.scrip, 5, "Rollback did not refund the trigger surcharge.");

    // Known records without a snapshot recover canonical catalog metadata on import.
    const imported = structuredClone(fixture);
    imported.leader.xp = 3;
    imported.leader.advances = [
      {
        id: "known-without-snapshot",
        xp: 3,
        tableId: "ability",
        recipient: "leader",
        choiceId: "ability-ruthless",
        name: "Ruthless",
        resultType: "ability",
        flip: { card: "1", cheated: false },
      },
    ];
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), imported);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.advances[0].snapshot.id, "ability-ruthless");
    assert.equal(state.leader.advances[0].snapshot.name, "Ruthless");
    assert.equal(state.leader.advances[0].snapshot.page, 50);

    // Known imports are validated sequentially; unknown legacy rows stay inert and stable.
    const hardenedImport = structuredClone(fixture);
    hardenedImport.leader.xp = 39;
    hardenedImport.arsenal.scrip = 4;
    hardenedImport.leader.advances = [
      {
        id: "tier-spoof",
        xp: 1,
        tableId: "ability",
        recipient: "leader",
        choiceId: "ability-ruthless",
        name: "Tier spoof",
        resultType: "ability",
        flip: { card: "1", cheated: false },
      },
      {
        id: "unknown-legacy",
        xp: 2,
        tableId: "future-legacy-table",
        recipient: "leader",
        choiceId: "future-result",
        name: "Future legacy result",
        resultType: "legacy",
        snapshot: { custom: "preserved" },
        scripPaid: 99,
      },
      {
        id: "action-first",
        xp: 3,
        tableId: "action",
        recipient: "leader",
        choiceId: "action-hand-cannon",
        name: "Forged first action name",
        resultType: "action",
        flip: { card: "1", cheated: false },
      },
      {
        id: "action-duplicate",
        xp: 5,
        tableId: "action",
        recipient: "leader",
        choiceId: "action-hand-cannon",
        name: "Forged duplicate name",
        resultType: "action",
        flip: { card: "1", cheated: false },
      },
      {
        id: "summoning-first",
        xp: 7,
        tableId: "summoning",
        recipient: "leader",
        choiceId: "summoning-formed-of-blood",
        name: "Forged summoning name",
        resultType: "action",
      },
      {
        id: "invalid-recipient",
        xp: 11,
        tableId: "ability",
        recipient: "model:forged",
        choiceId: "ability-evasive",
        name: "Evasive",
        resultType: "ability",
        flip: { card: "1", cheated: false },
      },
      {
        id: "summoning-second",
        xp: 13,
        tableId: "summoning",
        recipient: "leader",
        choiceId: "summoning-rally-point",
        name: "Second summoning",
        resultType: "action",
      },
      {
        id: "bad-skill-requirement",
        xp: 21,
        tableId: "attack-modification",
        recipient: "leader",
        choiceId: "attack-7-skill-boost",
        name: "Skill Boost",
        resultType: "skill",
        flip: { card: "7", cheated: false },
        appliesTo: "Test Blade",
      },
      {
        id: "invalid-flip",
        xp: 25,
        tableId: "ability",
        recipient: "leader",
        choiceId: "ability-ruthless",
        name: "Ruthless",
        resultType: "ability",
        flip: { card: "14", cheated: false },
      },
      {
        id: "known-forged",
        xp: 35,
        tableId: "ability",
        recipient: "leader",
        choiceId: "ability-ruthless",
        name: "Forged imported name",
        resultType: "ability",
        flip: { card: "1", cheated: false },
        snapshot: {
          id: "forged-id",
          name: "Forged snapshot name",
          page: 999,
          effect: "Forged effect",
        },
        scripPaid: 99,
      },
    ];
    await page.evaluate(
      (value) => window.MalifauxBuilder.replaceState(value),
      hardenedImport,
    );
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(
      state.leader.advances.map((advance) => advance.id),
      ["unknown-legacy", "action-first", "summoning-first", "known-forged"],
    );
    const preservedLegacy = state.leader.advances.find(
      (advance) => advance.id === "unknown-legacy",
    );
    assert.equal(preservedLegacy.legacy, true);
    assert.deepEqual(preservedLegacy.snapshot, { custom: "preserved" });
    assert.equal(preservedLegacy.scripPaid, 0);
    const canonicalAction = state.leader.advances.find(
      (advance) => advance.id === "action-first",
    );
    assert.equal(canonicalAction.name, "Hand Cannon");
    assert.equal(canonicalAction.snapshot.name, "Hand Cannon");
    const hardenedRuthless = state.leader.advances.find(
      (advance) => advance.id === "known-forged",
    );
    assert.equal(hardenedRuthless.name, "Ruthless");
    assert.equal(hardenedRuthless.snapshot.id, "ability-ruthless");
    assert.equal(hardenedRuthless.snapshot.name, "Ruthless");
    assert.equal(hardenedRuthless.snapshot.page, 50);
    assert.equal(hardenedRuthless.snapshot.effect, undefined);
    assert.equal(hardenedRuthless.scripPaid, 0);
    assert.equal(state.arsenal.scrip, 4);

    const stableHardenedIds = state.leader.advances.map((advance) => advance.id);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(state.leader.advances.map((advance) => advance.id), stableHardenedIds);
    assert.equal(state.arsenal.scrip, 4);

    assert.deepEqual(pageErrors, []);
    console.log("KAN10_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
