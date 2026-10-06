const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  return "application/octet-stream";
}

async function startServer() {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://localhost").pathname;
      const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
      const target = path.resolve(root, relative);
      if (!target.startsWith(root)) throw new Error("outside root");
      response.writeHead(200, { "Content-Type": contentType(target) });
      response.end(await readFile(target));
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

const fixture = {
  version: 5,
  crew: {
    name: "KAN-213/214 Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Living"],
  },
  campaign: { length: 8, week: 2, meetingDay: "" },
  leader: {
    name: "Equipment Keeper",
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
        source: "KAN-213 Source",
        snapshot: {
          sourceCard: { id: "kan213-card", name: "KAN-213 Source", cost: 5 },
          entry: {
            id: "kan213-test-blade",
            name: "Test Blade",
            type: "attack",
            stat: "5",
            resistedBy: "Df",
            triggers: [],
          },
        },
      },
      {
        slotId: "tactical-1",
        kind: "tactical",
        mode: "biggerhat",
        name: "Test Tactic",
        source: "KAN-214 Source",
        snapshot: {
          sourceCard: { id: "kan214-card", name: "KAN-214 Source", cost: 5 },
          entry: {
            id: "kan214-test-tactic",
            name: "Test Tactic",
            type: "tactical",
            stat: "5",
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
  arsenal: {
    models: [],
    equipment: [
      {
        id: "eq-kan213-pistol",
        name: "Pistol",
        br: "Всегда",
        cc: 1,
        scripPaid: 1,
        acquisition: "purchase",
      },
    ],
    equipmentScripSpent: 1,
    scrip: 5,
  },
  loadout: { hiredModelIds: [], assignments: [] },
  games: [],
};

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 1280, height: 900 },
  });
  await context.addInitScript(() => {
    localStorage.setItem("m4e-untold-locale", "ru");
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), fixture);
    await page.locator('[data-route="chronicle"]').click();

    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "1");
    await page.selectOption("#advancementTable", "attack-modification");
    await page.selectOption("#advancementFlip", "5");
    await page.selectOption("#advancementChoice", "attack-5-reposition");
    assert.equal(
      await page.locator('#advancementAppliesTo option[value="equipment:eq-kan213-pistol"]').count(),
      1,
      "Equipment was not offered as a trigger target.",
    );
    await page.selectOption("#advancementAppliesTo", "equipment:eq-kan213-pistol");
    assert.match(await page.locator("#advancementAppliesLabel").textContent(), /снаряжение/iu);
    await page.locator("#advancementForm").evaluate((form) => form.requestSubmit());
    await page.waitForFunction(() => window.MalifauxBuilder.getState().leader.advances.length === 1);

    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.advances[0].choiceId, "attack-5-reposition");
    assert.equal(state.leader.advances[0].equipmentId, "eq-kan213-pistol");
    assert.equal(state.leader.advances[0].appliesTo, "Pistol");
    assert.deepEqual(state.loadout.assignments, [
      { equipmentId: "eq-kan213-pistol", targetKind: "leader", targetId: null },
    ]);

    await page.locator('[data-route="arsenal"]').click();
    const equipmentCard = page.locator(".equipment-item").filter({ hasText: "Pistol" });
    assert.equal(await equipmentCard.locator("[data-assign-equipment]").isDisabled(), true);
    assert.equal(await equipmentCard.locator("[data-delete-equipment]").isDisabled(), true);
    assert.match(await equipmentCard.textContent(), /Закреплено продвижением/iu);
    assert.match(await equipmentCard.textContent(), /Reposition/iu);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.advances[0].equipmentId, "eq-kan213-pistol");
    assert.deepEqual(state.loadout.assignments, [
      { equipmentId: "eq-kan213-pistol", targetKind: "leader", targetId: null },
    ]);
    await page.evaluate(() => window.renderPrintDossier());
    assert.match(await page.locator(".print-leader-page .print-equipment-list").first().textContent(), /Reposition/iu);

    await page.locator('[data-route="chronicle"]').click();
    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "2");
    await page.selectOption("#advancementTable", "tactical-modification");
    await page.selectOption("#advancementFlip", "red-joker");
    const redJokerChoices = await page.locator("#advancementChoice option").evaluateAll((options) =>
      options.map((option) => option.value),
    );
    assert.ok(redJokerChoices.includes("tactical-1-eau-de-bayou"));
    assert.ok(redJokerChoices.includes("tactical-13-coordinated-attack"));
    assert.ok(redJokerChoices.includes("tactical-red-joker-illumination-of-illios"));
    await page.selectOption("#advancementChoice", "tactical-13-coordinated-attack");
    await page.selectOption("#advancementAppliesTo", "Test Tactic");
    await page.locator("#advancementForm").evaluate((form) => form.requestSubmit());
    await page.waitForFunction(() => window.MalifauxBuilder.getState().leader.advances.length === 2);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    const redJokerAdvance = state.leader.advances.find(
      (advance) => advance.choiceId === "tactical-13-coordinated-attack",
    );
    assert.ok(redJokerAdvance);
    assert.equal(redJokerAdvance.flip.card, "red-joker");
    assert.equal(redJokerAdvance.appliesTo, "Test Tactic");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.advances.length, 2);
    assert.equal(
      state.leader.advances.find((advance) => advance.choiceId === "attack-5-reposition").equipmentId,
      "eq-kan213-pistol",
    );
    assert.deepEqual(errors, []);
    console.log("KAN213_214_FEEDBACK_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
