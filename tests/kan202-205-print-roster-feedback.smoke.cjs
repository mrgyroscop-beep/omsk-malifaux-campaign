const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appUrl = pathToFileURL(path.resolve(__dirname, "..", "index.html")).href;
const artifactDir = path.resolve(__dirname, "..", ".artifacts", "kan202-205-print");

function leaderTalent() {
  const entry = {
    id: "fated-strike",
    name: "Fated Strike",
    type: "attack",
    typeLabel: "Attack",
    isSignature: true,
    range: "2",
    rangeTypeLabel: "Rg",
    stat: "6",
    resistedBy: "Df",
    damage: "2/3/5",
    description: "Push the target up to 2 inches.",
    triggers: [
      {
        id: "follow-fate",
        name: "Follow Fate",
        suits: "{{ram}}",
        description: "After resolving, draw a card.",
      },
    ],
  };
  return {
    slotId: "attack-1",
    kind: "attack",
    mode: "biggerhat",
    name: entry.name,
    source: "Print fixture",
    snapshot: {
      sourceCard: {
        id: "leader-source",
        slug: "leader-source",
        name: "Leader Source",
        displayName: "Leader Source",
        actions: [entry],
      },
      entry,
      selectedTrigger: entry.triggers[0],
    },
  };
}

function modelSnapshot() {
  return {
    id: "guild-guard-card",
    slug: "guild-guard-card",
    name: "Guild Guard",
    displayName: "Guild Guard",
    faction: "guild",
    factionLabel: "Guild",
    station: "minion",
    stationLabel: "Minion",
    cost: 5,
    health: 6,
    size: 2,
    base: 30,
    baseLabel: "30mm",
    defense: 5,
    defenseSuit: "{{ram}}",
    willpower: 4,
    willpowerSuit: "",
    speed: 5,
    keywords: [{ id: "marshal", name: "Marshal", slug: "marshal" }],
    characteristics: ["Living"],
    actions: [
      {
        id: "peacebringer",
        name: "Peacebringer",
        type: "attack",
        typeLabel: "Attack",
        range: "12",
        rangeTypeLabel: "Rg",
        stat: "5",
        resistedBy: "Df",
        damage: "2/3/4",
        description: "Target suffers damage.",
        triggers: [
          {
            id: "critical-strike",
            name: "Critical Strike",
            suits: "{{ram}}",
            description: "Increase damage by one.",
          },
        ],
      },
    ],
    abilities: [
      {
        id: "hard-to-kill",
        name: "Hard to Kill",
        description: "This model may not be reduced below one Health.",
      },
    ],
  };
}

(async () => {
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  const context = await browser.newContext({ locale: "ru-RU" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    await page.goto(appUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate(({ talent, card }) => {
      window.MalifauxBuilder.replaceState({
        crew: {
          name: "Printed Guild",
          player: "Smoke Test",
          faction: "Guild",
          keywords: ["Marshal", "Guard"],
        },
        campaign: { week: 2, length: 8 },
        leader: {
          name: "Fated Captain",
          archetype: "Generalist",
          talents: [talent],
          advances: [],
          injuries: [],
          manualUpgrades: [],
        },
        arsenal: {
          scrip: 3,
          equipment: [],
          models: [
            {
              id: "guild-guard-1",
              name: "Guild Guard",
              cost: 5,
              type: "Minion",
              keywords: "Marshal, Guard",
              characteristics: ["Living"],
              injuries: [],
              cardSnapshot: card,
            },
          ],
        },
      });
    }, { talent: leaderTalent(), card: modelSnapshot() });

    const comment = "Не забыть выбрать схему.\nПроверить снаряжение перед игрой.";
    await page.locator("#printComment").fill(comment);
    assert.equal(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).crew.printComment,
      comment,
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    assert.equal(await page.locator("#printComment").inputValue(), comment);
    await page.evaluate(() => window.renderPrintDossier());

    const leaderAction = page.locator('[data-print-leader-action="Fated Strike"]');
    assert.equal(await leaderAction.locator('[data-print-action-trigger="Follow Fate"]').count(), 1);
    assert.equal(await leaderAction.locator("[data-print-signature-label]").count(), 1);
    assert.match(await leaderAction.locator("[data-print-signature-label]").textContent(), /Сигнатурное/);

    const model = page.locator('[data-print-model-card="guild-guard-1"]');
    assert.equal(await model.locator("[data-print-model-profile]").count(), 1);
    assert.match(await model.textContent(), /Df.*5.*Wp.*4.*Sp.*5.*Health.*6/s);
    assert.match(await model.textContent(), /Peacebringer/);
    assert.match(await model.textContent(), /Critical Strike/);
    assert.match(await model.textContent(), /Hard to Kill/);

    const printedComment = page.locator("[data-print-roster-comment]");
    assert.equal(await printedComment.count(), 1);
    assert.equal((await printedComment.locator("p").textContent()).trim(), comment);

    fs.mkdirSync(artifactDir, { recursive: true });
    await page.emulateMedia({ media: "print" });
    await page.setViewportSize({ width: 794, height: 1123 });
    await page.locator(".print-leader-page").screenshot({
      path: path.join(artifactDir, "leader-page.png"),
    });
    await page.locator(".print-arsenal-page").screenshot({
      path: path.join(artifactDir, "arsenal-page.png"),
    });
    await page.pdf({
      path: path.join(artifactDir, "roster-a4.pdf"),
      format: "A4",
      printBackground: true,
    });
    await page.emulateMedia({ media: "screen" });

    await page.locator("#printComment").fill("");
    await page.evaluate(() => window.renderPrintDossier());
    assert.equal(await page.locator("[data-print-roster-comment]").count(), 0);
    assert.deepEqual(errors, []);
    console.log("KAN202_205_PRINT_ROSTER_FEEDBACK_SMOKE_OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
