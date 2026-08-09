const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "";
const artifactDir = path.resolve(__dirname, "..", ".artifacts", "kan122");

function actionFixture() {
  const entry = {
    id: "signature-stone-action",
    name: "Marked by Fate",
    type: "attack",
    typeLabel: "Attack",
    isSignature: true,
    stoneCost: 2,
    range: "8",
    rangeType: "projectile",
    rangeTypeLabel: "Rg",
    stat: "6",
    resistedBy: "Df",
    targetNumber: "12",
    damage: "2/3/5",
    description: "Resolve the action, then draw a card.",
  };
  return {
    slotId: "attack-1",
    kind: "attack",
    mode: "biggerhat",
    name: entry.name,
    source: "KAN-122 Fixture",
    snapshot: {
      sourceCard: {
        id: "kan122-card",
        slug: "kan122-card",
        name: "Fixture Model",
        displayName: "Fixture Model",
        cost: 6,
        actions: [entry],
      },
      entry,
      selectedTrigger: null,
    },
  };
}

function advancesFixture() {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `leader-advance-${index + 1}`,
    xp: index + 1,
    tier: index < 4 ? 1 : index < 8 ? 2 : 3,
    tableId: index === 0 ? "ability" : "skill",
    resultType: index === 0 ? "ability" : "skill",
    recipient: index === 9 ? "totem" : "leader",
    name: index === 0 ? "Borrowed Ability" : `Leader Advance ${index + 1}`,
    appliesTo: index === 0 ? "Leader" : "Defense",
    flip: { card: `${index + 1} of Rams`, cheated: false },
  }));
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
    await page.evaluate(({ talent, advances }) => {
      window.MalifauxBuilder.replaceState({
        crew: { name: "The Marked", player: "KAN-122", faction: "Neverborn" },
        campaign: { week: 5, length: 8 },
        leader: {
          name: "Mara Voss",
          archetype: "Lucky Upstart",
          xp: 10,
          talents: [talent],
          advances,
          injuries: [],
          manualUpgrades: [],
        },
        arsenal: { scrip: 8, equipment: [], models: [] },
      });
    }, { talent: actionFixture(), advances: advancesFixture() });

    await page.locator('.primary-nav [data-route="leader"]').click();
    const summary = page.locator(".talent-picked-summary").first();
    await summary.waitFor();
    assert.equal(await summary.locator(".action-marker-signature .action-marker-glyph-signature").count(), 1);
    assert.equal(
      await summary.locator(".action-marker-signature").getAttribute("aria-label"),
      "Сигнатурное действие",
    );
    assert.equal(await summary.locator(".action-marker-stone").textContent(), "2");
    assert.equal(
      await summary.locator(".action-marker-stone").getAttribute("aria-label"),
      "Стоимость в камнях душ: 2",
    );
    const markerShapes = await summary.evaluate((node) => {
      const signature = node.querySelector(".action-marker-glyph-signature").getBoundingClientRect();
      const stone = node.querySelector(".action-marker-glyph-stone").getBoundingClientRect();
      return {
        signature: { width: signature.width, height: signature.height },
        stone: { width: stone.width, height: stone.height },
      };
    });
    assert.ok(markerShapes.signature.height > markerShapes.signature.width, "Lightning marker must be vertical.");
    assert.ok(markerShapes.stone.height >= markerShapes.stone.width * 1.7, "Soulstone marker must be elongated.");

    const compact = await summary.evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
    assert.ok(compact.scrollWidth <= compact.clientWidth + 1, "Leader action summary must not overflow.");

    fs.mkdirSync(artifactDir, { recursive: true });
    await page.locator("#route-leader").screenshot({
      path: path.join(artifactDir, "leader-action-markers.png"),
    });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileSummary = await summary.evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
    assert.ok(
      mobileSummary.scrollWidth <= mobileSummary.clientWidth + 1,
      "390px leader action summary must not overflow.",
    );
    await summary.screenshot({
      path: path.join(artifactDir, "leader-action-markers-mobile.png"),
    });
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.evaluate(() => window.renderPrintDossier());
    const printTalent = page.locator(".print-talent").first();
    assert.equal(await printTalent.locator(".action-marker-glyph-signature").count(), 1);
    assert.equal(await printTalent.locator(".action-marker-stone").textContent(), "2");

    const expectedPrintCounts = await page.evaluate(() => {
      const advances = window.MalifauxBuilder.getState().leader.advances;
      return {
        leader: advances.filter(
          (advance) =>
            advance.recipient !== "totem" &&
            advance.tableId !== "ability" &&
            advance.resultType !== "ability",
        ).length,
        abilities: advances.filter(
          (advance) =>
            advance.recipient === "leader" &&
            (advance.tableId === "ability" || advance.resultType === "ability"),
        ).length,
      };
    });
    const leaderAdvances = page.locator("[data-print-leader-advancements] li");
    assert.ok(expectedPrintCounts.leader >= 5, "Fixture should exercise a dense leader advancement list.");
    assert.equal(
      await leaderAdvances.count(),
      expectedPrintCounts.leader,
      "Leader sheet should show every non-ability leader advancement.",
    );
    assert.equal(
      await page.locator('[data-print-section="abilities"] li').count(),
      expectedPrintCounts.abilities,
      "Ability advancements must remain visible in the leader abilities block.",
    );
    assert.ok(
      !(await page.locator("[data-print-leader-advancements]").textContent()).includes("Leader Advance 10"),
      "Totem advancements must not leak onto the leader sheet.",
    );

    await page.emulateMedia({ media: "print" });
    await page.locator(".print-leader-page").screenshot({
      path: path.join(artifactDir, "leader-sheet-a4-page.png"),
    });
    await page.screenshot({
      path: path.join(artifactDir, "leader-sheet-a4.png"),
      fullPage: true,
    });

    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join(" | ")}`);
    console.log("KAN-122 leader advancement and action marker smoke checks passed.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
