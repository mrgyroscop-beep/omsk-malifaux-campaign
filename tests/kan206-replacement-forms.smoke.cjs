const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appUrl = pathToFileURL(path.resolve(__dirname, "..", "index.html")).href;

function rawCard({ id, slug, name = "Ferdinand Vogel", title, target, connector }) {
  return {
    id,
    slug,
    game_mode_type: "standard",
    name,
    title,
    display_name: `${name}, ${title}`,
    faction: "arcanists",
    faction_label: "Arcanists",
    station: "enforcer",
    station_label: "Enforcer",
    cost: 7,
    health: 8,
    size: 2,
    base: 30,
    base_label: "30mm",
    defense: 5,
    willpower: 5,
    speed: 5,
    count: 1,
    is_unhirable: false,
    keywords: [{ id: 1, name: "Chimera", slug: "chimera" }],
    characteristics: [],
    actions: [],
    abilities: [
      {
        id: id + 1000,
        slug: `shapechange-${slug}`,
        name: `Shapechange (${target.split(", ")[1]})`,
        description: `When this model activates, it may replace itself with ${target} ${connector} heal 2.`,
      },
    ],
  };
}

const human = rawCard({
  id: 69,
  slug: "ferdinand-vogel-self-righteous-man",
  title: "Self-Righteous Man",
  target: "Ferdinand Vogel, The Beast Within",
  connector: "to",
});
const beast = rawCard({
  id: 70,
  slug: "ferdinand-vogel-the-beast-within",
  title: "The Beast Within",
  target: "Ferdinand Vogel, Self-Righteous Man",
  connector: "to",
});
const ceddraSnow = rawCard({
  id: 17,
  slug: "ceddra-sightless-snow",
  name: "Ceddra",
  title: "Sightless Snow",
  target: "Ceddra, White Stag",
  connector: "and",
});
const ceddraStag = rawCard({
  id: 18,
  slug: "ceddra-white-stag",
  name: "Ceddra",
  title: "White Stag",
  target: "Ceddra, Sightless Snow",
  connector: "and",
});
const cards = [human, beast, ceddraSnow, ceddraStag];

(async () => {
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  const context = await browser.newContext({ locale: "ru-RU" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.route("https://biggerhat.net/api/v1/characters**", async (route) => {
    const url = new URL(route.request().url());
    const slug = url.pathname.split("/").filter(Boolean).at(-1);
    const detail = cards.find((card) => card.slug === slug);
    if (detail) {
      await route.fulfill({ json: { data: detail } });
      return;
    }
    await route.fulfill({
      json: {
        data: cards,
        meta: { current_page: 1, last_page: 1 },
      },
    });
  });

  try {
    await page.goto(appUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    const ceddraForms = await page.evaluate(async (slug) => {
      const card = await window.BiggerHatCards.getCharacter(slug);
      return (await window.BiggerHatCards.getReplacementForms(card)).map((form) => form.slug);
    }, ceddraSnow.slug);
    assert.deepEqual(ceddraForms.sort(), [ceddraSnow.slug, ceddraStag.slug].sort());
    await page.evaluate(() => {
      window.MalifauxBuilder.replaceState({
        crew: { name: "Chimera", player: "Smoke Test", faction: "", keywords: [] },
        campaign: { week: 1, length: 8 },
        leader: { name: "Leader", talents: [], advances: [], injuries: [], manualUpgrades: [] },
        arsenal: { models: [], equipment: [], scrip: 3 },
        loadout: { hiredModelIds: [], assignments: [] },
        games: [],
      });
    });

    await page.locator('[data-route="arsenal"]').click();
    await page.locator("#addModelButton").click();
    await page.locator("#modelCardSearch").fill("Ferdinand Vogel");
    await page.waitForFunction(() => document.querySelectorAll("#modelSearchResults [data-catalog-slug]").length === 2);
    await page.locator(`[data-catalog-slug="${human.slug}"]`).click();
    await page.waitForFunction(() => document.querySelector("#modelCardSelection")?.textContent.includes("The Beast Within"));
    assert.match(await page.locator("#modelCardSelection").textContent(), /Связанные формы/u);

    await page.locator('#modelForm button[type="submit"]').click();
    await page.waitForFunction(() => window.MalifauxBuilder.getState().arsenal.models.length === 1);
    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models.length, 1, "Replacement forms must remain one hired model.");
    assert.equal(state.arsenal.models[0].cost, 7, "The model cost must only be paid once.");
    assert.equal(state.arsenal.models[0].cardForms.length, 2);
    assert.deepEqual(
      state.arsenal.models[0].cardForms.map((form) => form.slug).sort(),
      [human.slug, beast.slug].sort(),
    );
    assert.equal(await page.locator("#modelList [data-view-model-card]").count(), 2);

    await page.locator(`[data-view-model-form="${beast.slug}"]`).click();
    assert.match(await page.locator("#cardDialogTitle").textContent(), /The Beast Within/u);
    await page.locator('[data-close-dialog="cardDialog"]').click();

    await page.evaluate(() => window.renderPrintDossier());
    assert.equal(
      await page.locator('[data-print-model-card] [data-print-model-profile]').count(),
      2,
      "Both replacement profiles must be included in the printed arsenal.",
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models[0].cardForms.length, 2, "Replacement forms must survive reload.");
    assert.deepEqual(errors, []);
    console.log("KAN206_REPLACEMENT_FORMS_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
