const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");

function rawAction(id, slug, name) {
  return {
    id,
    slug,
    name,
    type: "attack",
    type_label: "Attack",
    stat: "6",
    stat_modifier: "",
    resisted_by: "willpower",
    resisted_by_label: "Wp",
    range: "8",
    range_type: "magic",
    range_type_label: "Magic",
    triggers: [],
  };
}

function rawCard({ id, slug, name, willpower, actions = [] }) {
  return {
    id,
    slug,
    name,
    display_name: name,
    faction: "outcasts",
    faction_label: "Outcasts",
    station: "henchman",
    station_label: "Henchman",
    cost: 9,
    defense: 5,
    defense_suit: "",
    willpower,
    willpower_suit: "",
    speed: 5,
    health: 9,
    size: 3,
    base: 50,
    base_label: "50mm",
    keywords: [],
    characteristics: ["Living"],
    actions,
    abilities: [],
  };
}

(async () => {
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  const page = await browser.newPage({ locale: "ru-RU", viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder && window.BiggerHatCards));

    const normalized = await page.evaluate(({ hannah, lazarus }) => {
      const hannahCard = window.BiggerHatCards.normalizeDetail(hannah);
      const lazarusCard = window.BiggerHatCards.normalizeDetail(lazarus);
      return {
        hannahModifier: hannahCard.actions.find((action) => action.name === "Ancient Words")?.statModifier,
        lazarusModifier: lazarusCard.willpowerModifier,
      };
    }, {
      hannah: rawCard({
        id: 2161,
        slug: "hannah-lovelace",
        name: "Hannah Lovelace",
        willpower: 6,
        actions: [rawAction(21611, "ancient-words", "Ancient Words")],
      }),
      lazarus: rawCard({ id: 2162, slug: "lazarus", name: "Lazarus", willpower: 5 }),
    });
    assert.deepEqual(normalized, {
      hannahModifier: "positive",
      lazarusModifier: "positive",
    });

    const snapshots = await page.evaluate(() => {
      const action = {
        id: 21611,
        slug: "ancient-words",
        name: "Ancient Words",
        type: "attack",
        typeLabel: "Attack",
        stat: "6",
        statModifier: "",
        resistedBy: "willpower",
        resistedByLabel: "Wp",
        range: "8",
        rangeType: "magic",
        rangeTypeLabel: "Magic",
        triggers: [],
      };
      const base = {
        faction: "outcasts",
        factionLabel: "Outcasts",
        station: "henchman",
        stationLabel: "Henchman",
        cost: 9,
        defense: 5,
        willpower: 5,
        speed: 5,
        health: 9,
        size: 3,
        base: 50,
        baseLabel: "50mm",
        keywords: [],
        characteristics: ["Living"],
        abilities: [],
      };
      const hannah = {
        ...base,
        id: 2161,
        slug: "hannah-lovelace",
        name: "Hannah Lovelace",
        displayName: "Hannah Lovelace",
        willpower: 6,
        actions: [action],
      };
      const lazarus = {
        ...base,
        id: 2162,
        slug: "lazarus",
        name: "Lazarus",
        displayName: "Lazarus",
        actions: [],
      };

      window.openCardDialog(hannah);
      const hannahDialogText = document.querySelector("#cardDialogContent").textContent;
      window.openCardDialog(lazarus);
      const lazarusDialogText = document.querySelector("#cardDialogContent").textContent;

      const state = window.MalifauxBuilder.getState();
      state.campaign.week = 2;
      state.arsenal.models = [
        {
          id: "hannah",
          name: "Hannah Lovelace",
          cost: 9,
          type: "Henchman",
          keywords: "Freikorps",
          characteristics: ["Living"],
          injuries: [],
          cardSnapshot: hannah,
        },
        {
          id: "lazarus",
          name: "Lazarus",
          cost: 9,
          type: "Enforcer",
          keywords: "Freikorps",
          characteristics: ["Construct"],
          injuries: [],
          cardSnapshot: lazarus,
        },
      ];
      window.MalifauxBuilder.replaceState(state);
      window.renderPrintDossier();
      const stored = window.MalifauxBuilder.getState().arsenal.models;
      return {
        hannahDialogText,
        lazarusDialogText,
        hannahStoredModifier: stored[0].cardSnapshot.actions[0].statModifier,
        lazarusStoredModifier: stored[1].cardSnapshot.willpowerModifier,
      };
    });

    assert.match(snapshots.hannahDialogText, /Ancient Words[\s\S]*Stat 6 \+/);
    assert.match(snapshots.lazarusDialogText, /Wp5 \+/);
    assert.equal(snapshots.hannahStoredModifier, "positive");
    assert.equal(snapshots.lazarusStoredModifier, "positive");

    const hannahPrint = page.locator('[data-print-model-card="hannah"]');
    const lazarusPrint = page.locator('[data-print-model-card="lazarus"]');
    assert.match(await hannahPrint.textContent(), /Ancient Words[\s\S]*Stat 6 \+/);
    assert.match(await lazarusPrint.textContent(), /Wp5 \+/);
    assert.deepEqual(pageErrors, []);
    process.stdout.write("KAN216_POSITIVE_MODIFIERS_OK\n");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
