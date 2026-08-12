const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

const summary = {
  id: 1,
  slug: "alpha-marshal",
  game_mode_type: "standard",
  name: "Alpha Marshal",
  display_name: "Alpha Marshal",
  faction: "guild",
  faction_label: "Guild",
  station: "minion",
  station_label: "Minion",
  cost: 6,
  keywords: [{ id: 1, name: "Marshal", slug: "marshal" }],
  characteristics: ["Minion"],
};
const detail = {
  ...summary,
  actions: [
    {
      id: 11,
      slug: "peacebringer",
      name: "Peacebringer",
      type: "attack",
      type_label: "Attack",
      stat: "6",
      resisted_by: "df",
      description: "Deal campaign damage.",
      triggers: [{ id: 12, name: "Pin Down", suits: "ram", description: "Target cannot move." }],
    },
    {
      id: 13,
      slug: "marshal-order",
      name: "Marshal Order",
      type: "tactical",
      type_label: "Tactical",
      description: "Move an ally.",
      triggers: [],
    },
  ],
  abilities: [{ id: 14, slug: "steady", name: "Steady", description: "Ignore the first push." }],
};

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ locale: "ru-RU", viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    localStorage.setItem("m4e-cooperative-campaign-v1", JSON.stringify({
      version: 1,
      active: "players",
      campaign: { name: "Legacy coop", week: 1, scenario: "intro", losses: 0, status: "active" },
      players: [{
        id: "player-1",
        name: "Tester",
        leader: "Legacy Leader",
        faction: "Guild",
        keywords: "Marshal, Witch Hunter",
        archetype: "Generalist",
        advances: 0,
        arsenal: [{ id: "legacy-model", name: "Legacy Model", cost: 4, type: "Minion", addedWeek: 1 }],
      }],
      run: { status: "setup", crews: { "player-1": { models: ["legacy-model", "legacy-model", "missing"] } } },
      history: [],
    }));
  });
  const page = await context.newPage();
  const pageErrors = [];
  const browserDialogs = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("dialog", async (dialog) => { browserDialogs.push(dialog.type()); await dialog.accept(); });
  await page.route(/\/api\/(?:biggerhat\/v1\/)?characters/u, async (route) => {
    const url = new URL(route.request().url());
    const isDetail = /\/characters\/alpha-marshal$/u.test(url.pathname);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: isDetail ? detail : [summary], meta: { last_page: 1 } }) });
  });
  await page.route("https://biggerhat.net/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const isDetail = /\/characters\/alpha-marshal$/u.test(url.pathname);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: isDetail ? detail : [summary], meta: { last_page: 1 } }) });
  });

  await page.goto(`${pathToFileURL(appPath).href}#cooperative`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".coop-player");

  let state = await page.evaluate(() => window.CooperativeCampaign.getState());
  assert.equal(state.run.size, 24, "legacy state without size migrates to 24 SS");
  assert.equal(state.players[0].talents.length, 3, "Generalist receives all required slots");
  assert.deepEqual(state.run.crews["player-1"].models, ["legacy-model"], "legacy crew IDs are unique and valid");
  assert.equal(await page.locator(".coop-talent-slot").count(), 3);

  const expectedSlots = { "Lucky Upstart": 2, Generalist: 3, "Heavy Hitter": 2, Schemer: 4, "Talented Individual": 4 };
  for (const [archetype, count] of Object.entries(expectedSlots)) {
    await page.locator('[data-player-path="archetype"]').selectOption(archetype);
    assert.equal(await page.locator(".coop-talent-slot").count(), count, `${archetype} renders the exact slot count`);
  }

  await page.locator('[data-player-path="archetype"]').selectOption("Heavy Hitter");
  await page.locator('[data-coop-action="pick-talent"][data-slot="attack-1"]').click();
  await page.locator('.coop-picker-result[data-slug="alpha-marshal"]').click();
  await page.locator('[data-coop-action="select-talent"]').click();
  state = await page.evaluate(() => window.CooperativeCampaign.getState());
  assert.equal(state.players[0].talents[0].snapshot.entry.triggers.length, 1, "Heavy Hitter keeps exactly one selected trigger");

  await page.locator('[data-player-path="archetype"]').selectOption("Generalist");
  state = await page.evaluate(() => window.CooperativeCampaign.getState());
  assert.equal(state.players[0].talents[0].name, "", "an incompatible Heavy Hitter action is cleared after archetype change");

  await page.locator('[data-coop-action="add-model"]').click();
  await page.waitForSelector('.coop-picker-result[data-slug="alpha-marshal"]');
  await page.locator('.coop-picker-result[data-slug="alpha-marshal"]').click();
  await page.waitForSelector(".coop-models >> text=Alpha Marshal");
  state = await page.evaluate(() => window.CooperativeCampaign.getState());
  const added = state.players[0].arsenal.find((model) => model.cardSlug === "alpha-marshal");
  assert.equal(added.cost, 6, "model Cost comes from BiggerHat");
  assert.equal(browserDialogs.includes("prompt"), false, "model picker never uses prompt");

  await page.locator('[data-coop-action="pick-talent"][data-slot="attack-1"]').click();
  await page.waitForSelector('.coop-picker-result[data-slug="alpha-marshal"]');
  await page.locator('.coop-picker-result[data-slug="alpha-marshal"]').click();
  await page.waitForSelector('[data-coop-action="select-talent"]');
  await page.locator('[data-coop-action="select-talent"]').first().click();
  state = await page.evaluate(() => window.CooperativeCampaign.getState());
  assert.equal(state.players[0].talents[0].snapshot.entry.name, "Peacebringer");
  assert.deepEqual(state.players[0].talents[0].snapshot.entry.triggers, [], "non-Heavy-Hitter action drops triggers");

  await page.locator('[data-coop-tab="encounter"]').click();
  assert.equal(await page.locator('[data-run-path="size"]').inputValue(), "24");
  const modelId = added.id;
  for (let index = 0; index < 10; index += 1) {
    await page.evaluate(({ modelId }) => {
      const input = document.querySelector(`[data-crew-model="${modelId}"]`);
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, { modelId });
  }
  state = await page.evaluate(() => window.CooperativeCampaign.getState());
  assert.equal(state.run.crews["player-1"].models.filter((id) => id === modelId).length, 1, "repeated checks are idempotent");
  assert.equal(await page.locator(".coop-crew output").textContent(), "16 / 24");
  for (let index = 0; index < 10; index += 1) {
    await page.evaluate(({ modelId }) => {
      const input = document.querySelector(`[data-crew-model="${modelId}"]`);
      input.checked = false;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, { modelId });
  }
  state = await page.evaluate(() => window.CooperativeCampaign.getState());
  assert.equal(state.run.crews["player-1"].models.includes(modelId), false);
  assert.equal(state.run.crews["player-1"].models.includes("legacy-model"), true, "repeated uncheck does not delete another model");

  await page.locator('[data-coop-action="start-encounter"]').click();
  await page.locator('[data-coop-action="resolve"][data-outcome="win"]').click();
  for (let step = 0; step < 6; step += 1) await page.locator('[data-coop-action="phase-next"]').click();
  await page.locator('[data-coop-action="commit-aftermath"]').click();
  state = await page.evaluate(() => window.CooperativeCampaign.getState());
  assert.equal(state.history.length, 1, "completed encounter is recorded atomically");
  assert.equal(state.campaign.week, 2, "week advances after the starting scenario");
  assert.equal(state.campaign.scenario, "smash", "campaign advances to the next scenario");
  assert.equal(state.active, "hq", "full flow returns to campaign HQ");
  assert.equal(state.run.size, 24, "24 SS persists into the next scenario");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-locale="en"]').click();
  await page.locator('[data-coop-tab="players"]').click();
  await page.locator('[data-coop-action="add-model"]').click();
  await page.waitForSelector(".coop-picker");
  assert.equal(await page.locator("#coopPickerTitle").textContent(), "Add a model from BiggerHat");
  const pickerBox = await page.locator(".coop-picker").boundingBox();
  assert.ok(pickerBox && pickerBox.x >= 0 && pickerBox.y >= 0 && pickerBox.x + pickerBox.width <= 390 && pickerBox.y + pickerBox.height <= 844, "picker fits a mobile viewport");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "mobile picker has no horizontal overflow");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".coop-picker").count(), 0, "Escape closes the picker");

  assert.deepEqual(pageErrors, []);
  await browser.close();
  console.log("KAN161_165_COOPERATIVE_FLOW_SMOKE_OK");
})().catch((error) => { console.error(error); process.exitCode = 1; });
