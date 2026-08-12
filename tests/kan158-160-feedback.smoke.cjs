const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appUrl = pathToFileURL(path.resolve(__dirname, "..", "index.html")).href;

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
  const page = await browser.newPage({ locale: "ru-RU" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(appUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    const state = windowState(await page.evaluate(() => window.MalifauxBuilder.getState()));
    const totemProfile = await page.evaluate(() =>
      window.MalifauxAdvancementData.tier3.totems.find((entry) => entry.id === "chance-taker"),
    );
    state.crew.name = "Print Crew";
    state.leader.name = "Print Leader";
    state.leader.injuries = [{ id: "leader-scar", name: "Leader Scar", effect: "Leader injury effect" }];
    state.leader.xp = 13;
    state.leader.totem = {
      id: "totem-1", profileId: "chance-taker", name: "Print Totem", profile: totemProfile, snapshot: totemProfile,
      characteristics: ["Totem"], injuries: [{ id: "totem-scar", name: "Totem Scar", effect: "Totem injury effect" }], size: 1, base: 30,
      sourceAdvancementId: "totem-source", acquiredBy: "totem-source",
    };
    state.leader.advances = [{ id: "totem-source", xp: 13, maxTier: 3, tier: 3, tableId: "totem", recipient: "leader", choiceId: "chance-taker", name: "Chance Taker", resultType: "totem", flip: { card: "7", cheated: false }, snapshot: totemProfile, acquiredTotemId: "totem-1" }];
    state.arsenal.scrip = 17;
    state.arsenal.models = [{ id: "model-1", name: "Print Model", cost: 7, type: "Enforcer", keywords: "Guild", injuries: [{ id: "model-scar", name: "Model Scar", effect: "Model injury effect" }] }];
    state.arsenal.equipment = [
      { id: "eq-model", name: "Model Blade", effect: "Model equipment effect" },
      { id: "eq-leader", name: "Leader Coat", effect: "Leader equipment effect" },
      { id: "eq-totem", name: "Totem Charm", effect: "Totem equipment effect" },
    ];
    state.loadout.assignments = [
      { equipmentId: "eq-model", targetKind: "model", targetId: "model-1" },
      { equipmentId: "eq-leader", targetKind: "leader", targetId: null },
      { equipmentId: "eq-totem", targetKind: "totem", targetId: null },
    ];
    state.loadout.hiredModelIds = ["model-1"];
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), state);
    await page.evaluate(() => window.renderPrintDossier());
    const modelCard = page.locator('[data-print-model-card="model-1"]');
    assert.match(await modelCard.textContent(), /Print Model/);
    assert.match(await modelCard.textContent(), /Model Scar/);
    assert.match(await modelCard.textContent(), /Model Blade/);
    assert.match(await page.locator(".print-leader-page").textContent(), /Leader Coat/);
    assert.match(await page.locator(".print-totem").textContent(), /Totem Charm/);
    assert.match(await page.locator(".print-totem").textContent(), /Lucky Guess/);
    assert.match(await page.locator(".print-totem").textContent(), /Stat 6/);

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("#resetButton").click();
    assert.equal((await page.evaluate(() => window.MalifauxBuilder.getState())).arsenal.scrip, 3);
    assert.deepEqual(errors, []);
    console.log("KAN158_160_FEEDBACK_SMOKE_OK");
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });

function windowState(value) {
  return JSON.parse(JSON.stringify(value));
}
