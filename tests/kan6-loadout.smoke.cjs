const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

const fixture = {
  version: 3,
  crew: {
    name: "KAN-6 Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Witch Hunter"],
  },
  campaign: { length: 8, week: 2, meetingDay: "" },
  leader: {
    name: "The Archivist",
    archetype: "Generalist",
    characteristics: ["Living", "Construct"],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [],
    crewCard: "",
    xp: 5,
    advances: [
      { id: "advance-1", xp: 1, tableId: "legacy", name: "Legacy advance 1" },
      { id: "advance-2", xp: 2, tableId: "legacy", name: "Legacy advance 2" },
      { id: "advance-3", xp: 3, tableId: "legacy", name: "Legacy advance 3" },
      {
        id: "advance-smoke",
        xp: 5,
        tableId: "totem",
        recipient: "leader",
        choiceId: "chance-taker",
        name: "Chance Taker",
        resultType: "totem",
        flip: { card: "7", cheated: false },
        acquiredTotemId: "totem-smoke",
      },
    ],
    totem: {
      id: "totem-smoke",
      profileId: "chance-taker",
      name: "Lucky",
      size: 1,
      base: 30,
      characteristics: ["Living"],
      injuries: 0,
      acquiredBy: "advance-smoke",
    },
  },
  arsenal: {
    models: [
      {
        id: "model-worker",
        name: "Clockwork Guard",
        cost: 6,
        type: "Other",
        henchman: false,
        keywords: "Marshal",
        modelLimit: 2,
        injuries: 1,
        addedWeek: 1,
        scripPaid: 0,
      },
      {
        id: "model-peon",
        name: "Test Peon",
        cost: 2,
        type: "Peon",
        henchman: false,
        keywords: "Marshal",
        modelLimit: 3,
        injuries: 0,
        addedWeek: 1,
        scripPaid: 0,
      },
      {
        id: "model-spare",
        name: "Disposable Guard",
        cost: 4,
        type: "Minion",
        henchman: false,
        keywords: "Marshal",
        modelLimit: 2,
        injuries: 0,
        addedWeek: 1,
        scripPaid: 0,
      },
    ],
    equipment: [
      { id: "eq-field", name: "Field Kit", acquisition: "custom", ratingExempt: false },
      { id: "eq-vow", name: "Vengeful Vow", acquisition: "free", ratingExempt: false },
      { id: "eq-seed", name: "Strange Seed Pod", acquisition: "free", ratingExempt: false },
      { id: "eq-pistol", name: "Pistol", acquisition: "free", ratingExempt: false },
      { id: "eq-spare", name: "Spare Kit", acquisition: "custom", ratingExempt: false },
      { id: "eq-trash", name: "Discard Me", acquisition: "custom", ratingExempt: false },
    ],
    equipmentScripSpent: 0,
    scrip: 10,
  },
  loadout: {
    hiredModelIds: ["model-worker", "model-peon", "model-spare"],
    assignments: [
      { equipmentId: "eq-field", targetKind: "model", targetId: "model-worker" },
      { equipmentId: "eq-vow", targetKind: "leader", targetId: null },
      { equipmentId: "eq-seed", targetKind: "model", targetId: "model-worker" },
      { equipmentId: "eq-pistol", targetKind: "totem", targetId: null },
      { equipmentId: "eq-spare", targetKind: "model", targetId: "model-spare" },
      { equipmentId: "eq-trash", targetKind: "leader", targetId: null },
    ],
  },
  games: [],
};

async function optionValues(page, equipmentId) {
  return page
    .locator(`[data-assign-equipment="${equipmentId}"]`)
    .evaluate((select) => [...select.options].map((option) => option.value));
}

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
    await page.locator('[data-route="arsenal"]').click();

    const summary = page.locator("#activeLoadoutSummary");
    await summary.waitFor();
    const summaryText = await summary.textContent();
    for (const text of [
      "The Archivist",
      "Clockwork Guard",
      "Lucky",
      "Field Kit",
      "Vengeful Vow",
      "Strange Seed Pod",
      "Pistol",
    ]) {
      assert.match(summaryText, new RegExp(text), `Active crew summary misses ${text}.`);
    }
    await page.locator('[data-locale="en"]').click();
    assert.match(await summary.textContent(), /Current encounter crew/);
    await page.locator('[data-locale="ru"]').click();
    assert.match(await summary.textContent(), /Команда на текущую встречу/);
    if (process.env.KAN6_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.KAN6_SCREENSHOT_DIR, { recursive: true });
      await summary.screenshot({
        path: path.join(process.env.KAN6_SCREENSHOT_DIR, "kan6-active-loadout.png"),
      });
    }

    const workerRow = page.locator(".model-row").filter({ hasText: "Clockwork Guard" });
    assert.match(await workerRow.textContent(), /Field Kit/);
    assert.match(await workerRow.textContent(), /Strange Seed Pod/);

    assert.equal(
      (await optionValues(page, "eq-field")).includes("model:model-peon"),
      false,
      "Peons must not be equipment targets.",
    );
    assert.deepEqual(
      await optionValues(page, "eq-vow"),
      ["", "leader"],
      "Vengeful Vow must only target the leader.",
    );
    assert.deepEqual(
      await optionValues(page, "eq-seed"),
      ["", "model:model-worker", "model:model-spare"],
      "Strange Seed Pod must only target hired non-unique models.",
    );

    await page.selectOption('[data-assign-equipment="eq-field"]', "leader");
    await page.waitForFunction(
      () =>
        window.MalifauxBuilder.getState().loadout.assignments.some(
          (assignment) =>
            assignment.equipmentId === "eq-field" && assignment.targetKind === "leader",
        ),
    );
    await page.selectOption('[data-assign-equipment="eq-field"]', "");
    await page.waitForFunction(
      () =>
        !window.MalifauxBuilder.getState().loadout.assignments.some(
          (assignment) => assignment.equipmentId === "eq-field",
        ),
    );
    await page.selectOption('[data-assign-equipment="eq-field"]', "model:model-worker");

    await page.locator('[data-delete-model="model-spare"]').click();
    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models.some((model) => model.id === "model-spare"), false);
    assert.equal(
      state.loadout.assignments.some((assignment) => assignment.targetId === "model-spare"),
      false,
      "Deleting a model must remove its assignments.",
    );

    await page.locator('[data-delete-equipment="eq-trash"]').click();
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(
      state.loadout.assignments.some((assignment) => assignment.equipmentId === "eq-trash"),
      false,
      "Deleting equipment must remove its assignment.",
    );

    await page.locator('[data-route="chronicle"]').click();
    await page.locator('#gameForm input[name="opponent"]').fill("KAN-6 Opponent");
    await page.locator('#gameForm input[name="withdrewEarly"]').check();
    await page.locator("#gameForm").evaluate((form) => form.requestSubmit());
    await page.waitForFunction(() => window.MalifauxBuilder.getState().games.length === 1);

    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(state.loadout, { hiredModelIds: [], assignments: [] });
    const snapshot = state.games[0].loadoutSnapshot;
    assert.equal(snapshot.leader.name, "The Archivist");
    assert.deepEqual(
      snapshot.leader.equipment.map((item) => item.name),
      ["Vengeful Vow"],
    );
    assert.equal(snapshot.models.some((model) => model.name === "Clockwork Guard"), true);
    assert.equal(snapshot.models.some((model) => model.name === "Test Peon"), true);
    assert.deepEqual(
      snapshot.models
        .find((model) => model.name === "Clockwork Guard")
        .equipment.map((item) => item.name)
        .sort(),
      ["Field Kit", "Strange Seed Pod"],
    );
    assert.deepEqual(snapshot.totem.equipment.map((item) => item.name), ["Pistol"]);

    const recordedCrew = page.locator(".game-loadout-snapshot");
    await recordedCrew.locator("summary").click();
    const recordedText = await recordedCrew.textContent();
    assert.match(recordedText, /Clockwork Guard/);
    assert.match(recordedText, /Field Kit/);
    assert.match(recordedText, /Lucky/);
    assert.match(recordedText, /Pistol/);
    if (process.env.KAN6_SCREENSHOT_DIR) {
      await page.waitForTimeout(2200);
      await recordedCrew.screenshot({
        path: path.join(process.env.KAN6_SCREENSHOT_DIR, "kan6-recorded-loadout.png"),
      });
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.games.length, 1);
    assert.deepEqual(state.loadout, { hiredModelIds: [], assignments: [] });
    assert.equal(state.games[0].loadoutSnapshot.models[0].equipment.length > 0, true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-route="chronicle"]').click();
    await page.locator(".game-loadout-snapshot summary").click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    assert.ok(overflow <= 1, `Mobile layout overflows by ${overflow}px.`);
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
  }

  process.stdout.write("KAN6_SMOKE_OK\n");
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
