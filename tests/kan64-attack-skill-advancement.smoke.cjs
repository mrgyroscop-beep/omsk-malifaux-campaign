const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

const fixture = {
  version: 4,
  crew: {
    name: "KAN-64 Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Living"],
  },
  campaign: { length: 8, week: 2, meetingDay: "" },
  leader: {
    name: "Skill Keeper",
    archetype: "Generalist",
    characteristics: ["Living"],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [
      {
        slotId: "attack-1",
        kind: "attack",
        mode: "biggerhat",
        name: "Test Blade",
        source: "KAN-64 Source",
        snapshot: {
          sourceCard: { id: "kan64-card", name: "KAN-64 Source", cost: 5 },
          entry: {
            id: "kan64-test-blade",
            name: "Test Blade",
            type: "attack",
            stat: "4",
            resistedBy: "Df",
            triggers: [],
          },
        },
      },
    ],
    crewCard: "",
    xp: 2,
    injuries: [],
    advances: [],
  },
  arsenal: { models: [], equipment: [], equipmentScripSpent: 0, scrip: 5 },
  loadout: { hiredModelIds: [], assignments: [] },
  games: [],
};

async function recordSkillBoost(page, { xp, flip, choiceId, expectedSkill }) {
  await page.locator("#addAdvancementButton").click();
  await page.selectOption("#advancementXpIndex", String(xp));
  await page.selectOption("#advancementTable", "attack-modification");
  await page.selectOption("#advancementFlip", String(flip));
  await page.selectOption("#advancementChoice", choiceId);
  await page.selectOption("#advancementAppliesTo", "Test Blade");
  assert.match(
    await page.locator("#advancementAppliesTo option:checked").textContent(),
    new RegExp(`Skl ${expectedSkill}\\b`),
  );
  await page.evaluate(() => document.querySelector("#advancementForm").requestSubmit());
  await page.waitForFunction(
    (id) =>
      window.MalifauxBuilder.getState().leader.advances.some(
        (advance) => advance.choiceId === id,
      ),
    choiceId,
  );
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
    await page.locator('[data-route="chronicle"]').click();

    await recordSkillBoost(page, {
      xp: 1,
      flip: 7,
      choiceId: "attack-7-skill-boost",
      expectedSkill: 4,
    });
    await recordSkillBoost(page, {
      xp: 2,
      flip: 10,
      choiceId: "attack-10-skill-boost",
      expectedSkill: 5,
    });

    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(
      state.leader.advances.map((advance) => advance.choiceId),
      ["attack-7-skill-boost", "attack-10-skill-boost"],
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(
      state.leader.advances.map((advance) => advance.choiceId),
      ["attack-7-skill-boost", "attack-10-skill-boost"],
      "Sequential attack Skill advancements were not preserved after reload.",
    );
    assert.deepEqual(pageErrors, []);
    console.log("KAN64_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
