const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

const fixture = {
  version: 3,
  crew: {
    name: "KAN-7 Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", ""],
  },
  campaign: { length: 8, week: 4, meetingDay: "" },
  leader: {
    name: "Injury Keeper",
    archetype: "Generalist",
    characteristics: ["Living", ""],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [],
    crewCard: "",
    xp: 5,
    advances: [
      {
        id: "kan7-advance",
        xp: 5,
        tableId: "totem",
        recipient: "leader",
        choiceId: "chance-taker",
        name: "Chance Taker",
        resultType: "totem",
        flip: { card: "7", cheated: false },
        acquiredTotemId: "kan7-totem",
      },
    ],
    totem: {
      id: "kan7-totem",
      profileId: "chance-taker",
      name: "Bandaged Totem",
      size: 1,
      base: 30,
      characteristics: ["Living"],
      injuries: 1,
      acquiredBy: "kan7-advance",
    },
  },
  arsenal: {
    models: [
      {
        id: "legacy-hired",
        name: "Legacy Guard",
        cost: 6,
        type: "Minion",
        keywords: "Marshal",
        modelLimit: 2,
        injuries: 2,
      },
      {
        id: "injury-target",
        name: "Injury Target",
        cost: 5,
        type: "Minion",
        keywords: "Marshal",
        modelLimit: 2,
        injuries: [],
      },
      {
        id: "not-hired",
        name: "Reserve Guard",
        cost: 5,
        type: "Minion",
        keywords: "Marshal",
        modelLimit: 2,
        injuries: [
          {
            id: "custom-injury",
            catalogId: "retired-catalog-entry",
            name: "Custom old wound",
            nameEn: "Custom old wound",
            effect: "Пользовательский текст",
            effectEn: "Custom text",
            flip: "Archive",
            week: 2,
          },
          {
            id: "reserve-injury-2",
            catalogId: "injury-04",
            name: "Severe Amputation",
            effect: "Максимальное здоровье −2.",
            flip: "3 R/M",
            week: 3,
          },
        ],
      },
      {
        id: "kan7-peon",
        name: "Tiny Peon",
        cost: 2,
        type: "Peon",
        keywords: "Marshal",
        modelLimit: 3,
        injuries: 1,
      },
      {
        id: "collision-model",
        name: "Collision Model",
        cost: 4,
        type: "Minion",
        keywords: "Marshal",
        modelLimit: 2,
        injuries: [
          {
            id: "collision-model-injury-2",
            name: "Collision wound A",
            week: 1,
          },
          {
            id: "collision-model-injury-2",
            name: "Collision wound B",
            week: 2,
          },
          {
            id: "collision-model-injury-2-2",
            name: "Reserved unique wound",
            week: 3,
          },
        ],
      },
    ],
    equipment: [],
    equipmentScripSpent: 0,
    scrip: 0,
  },
  loadout: {
    hiredModelIds: ["legacy-hired", "injury-target", "kan7-peon"],
    assignments: [],
  },
  games: [],
};

async function addInjury(page, modelId, search) {
  await page.locator(`[data-add-injury-model="${modelId}"]`).click();
  await page.locator("#injurySearch").fill(search);
  const result = page.locator("#injurySearchResults [data-select-injury]").first();
  await result.waitFor();
  await result.click();
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

    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    const legacy = state.arsenal.models.find((model) => model.id === "legacy-hired");
    assert.equal(Array.isArray(legacy.injuries), true, "Numeric injuries were not migrated.");
    assert.equal(legacy.injuries.length, 2, "Numeric injury count changed during migration.");
    assert.deepEqual(
      legacy.injuries.map((injury) => injury.name),
      ["Не указана", "Не указана"],
    );
    assert.equal(new Set(legacy.injuries.map((injury) => injury.id)).size, 2);
    assert.equal(
      state.arsenal.models.find((model) => model.id === "not-hired").injuries[0].effect,
      "Пользовательский текст",
      "Unknown legacy injury lost its custom text.",
    );

    assert.equal(
      await page.locator("#ratingInjuries").inputValue(),
      "3",
      "CR must include two hired model injuries and one Totem injury only.",
    );
    const peonRow = page.locator(".model-row").filter({ hasText: "Tiny Peon" });
    assert.equal(
      await peonRow.locator("[data-add-injury-model], [data-remove-injury]").count(),
      0,
      "Peon exposes injury controls.",
    );

    const collisionModel = state.arsenal.models.find(
      (model) => model.id === "collision-model",
    );
    const collisionIds = collisionModel.injuries.map((injury) => injury.id);
    assert.equal(
      new Set(collisionIds).size,
      collisionIds.length,
      "Imported colliding injury ids were not made unique.",
    );
    assert.equal(
      collisionIds.includes("collision-model-injury-2-2"),
      true,
      "A unique valid imported id was not preserved.",
    );
    const removedCollisionId = collisionIds[0];
    const retainedCollisionIds = collisionIds.slice(1);
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(`[data-remove-injury="${removedCollisionId}"]`).click();
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    const collisionAfterRemoval = state.arsenal.models.find(
      (model) => model.id === "collision-model",
    );
    assert.equal(
      collisionAfterRemoval.injuries.length,
      collisionIds.length - 1,
      "Removing one colliding imported injury removed more than one record.",
    );
    assert.deepEqual(
      collisionAfterRemoval.injuries.map((injury) => injury.id),
      retainedCollisionIds,
      "Removing one colliding imported injury changed the remaining records.",
    );

    await addInjury(page, "injury-target", "3 R/M");
    await addInjury(page, "injury-target", "Severe Amputation");
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    let target = state.arsenal.models.find((model) => model.id === "injury-target");
    assert.equal(target.injuries.length, 2, "Model did not retain multiple injuries.");
    assert.equal(
      new Set(target.injuries.map((injury) => injury.id)).size,
      2,
      "Injury instance ids are not unique.",
    );
    assert.deepEqual(
      target.injuries.map((injury) => injury.catalogId),
      ["injury-04", "injury-04"],
      "Duplicate catalog injuries must be allowed.",
    );
    assert.equal(await page.locator("#ratingInjuries").inputValue(), "5");
    assert.match(await page.locator("#activeLoadoutSummary").textContent(), /Severe Amputation/);

    await addInjury(page, "injury-target", "5 R/M");
    assert.match(
      await page.locator("#toastRegion").textContent(),
      /Три травмы|three or more injury/i,
      "Third injury did not produce the annihilation warning.",
    );

    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    target = state.arsenal.models.find((model) => model.id === "injury-target");
    const removeId = target.injuries[0].id;
    const removeButton = page.locator(`[data-remove-injury="${removeId}"]`).first();
    page.once("dialog", (dialog) => dialog.dismiss());
    await removeButton.click();
    assert.equal(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).arsenal.models.find(
        (model) => model.id === "injury-target",
      ).injuries.length,
      3,
      "Cancelled confirmation still removed an injury.",
    );
    page.once("dialog", (dialog) => dialog.accept());
    await removeButton.click();
    assert.equal(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).arsenal.models.find(
        (model) => model.id === "injury-target",
      ).injuries.length,
      2,
      "Confirmed injury removal failed.",
    );

    await page.evaluate(() => window.renderPrintDossier());
    assert.match(await page.locator("#printDossier").textContent(), /Severe Amputation/);
    assert.match(await page.locator("#printDossier").textContent(), /Bandaged Totem/);

    const exported = await page.evaluate(() =>
      JSON.stringify(window.MalifauxBuilder.getState()),
    );
    await page.evaluate((json) => {
      window.MalifauxBuilder.replaceState(JSON.parse(json));
    }, exported);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    target = state.arsenal.models.find((model) => model.id === "injury-target");
    assert.equal(target.injuries.length, 2, "Injuries did not survive save/reload.");
    assert.equal(target.injuries[0].catalogId, "injury-04");
    assert.equal(
      state.arsenal.models.find((model) => model.id === "not-hired").injuries[0].effect,
      "Пользовательский текст",
      "JSON round-trip lost custom injury text.",
    );
    assert.deepEqual(
      state.arsenal.models
        .find((model) => model.id === "collision-model")
        .injuries.map((injury) => injury.id),
      retainedCollisionIds,
      "Normalized collision ids were not stable after save/reload.",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-route="arsenal"]').click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    assert.ok(overflow <= 1, `Mobile injury layout overflows by ${overflow}px.`);
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
  }

  process.stdout.write("KAN7_SMOKE_OK\n");
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
