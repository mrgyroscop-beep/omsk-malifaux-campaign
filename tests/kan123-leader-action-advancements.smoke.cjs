const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "";
const artifactDir = path.resolve(__dirname, "..", ".artifacts", "kan123");

function breathOfFrostTalent() {
  const entry = {
    id: "breath-of-frost",
    slug: "breath-of-frost",
    name: "Breath of Frost",
    type: "attack",
    typeLabel: "Attack",
    range: "6",
    rangeType: "magic",
    rangeTypeLabel: "Magic",
    stat: "7",
    resistedBy: "Sp",
    damage: "2",
    description:
      "Deal this action's damage to a different enemy model within 2\" of the target. Models damaged by this action gain a Staggered token.",
    triggers: [],
  };
  return {
    slotId: "attack-1",
    kind: "attack",
    mode: "biggerhat",
    name: entry.name,
    source: "Ceddra, Sightless Snow",
    snapshot: {
      sourceCard: {
        id: "ceddra",
        slug: "ceddra-sightless-snow",
        name: "Ceddra, Sightless Snow",
        displayName: "Ceddra, Sightless Snow",
        cost: 6,
        actions: [entry],
      },
      entry,
      selectedTrigger: null,
    },
  };
}

function callOfTheWildTalent() {
  const entry = {
    id: "call-of-the-wild",
    slug: "call-of-the-wild",
    name: "Call of the Wild",
    type: "tactical",
    typeLabel: "Tactical",
    range: "6",
    rangeType: "range",
    rangeTypeLabel: "Rg",
    stat: "0",
    targetNumber: "7",
    description: "Ally or friendly beast only. Move the target up to its Sp.",
    triggers: [],
  };
  return {
    slotId: "tactical-1",
    kind: "tactical",
    mode: "biggerhat",
    name: entry.name,
    source: "Ceddra, Sightless Snow",
    snapshot: {
      sourceCard: {
        id: "ceddra",
        slug: "ceddra-sightless-snow",
        name: "Ceddra, Sightless Snow",
        displayName: "Ceddra, Sightless Snow",
        cost: 7,
        actions: [entry],
      },
      entry,
      selectedTrigger: null,
    },
  };
}

function fastCastTalent() {
  const entry = {
    id: "fast-cast",
    slug: "fast-cast",
    name: "Fast Cast",
    type: "ability",
    description: "This model's Charge action may generate {{magic}} actions instead of {{melee}} actions.",
  };
  return {
    slotId: "ability-1",
    kind: "ability",
    mode: "biggerhat",
    name: entry.name,
    source: "Ceddra, Sightless Snow",
    snapshot: {
      sourceCard: {
        id: "ceddra",
        slug: "ceddra-sightless-snow",
        name: "Ceddra, Sightless Snow",
        displayName: "Ceddra, Sightless Snow",
        cost: 7,
        abilities: [entry],
      },
      entry,
      selectedTrigger: null,
    },
  };
}

function advancementFixtures() {
  return [
    {
      id: "heave-advance",
      xp: 1,
      tier: 1,
      tableId: "attack-modification",
      recipient: "leader",
      choiceId: "attack-10-heave",
      name: "Heave",
      resultType: "trigger",
      flip: { card: "10", cheated: false },
      appliesTo: "Breath of Frost",
    },
    {
      id: "on-your-heels-advance",
      xp: 2,
      tier: 1,
      tableId: "attack-modification",
      recipient: "leader",
      choiceId: "attack-11-on-your-heels",
      name: "On Your Heels",
      resultType: "trigger",
      flip: { card: "11", cheated: false },
      appliesTo: "Breath of Frost",
    },
    {
      id: "runic-blade-advance",
      xp: 3,
      tier: 2,
      tableId: "action",
      recipient: "leader",
      choiceId: "action-runic-blade",
      name: "Runic Blade",
      resultType: "action",
      flip: { card: "11", cheated: false },
    },
    {
      id: "drawn-to-weakness-advance",
      xp: 5,
      tier: 3,
      tableId: "summoning",
      recipient: "leader",
      choiceId: "summoning-drawn-to-weakness",
      name: "Drawn to Weakness",
      resultType: "action",
      flip: { card: "", cheated: false },
    },
  ];
}

async function actionCard(page, name, print = false) {
  const selector = print ? "[data-print-leader-action]" : "[data-leader-action-name]";
  return page.locator(selector).filter({ hasText: name }).first();
}

(async () => {
  const browser = await chromium.launch({
    ...(browserChannel ? { channel: browserChannel } : {}),
    headless: true,
  });
  const context = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate(({ talents, advances }) => {
      window.MalifauxBuilder.replaceState({
        crew: {
          name: "Боевые химеры",
          player: "Никита",
          faction: "Arcanists",
          keywords: ["M&SU", "Chimera"],
        },
        campaign: { week: 1, length: 4 },
        leader: {
          name: "Элиас Нордвинд",
          archetype: "Generalist",
          path: "Bruiser",
          xp: 5,
          talents,
          advances,
          injuries: [],
          manualUpgrades: [],
          crewCard: "specialized-tools",
        },
        arsenal: { scrip: 7, equipment: [], models: [] },
      });
    }, {
      talents: [breathOfFrostTalent(), callOfTheWildTalent(), fastCastTalent()],
      advances: advancementFixtures(),
    });

    await page.locator('.primary-nav [data-route="leader"]').click();
    await page.locator("#leaderActionPreview").waitFor();
    assert.equal(await page.locator("[data-leader-action-name]").count(), 4);

    const breath = await actionCard(page, "Breath of Frost");
    assert.equal(await breath.locator(".card-trigger").count(), 2);
    assert.match(await breath.textContent(), /Heave/);
    assert.match(await breath.textContent(), /On Your Heels/);
    assert.match(await breath.textContent(), /Place the target anywhere within 3/);
    assert.match(await breath.textContent(), /Place this model into base contact/);
    assert.match(await breath.locator(".action-meta").textContent(), /Stat 7 vs Sp/);

    const runic = await actionCard(page, "Runic Blade");
    assert.match(await runic.locator(".action-meta").textContent(), /Rg 1.*Stat 6 vs Df.*Dmg 3/s);
    assert.match(await runic.textContent(), /This model heals 1/);

    const drawn = await actionCard(page, "Drawn to Weakness");
    assert.match(await drawn.locator(".action-meta").textContent(), /Rg 8.*Stat 0.*TN 8/s);
    assert.match(await drawn.textContent(), /Summon a model of cost 5 or less/);

    const roundTrip = await page.evaluate(() => window.MalifauxBuilder.getState());
    await page.evaluate((saved) => window.MalifauxBuilder.replaceState(saved), roundTrip);
    assert.equal(await page.locator("[data-leader-action-name]").count(), 4);
    assert.equal(await (await actionCard(page, "Breath of Frost")).locator(".card-trigger").count(), 2);

    fs.mkdirSync(artifactDir, { recursive: true });
    await page.locator("#leaderActionPreview").screenshot({
      path: path.join(artifactDir, "leader-actions-desktop.png"),
    });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileLayout = await page.locator("#leaderActionPreview").evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
    assert.ok(
      mobileLayout.scrollWidth <= mobileLayout.clientWidth + 1,
      "Leader action preview must not overflow at 390px.",
    );
    await page.locator("#leaderActionPreview").screenshot({
      path: path.join(artifactDir, "leader-actions-mobile.png"),
    });
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.evaluate(() => window.renderPrintDossier());
    assert.equal(await page.locator("[data-print-leader-action]").count(), 4);
    const printBreath = await actionCard(page, "Breath of Frost", true);
    assert.equal(await printBreath.locator("[data-print-action-trigger]").count(), 2);
    assert.match(await (await actionCard(page, "Runic Blade", true)).textContent(), /This model heals 1/);
    assert.match(
      await (await actionCard(page, "Drawn to Weakness", true)).textContent(),
      /Summon a model of cost 5 or less/,
    );

    await page.emulateMedia({ media: "print" });
    await page.setViewportSize({ width: 726, height: 1055 });
    await page.locator(".print-leader-page").screenshot({
      path: path.join(artifactDir, "leader-sheet-a4.png"),
    });
    await page.pdf({
      path: path.join(artifactDir, "leader-sheet-a4.pdf"),
      format: "A4",
      printBackground: true,
    });

    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join(" | ")}`);
    console.log("KAN-123 leader trigger and earned action smoke checks passed.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
