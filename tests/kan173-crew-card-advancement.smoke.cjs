const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "";

const keywords = [
  { id: 1, game_mode_type: "standard", name: "Marshal", slug: "marshal" },
  { id: 2, game_mode_type: "standard", name: "Witch Hunter", slug: "witch-hunter" },
  { id: 3, game_mode_type: "standard", name: "Honeypot", slug: "honeypot" },
];

const marshalMaster = {
  id: 101,
  game_mode_type: "standard",
  name: "Lady Justice",
  title: "Death-Touched",
  display_name: "Lady Justice, Death-Touched",
  slug: "lady-justice-death-touched",
  faction: "guild",
  faction_label: "Guild",
  station: "master",
  station_label: "Master",
  cost: null,
  keywords: [keywords[0]],
  characteristics: ["Master"],
};

const foreignMaster = {
  ...marshalMaster,
  id: 102,
  name: "Jakob Lynch",
  title: "Wildcard",
  display_name: "Jakob Lynch, Wildcard",
  slug: "jakob-lynch-wildcard",
  faction: "ten_thunders",
  faction_label: "Ten Thunders",
  keywords: [keywords[2]],
};

const upgrades = [
  {
    id: 201,
    game_mode_type: "standard",
    name: "Grave Peril",
    slug: "grave-peril",
    domain: "crew",
    domain_label: "Crew",
    faction: "guild",
    faction_label: "Guild",
    description: "Friendly Marshal models gain the following effects.",
    characters: [marshalMaster],
  },
  {
    id: 202,
    game_mode_type: "standard",
    name: "Roll the Dice",
    slug: "roll-the-dice",
    domain: "crew",
    domain_label: "Crew",
    faction: "ten_thunders",
    faction_label: "Ten Thunders",
    description: "Friendly Honeypot models gain the following effects.",
    characters: [foreignMaster],
  },
];

const gravePeril = {
  ...upgrades[0],
  keywords: [keywords[0]],
  abilities: [
    {
      id: 301,
      name: "Grave's Pull",
      slug: "graves-pull",
      description: "Friendly models may move toward this model.",
    },
    {
      id: 302,
      name: "Power Gauge",
      slug: "power-gauge",
      description: "Increase this crew card's power bar by one.",
    },
  ],
  actions: [
    {
      id: 401,
      name: "Marshal's Order",
      slug: "marshals-order",
      type: "tactical",
      type_label: "Tactical",
      range: "6",
      stat: "6",
      description: "An ally may move up to 3 inches.",
      triggers: [
        {
          id: 501,
          name: "No Escape",
          slug: "no-escape",
          suits: "crow",
          description: "After resolving, the target gains Staggered.",
        },
      ],
    },
  ],
  triggers: [
    {
      id: 502,
      name: "Crack Skulls",
      slug: "crack-skulls",
      suits: "ram",
      description: "After succeeding, deal 1 damage.",
    },
  ],
  markers: [{ id: 601, name: "Grave Marker", slug: "grave-marker" }],
  tokens: [{ id: 701, name: "Shielded", slug: "shielded" }],
};

function fixture() {
  return {
    version: 4,
    crew: {
      name: "Tier Four Crew",
      player: "Smoke Test",
      faction: "Guild",
      keywords: ["Marshal", "Witch Hunter"],
    },
    campaign: { length: 8, week: 4, meetingDay: "" },
    leader: {
      name: "Элиас Нордвинд",
      archetype: "Generalist",
      characteristics: ["Living"],
      size: 2,
      base: 30,
      path: "Bruiser",
      talents: [],
      crewCard: "heavy-blow",
      xp: 13,
      advances: [],
      manualUpgrades: [],
      injuries: [],
      luckyMissUpgrades: [],
      totem: null,
    },
    arsenal: { models: [], equipment: [], equipmentScripSpent: 0, scrip: 3 },
    loadout: { hiredModelIds: [], assignments: [] },
    games: [],
  };
}

(async () => {
  const browser = await chromium.launch({
    ...(browserChannel ? { channel: browserChannel } : {}),
    headless: true,
  });
  const context = await browser.newContext({ locale: "ru-RU", viewport: { width: 390, height: 640 } });
  const page = await context.newPage();
  const pageErrors = [];
  const detailCalls = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    let payload;
    if (pathname.endsWith("/keywords")) {
      payload = { data: keywords, meta: { last_page: 1 } };
    } else if (pathname.endsWith("/characters")) {
      payload = { data: [marshalMaster, foreignMaster], meta: { last_page: 1 } };
    } else if (pathname.endsWith("/upgrades")) {
      assert.equal(url.searchParams.get("domain"), "crew");
      payload = { data: upgrades, meta: { last_page: 1 } };
    } else if (pathname.endsWith("/upgrades/grave-peril")) {
      detailCalls.push("grave-peril");
      payload = { data: gravePeril };
    } else if (pathname.endsWith("/upgrades/roll-the-dice")) {
      detailCalls.push("roll-the-dice");
      payload = { data: { ...upgrades[1], keywords: [keywords[2]], actions: [], abilities: [] } };
    } else {
      return route.fulfill({ status: 404, json: { error: "not_found" } });
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
  });

  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), fixture());
    await page.locator('[data-route="chronicle"]').click();
    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "7");
    await page.selectOption("#advancementTable", "crew-card");

    assert.equal(await page.locator("#advancementFlipField").isHidden(), true);
    assert.equal(await page.locator("#advancementCheatedJokerField").isHidden(), true);
    assert.equal(await page.locator("#advancementChoiceField").isHidden(), true);
    assert.equal(await page.locator("#advancementTargetField").isHidden(), true);
    assert.equal(await page.locator("#advancementNameField").isHidden(), true);
    assert.equal(await page.locator("#advancementScripField").isHidden(), true);

    await page.locator('[data-crew-advancement-effect="biggerhat:grave-peril:ability:301"]').waitFor();
    assert.deepEqual(detailCalls, ["grave-peril"]);
    assert.equal(await page.locator('[data-crew-advancement-effect*="roll-the-dice"]').count(), 0);
    assert.equal(
      await page.locator('[data-crew-advancement-effect="biggerhat:grave-peril:ability:302"]').isDisabled(),
      true,
    );

    await page.locator('[data-crew-advancement-effect="biggerhat:grave-peril:action:401"]').click();
    const geometry = await page.evaluate(() => {
      const dialog = document.querySelector("#advancementDialog");
      const rect = dialog.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    assert.ok(geometry.left >= 0 && geometry.right <= geometry.viewportWidth);
    assert.ok(geometry.top >= 0 && geometry.bottom <= geometry.viewportHeight);
    assert.ok(geometry.horizontalOverflow <= 0);
    if (process.env.KAN173_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.KAN173_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({
        path: path.join(process.env.KAN173_SCREENSHOT_DIR, "tier4-keyword-mobile.png"),
        fullPage: false,
      });
    }
    assert.equal(
      await page.locator("#advancementSubmit").isEnabled(),
      true,
      await page.locator("#advancementSubmit").getAttribute("title"),
    );
    await page.locator("#advancementSubmit").click();
    await page.waitForFunction(() => window.MalifauxBuilder.getState().leader.advances.length === 1);
    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    const actionAdvance = state.leader.advances[0];
    assert.equal(actionAdvance.name, "Marshal's Order");
    assert.equal(actionAdvance.choiceId, "biggerhat:grave-peril:action:401");
    assert.equal(actionAdvance.source, "Grave Peril");
    assert.equal(actionAdvance.crewCardEffectType, "action");
    assert.equal(actionAdvance.snapshot.entry.triggers.length, 1);
    assert.equal(actionAdvance.snapshot.entry.triggers[0].name, "No Escape");
    assert.equal(actionAdvance.snapshot.rules.actionIncludesTriggers, true);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.advances[0].snapshot.entry.triggers[0].name, "No Escape");

    // The same exact effect is not repeatable in another Tier 4 slot.
    await page.locator('[data-route="chronicle"]').click();
    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "13");
    await page.selectOption("#advancementTable", "crew-card");
    await page.locator('[data-crew-advancement-effect="biggerhat:grave-peril:action:401"]').waitFor();
    await page.locator('[data-crew-advancement-effect="biggerhat:grave-peril:action:401"]').click();
    assert.equal(await page.locator("#advancementSubmit").isDisabled(), true);
    await page.locator("#advancementDialog").evaluate((dialog) => dialog.close());

    // Starting effects remain automatic and offline; parameterized effects require a valid option.
    const fresh = fixture();
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), fresh);
    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "7");
    await page.selectOption("#advancementTable", "crew-card");
    await page.locator('input[name="crewCardSource"][value="starting"]').check({ force: true });
    await page.locator('[data-crew-advancement-effect="starting:shape-landscape"]').click();
    assert.equal(await page.locator("#advancementCrewCardParameterField").isVisible(), true);
    assert.equal(await page.locator("#advancementSubmit").isDisabled(), true);
    await page.locator("#advancementCrewCardParameter").fill("Grave Marker");
    if (process.env.KAN173_SCREENSHOT_DIR) {
      await page.screenshot({
        path: path.join(process.env.KAN173_SCREENSHOT_DIR, "tier4-starting-mobile.png"),
        fullPage: false,
      });
    }
    assert.equal(await page.locator("#advancementSubmit").isEnabled(), true);
    await page.locator("#advancementSubmit").click();
    await page.waitForFunction(() => window.MalifauxBuilder.getState().leader.advances.length === 1);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.advances[0].name, "Shape the Landscape");
    assert.equal(state.leader.advances[0].snapshot.parameter, "Grave Marker");
    assert.equal(state.leader.advances[0].snapshot.sourceKind, "campaign-starting");
    await page.locator('.nav-item[data-route="leader"]').click();
    await page.locator(".crew-card-earned-effects").waitFor();
    assert.match(await page.locator(".crew-card-earned-effects").innerText(), /Shape the Landscape/);
    assert.match(await page.locator(".crew-card-earned-effects").innerText(), /Grave Marker/);

    assert.deepEqual(pageErrors, []);
    console.log("KAN173_CREW_CARD_ADVANCEMENT_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
