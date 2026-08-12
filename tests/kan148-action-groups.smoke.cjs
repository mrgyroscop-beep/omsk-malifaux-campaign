const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appUrl = pathToFileURL(path.resolve(__dirname, "..", "index.html")).href;
const artifactDir = path.resolve(__dirname, "..", ".artifacts", "kan148");

function talent(kind, name, index) {
  const entry = {
    id: `${kind}-${index}`,
    name,
    type: kind,
    typeLabel: kind === "attack" ? "Attack" : kind === "tactical" ? "Tactical" : "Ability",
    description: `${name} description`,
    triggers: [],
  };
  return {
    slotId: `${kind}-${index}`,
    kind,
    mode: "biggerhat",
    name,
    source: "Ceddra, Sightless Snow",
    snapshot: {
      entry,
      sourceCard: {
        id: "ceddra",
        slug: "ceddra-sightless-snow",
        name: "Ceddra, Sightless Snow",
        displayName: "Ceddra, Sightless Snow",
        cost: 7,
        actions: kind === "ability" ? [] : [entry],
        abilities: kind === "ability" ? [entry] : [],
      },
    },
  };
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
  const page = await browser.newPage({ locale: "ru-RU" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(appUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    const state = await page.evaluate(() => window.MalifauxBuilder.getState());
    state.crew.faction = "Arcanists";
    state.crew.keywords = ["M&SU", "Chimera"];
    state.leader.name = "Grouped Leader";
    state.leader.archetype = "Generalist";
    state.leader.xp = 3;
    state.leader.talents = [
      talent("attack", "Attack First", 1),
      talent("tactical", "Tactical First", 1),
      talent("ability", "Borrowed Ability", 1),
    ];
    state.leader.advances = [{
      id: "earned-ruthless",
      xp: 3,
      maxTier: 4,
      tier: 2,
      recipient: "leader",
      tableId: "ability",
      choiceId: "ability-ruthless",
      resultType: "ability",
      name: "Ruthless",
      snapshot: {
        id: "ability-ruthless",
        name: "Ruthless",
        type: "ability",
        effect: "This model ignores Terrifying during its Activation.",
        sourceRevision: "fixture-v1",
      },
      flip: { card: "1", cheated: false },
      scripPaid: 0,
      createdAt: "2026-08-12T00:00:00.000Z",
    }];
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), state);
    await page.locator('.primary-nav [data-route="leader"]').click();

    const liveGroups = page.locator("[data-leader-action-group]");
    assert.deepEqual(await liveGroups.evaluateAll((nodes) => nodes.map((node) => node.dataset.leaderActionGroup)), ["attack", "tactical", "ability"]);
    assert.deepEqual(await liveGroups.nth(0).locator("[data-leader-action-name]").evaluateAll((nodes) => nodes.map((node) => node.dataset.leaderActionName)), ["Attack First"]);
    assert.deepEqual(await liveGroups.nth(2).locator("[data-leader-ability-name]").evaluateAll((nodes) => nodes.map((node) => node.dataset.leaderAbilityName)), ["Borrowed Ability", "Ruthless"]);
    assert.equal(await page.locator('#leaderPermanentRecords [data-permanent-section="abilities"]').count(), 0);

    await page.evaluate(() => window.renderPrintDossier());
    const printGroups = page.locator("[data-print-leader-action-group]");
    assert.deepEqual(await printGroups.evaluateAll((nodes) => nodes.map((node) => node.dataset.printLeaderActionGroup)), ["attack", "tactical", "ability"]);
    assert.deepEqual(await printGroups.nth(0).locator("[data-print-leader-action]").evaluateAll((nodes) => nodes.map((node) => node.dataset.printLeaderAction)), ["Attack First"]);
    assert.deepEqual(await printGroups.nth(2).locator("[data-print-leader-ability]").evaluateAll((nodes) => nodes.map((node) => node.dataset.printLeaderAbility)), ["Borrowed Ability", "Ruthless"]);

    fs.mkdirSync(artifactDir, { recursive: true });
    await page.locator("#leaderActionPreview").screenshot({
      path: path.join(artifactDir, "leader-groups-desktop.png"),
    });

    await page.locator('[data-locale="en"]').click();
    assert.deepEqual(await liveGroups.evaluateAll((nodes) => nodes.map((node) => node.dataset.leaderActionGroup)), ["attack", "tactical", "ability"]);
    assert.match(await liveGroups.nth(1).locator(".leader-action-group-heading").textContent(), /Tactical Actions/);

    await page.setViewportSize({ width: 390, height: 844 });
    const layout = await page.locator("#leaderActionPreview").evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
    assert.ok(layout.scrollWidth <= layout.clientWidth + 1, `Leader groups overflow on mobile: ${JSON.stringify(layout)}`);
    assert.deepEqual(errors, []);
    console.log("KAN148_ACTION_GROUPS_SMOKE_OK");
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
