const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL;

(async () => {
  const browser = await chromium.launch({ ...(browserChannel ? { channel: browserChannel } : {}), headless: true });
  const context = await browser.newContext({ locale: "ru-RU", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("dialog", async (dialog) => dialog.accept());
  await page.goto(`${pathToFileURL(appPath).href}#cooperative`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".coop-shell");

  assert.equal(await page.locator(".rail [data-route='cooperative']").count(), 0, "cooperative mode is not a sixth main rail tab");
  assert.equal(await page.locator(".cooperative-mode-button").count(), 1, "gold mode switch remains the single entry point");
  await page.locator('[data-coop-tab="players"]').click();
  assert.equal(await page.locator("[data-leader-path='extraCharacteristics']").count(), 1, "full leader card exposes characteristics");
  assert.equal(await page.locator("[data-crew-card='id']").count(), 1, "leader Crew Card is selectable");
  assert.equal(await page.locator("[data-leader-totem]").count(), 1, "cooperative Totem is represented");

  const base = await page.evaluate(() => window.CooperativeCampaign.getState());
  const player = base.players[0];
  Object.assign(player, {
    id: "player-atomic",
    name: "Atomic Tester",
    leader: "Vera Ledger",
    faction: "Guild",
    keywords: "Marshal, Witch Hunter",
    scrip: 5,
    xp: 0,
    advances: 0,
    talents: player.talents.map((talent, index) => ({ ...talent, name: `Talent ${index + 1}` })),
    arsenal: [{ id: "model-wounded", name: "Wounded Marshal", cost: 6, type: "Minion", keywords: ["Marshal", "Witch Hunter"], status: "available", injuryList: [], equipmentItems: [], addedWeek: 1 }],
  });
  const seeded = {
    ...base,
    active: "encounter",
    players: [player],
    run: {
      ...base.run,
      status: "active",
      size: 24,
      crews: { "player-atomic": { models: ["model-wounded"], equipment: [] } },
      modelStates: { "leader:player-atomic": { health: 14, status: "active" }, "model-wounded": { health: 0, status: "killed" } },
      tracker: { strategy: 2, scrip: 1 },
    },
  };
  await page.evaluate((value) => window.CooperativeCampaign.replaceState(value), seeded);
  assert.equal(await page.locator('[data-run-path="size"]').inputValue(), "24", "preparation keeps the 24 SS encounter size");
  assert.equal(await page.locator("[data-model-state='model-wounded']").count(), 2, "tracker stores health and model status");
  assert.equal(await page.locator("#coopKillType").count(), 1, "tracker records Kill Credit");

  await page.locator('[data-coop-action="resolve"][data-outcome="win"]').click();
  let state = await page.evaluate(() => window.CooperativeCampaign.getState());
  assert.equal(state.aftermath.rulesVersion, 2, "aftermath captures a versioned ruleset");
  assert.ok(state.aftermath.players["player-atomic"].calculated.explanation.length >= 4, "scenario formula is explainable");
  assert.equal(state.aftermath.players["player-atomic"].injuryQueue.length, 1, "killed non-Peon is queued exactly once");

  state.aftermath.step = 5;
  await page.evaluate((value) => window.CooperativeCampaign.replaceState(value), state);
  await page.locator('[data-coop-action="start-flip"][data-purpose="injury"]').click();
  await page.locator('[data-flip-input="player-atomic"][data-purpose="injury"]').fill("3 R");
  await page.locator('[data-coop-action="accept-flip"][data-purpose="injury"]').click();
  await page.locator('[data-coop-action="apply-injury"]').click();
  state = await page.evaluate(() => window.CooperativeCampaign.getState());
  assert.equal(state.players[0].arsenal[0].injuryList.length, 0, "injury remains isolated before atomic commit");
  assert.equal(state.aftermath.players["player-atomic"].workingPlayer.arsenal[0].injuryList[0].name, "Severe Amputation");

  await page.locator('[data-coop-action="phase-next"]').click();
  await page.locator('[data-coop-action="commit-aftermath"]').click();
  state = await page.evaluate(() => window.CooperativeCampaign.getState());
  assert.equal(state.players[0].arsenal[0].injuryList[0].name, "Severe Amputation", "atomic commit applies the staged injury");
  assert.equal(state.history.length, 1, "completed aftermath creates one history record");
  assert.ok(state.ledger.some((entry) => entry.kind === "payday"), "ledger records Payday");
  assert.ok(state.ledger.some((entry) => entry.kind === "experience"), "ledger records XP");
  assert.ok(state.ledger.some((entry) => entry.kind === "injury"), "ledger records injury resolution");
  assert.deepEqual(pageErrors, []);

  await browser.close();
  console.log("KAN167_169_COOPERATIVE_COMPLETION_SMOKE_OK");
})().catch((error) => { console.error(error); process.exit(1); });
