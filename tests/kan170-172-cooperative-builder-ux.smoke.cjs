const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = path.resolve(__dirname, "..", "index.html");
const summary = (slug, name, faction, keywords, extras = {}) => ({ id: slug, slug, game_mode_type: "standard", name, display_name: name, faction: faction.toLowerCase(), faction_label: faction, station: "minion", station_label: "Minion", cost: 6, keywords: keywords.map((keyword, id) => ({ id, name: keyword, slug: keyword.toLowerCase().replaceAll(" ", "-") })), characteristics: ["Minion"], ...extras });
const marshal = summary("alpha-marshal", "Alpha Marshal", "Guild", ["Marshal"]);
const wrong = summary("bayou-raider", "Bayou Raider", "Bayou", ["Bandit"]);
const master = summary("guild-master", "Guild Master", "Guild", ["Marshal"], { station: "master", station_label: "Master", characteristics: ["Master"] });
const detail = { ...marshal, actions: [{ id: 11, name: "Peacebringer", type: "attack", typeLabel: "Attack", stat: "6", description: "Deal campaign damage.", triggers: [{ id: 12, name: "Pin Down", suits: "R", description: "Target cannot move." }] }, { id: 13, name: "Marshal Order", type: "tactical", typeLabel: "Tactical", description: "Move an ally.", triggers: [] }], abilities: [{ id: 14, name: "Steady", description: "Ignore the first push." }] };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1024, height: 600 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(/\/keywords/u, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: 1, name: "Marshal", slug: "marshal", game_mode_type: "standard" }, { id: 2, name: "Witch Hunter", slug: "witch-hunter", game_mode_type: "standard" }, { id: 3, name: "Bandit", slug: "bandit", game_mode_type: "standard" }], meta: { last_page: 1 } }) }));
  await page.route(/\/characters(?:\/([^?]+))?/u, (route) => {
    const match = new URL(route.request().url()).pathname.match(/\/characters\/([^/]+)$/u);
    const data = match ? (match[1] === "alpha-marshal" ? detail : [marshal, wrong, master].find((item) => item.slug === match[1])) : [marshal, wrong, master];
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data, meta: { last_page: 1 } }) });
  });
  await page.goto(`${pathToFileURL(appPath).href}#cooperative`, { waitUntil: "domcontentloaded" });
  await page.locator('[data-coop-tab="players"]').click();
  await page.waitForFunction(() => document.querySelectorAll('[data-coop-keyword="0"] option').length > 2);

  assert.equal(await page.locator('[data-player-path="faction"] option').count(), 9, "8 standard factions plus placeholder");
  await page.locator('[data-player-path="faction"]').selectOption("Guild");
  await page.locator('[data-coop-keyword="0"]').selectOption("Marshal");
  await page.locator('[data-coop-keyword="1"]').selectOption("Witch Hunter");
  assert.equal(await page.locator(".coop-archetype-brief").count(), 1, "archetype details are visible");

  await page.locator('[data-coop-action="add-model"]').click();
  await page.waitForSelector('.coop-picker-result[data-slug="alpha-marshal"]');
  assert.equal(await page.locator('.coop-picker-result[data-slug="bayou-raider"]').count(), 0, "unrelated model is filtered");
  assert.equal(await page.locator('.coop-picker-result[data-slug="guild-master"]').count(), 0, "Master is filtered");
  const input = page.locator("#coopPickerSearch");
  await input.click();
  assert.equal(await page.locator(".coop-picker").count(), 1, "clicking input does not close picker");
  for (const letter of "alpha") {
    await input.pressSequentially(letter);
    await page.waitForTimeout(220);
  }
  assert.equal(await input.inputValue(), "alpha", "typing stays in natural order across debounce renders");
  assert.equal(await input.evaluate((node) => node.selectionStart), 5, "caret remains at the end");
  const geometry = await page.locator(".coop-picker").evaluate((node) => ({ top: node.getBoundingClientRect().top, bottom: node.getBoundingClientRect().bottom, height: innerHeight, scrollable: node.querySelector(".coop-picker-body").scrollHeight >= node.querySelector(".coop-picker-body").clientHeight }));
  assert.ok(geometry.top >= 0 && geometry.bottom <= geometry.height && geometry.scrollable, "picker fits viewport and exposes one scroll body");
  await page.keyboard.press("Escape");

  await page.locator('[data-coop-action="pick-talent"][data-slot="attack-1"]').click();
  await page.locator('input[name="coopTalentMode"][value="direct"]').check();
  await page.waitForSelector(".coop-direct-entry");
  await page.locator('[data-coop-action="select-direct-talent"]').first().click();
  const state = await page.evaluate(() => window.CooperativeCampaign.getState());
  assert.equal(state.players[0].talents[0].source, "Alpha Marshal");
  assert.deepEqual(state.players[0].talents[0].snapshot.entry.triggers, [], "normal action drops source triggers");
  assert.deepEqual(errors, []);
  await browser.close();
  console.log("KAN170_172_COOPERATIVE_BUILDER_UX_SMOKE_OK");
})().catch((error) => { console.error(error); process.exit(1); });
