const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

function rgbChannels(value) {
  const channels = String(value).match(/[\d.]+/g)?.slice(0, 3).map(Number);
  assert.equal(channels?.length, 3, `Could not parse color ${value}.`);
  return channels;
}

function relativeLuminance(value) {
  const [red, green, blue] = rgbChannels(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05);
}

async function assertNoHorizontalOverflow(page, width) {
  await page.setViewportSize({ width, height: 900 });
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    records: [...document.querySelectorAll(".manual-upgrade-entry")].map((record) => ({
      scrollWidth: record.scrollWidth,
      clientWidth: record.clientWidth,
    })),
  }));
  assert.ok(result.scrollWidth <= result.clientWidth + 1, `${width}px page has horizontal overflow.`);
  result.records.forEach((record, index) => {
    assert.ok(
      record.scrollWidth <= record.clientWidth + 1,
      `${width}px manual record ${index + 1} has horizontal overflow.`,
    );
  });
  const controls = await page.evaluate(() => ({
    add: (() => {
      const style = getComputedStyle(document.querySelector("[data-add-manual-upgrade]"));
      return { color: style.color, background: style.backgroundColor };
    })(),
    actions: [...document.querySelectorAll(".manual-upgrade-actions button")].map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  }));
  assert.ok(
    contrastRatio(controls.add.color, controls.add.background) >= 4.5,
    `${width}px add-button contrast is below 4.5:1.`,
  );
  assert.ok(controls.actions.length >= 2, `${width}px has no edit/delete controls.`);
  controls.actions.forEach((control, index) => {
    assert.ok(
      control.width >= 40 && control.height >= 40,
      `${width}px action ${index + 1} is ${control.width}x${control.height}; expected at least 40x40.`,
    );
  });
}

async function openLeader(page) {
  await page.locator('.primary-nav [data-route="leader"]').click();
  await page.locator("#leaderPermanentCard").scrollIntoViewIfNeeded();
}

async function addUpgrade(page, { title, effect, action = "" }) {
  await page.locator("[data-add-manual-upgrade]").click();
  await page.locator('#manualUpgradeForm [name="title"]').fill(title);
  await page.locator('#manualUpgradeForm [name="action"]').fill(action);
  await page.locator('#manualUpgradeForm [name="effect"]').fill(effect);
  await page.locator("#manualUpgradeSubmit").click();
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

    const oldState = await page.evaluate(() => {
      window.MalifauxBuilder.replaceState({ leader: { name: "Old leader" } });
      return window.MalifauxBuilder.getState();
    });
    assert.deepEqual(oldState.leader.manualUpgrades, [], "Old dossiers must migrate safely.");

    const normalized = await page.evaluate(() => {
      window.MalifauxBuilder.replaceState({
        leader: {
          name: "Archivist",
          xp: 7,
          advances: [{ id: "official-advance", xp: 1, name: "Official" }],
          manualUpgrades: [
            null,
            { id: "blank", title: "   ", effect: "   " },
            { id: "same", title: "  Keen Eye  ", effect: "  +1 to a chosen duel  ", action: "  Strike  " },
            { id: "same", name: "Second", notes: "Reference only" },
          ],
        },
        arsenal: { scrip: 9, equipment: [], models: [] },
      });
      return window.MalifauxBuilder.getState();
    });
    assert.equal(normalized.leader.manualUpgrades.length, 2, "Malformed/blank records must be discarded.");
    assert.equal(normalized.leader.manualUpgrades[0].title, "Keen Eye");
    assert.equal(normalized.leader.manualUpgrades[0].action, "Strike");
    assert.notEqual(normalized.leader.manualUpgrades[0].id, normalized.leader.manualUpgrades[1].id);
    const invariant = {
      xp: normalized.leader.xp,
      scrip: normalized.arsenal.scrip,
      advances: normalized.leader.advances,
    };

    await openLeader(page);
    const ratingBeforeManualCrud = await page.locator("#ratingResult").textContent();
    assert.equal(await page.locator('[data-permanent-section="manual-upgrades"] .permanent-record-heading b').textContent(), "2");
    assert.match(await page.locator(".manual-upgrade-notice").textContent(), /не меняют характеристики/i);

    await page.locator("[data-add-manual-upgrade]").click();
    await page.getByRole("dialog", { name: "Добавить улучшение" }).waitFor();
    assert.equal(
      await page.locator("#manualUpgradeDialog").getAttribute("aria-labelledby"),
      "manualUpgradeDialogTitle",
    );
    assert.equal(await page.evaluate(() => document.activeElement?.name), "title", "Dialog must focus its first field.");
    await page.locator('#manualUpgradeForm [name="title"]').fill("   ");
    await page.locator('#manualUpgradeForm [name="effect"]').fill("   ");
    await page.locator("#manualUpgradeSubmit").click();
    await page.locator("#manualUpgradeError").waitFor({ state: "visible" });
    assert.equal(await page.evaluate(() => document.activeElement?.name), "title");
    await page.locator('[data-close-dialog="manualUpgradeDialog"]').click();

    await addUpgrade(page, {
      title: "  Sharpened Instincts  ",
      effect: "  Gain a positive twist while defending.  ",
      action: "  Guarded Step  ",
    });
    let current = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(current.leader.manualUpgrades.length, 3);
    assert.equal(current.leader.manualUpgrades.at(-1).title, "Sharpened Instincts");
    assert.equal(current.leader.xp, invariant.xp);
    assert.equal(current.arsenal.scrip, invariant.scrip);
    assert.deepEqual(current.leader.advances, invariant.advances);
    assert.equal(await page.locator("#ratingResult").textContent(), ratingBeforeManualCrud);

    const newId = current.leader.manualUpgrades.at(-1).id;
    await page.waitForFunction((id) => document.activeElement?.dataset.editManualUpgrade === id, newId);
    await page.locator(`[data-edit-manual-upgrade="${newId}"]`).click();
    await page.locator('#manualUpgradeForm [name="effect"]').fill("Edited effect");
    await page.locator("#manualUpgradeSubmit").click();
    current = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(current.leader.manualUpgrades.find((item) => item.id === newId).effect, "Edited effect");
    await page.waitForFunction((id) => document.activeElement?.dataset.editManualUpgrade === id, newId);

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.locator(`[data-delete-manual-upgrade="${newId}"]`).click();
    assert.equal((await page.evaluate(() => window.MalifauxBuilder.getState())).leader.manualUpgrades.length, 3);

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(`[data-delete-manual-upgrade="${newId}"]`).click();
    current = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(current.leader.manualUpgrades.length, 2);
    const previousId = current.leader.manualUpgrades.at(-1).id;
    await page.waitForFunction((id) => document.activeElement?.dataset.editManualUpgrade === id, previousId);

    await addUpgrade(page, { title: "Focus middle", effect: "Middle effect" });
    current = await page.evaluate(() => window.MalifauxBuilder.getState());
    const middleId = current.leader.manualUpgrades.at(-1).id;
    await page.waitForFunction((id) => document.activeElement?.dataset.editManualUpgrade === id, middleId);
    await addUpgrade(page, { title: "Focus last", effect: "Last effect" });
    current = await page.evaluate(() => window.MalifauxBuilder.getState());
    const lastId = current.leader.manualUpgrades.at(-1).id;
    await page.waitForFunction((id) => document.activeElement?.dataset.editManualUpgrade === id, lastId);
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(`[data-delete-manual-upgrade="${middleId}"]`).click();
    await page.waitForFunction((id) => document.activeElement?.dataset.editManualUpgrade === id, lastId);
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(`[data-delete-manual-upgrade="${lastId}"]`).click();
    await page.waitForFunction((id) => document.activeElement?.dataset.editManualUpgrade === id, previousId);

    const focusFixture = await page.evaluate(() => window.MalifauxBuilder.getState());
    await page.evaluate((value) => {
      value.leader.manualUpgrades = [{ id: "only-focus-record", title: "Only", effect: "Only effect" }];
      window.MalifauxBuilder.replaceState(value);
    }, focusFixture);
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator('[data-delete-manual-upgrade="only-focus-record"]').click();
    await page.waitForFunction(() => document.activeElement?.hasAttribute("data-add-manual-upgrade"));
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), focusFixture);

    const countBeforeRollback = (await page.evaluate(() => window.MalifauxBuilder.getState())).leader.manualUpgrades.length;
    await page.evaluate(() => {
      window.__kan53SetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => { throw new Error("quota"); };
    });
    await addUpgrade(page, { title: "Must roll back", effect: "Never persisted" });
    assert.equal(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).leader.manualUpgrades.length,
      countBeforeRollback,
      "Failed storage writes must roll state back.",
    );
    await page.evaluate(() => { Storage.prototype.setItem = window.__kan53SetItem; });
    if (await page.locator("#manualUpgradeDialog").evaluate((dialog) => dialog.open)) {
      await page.locator('[data-close-dialog="manualUpgradeDialog"]').click();
    }

    await addUpgrade(page, { title: "Frozen upgrade", effect: "Original frozen effect", action: "Strike" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    assert.ok(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).leader.manualUpgrades.some(
        (item) => item.title === "Frozen upgrade",
      ),
      "Manual upgrades must survive reload.",
    );

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#exportButton").click();
    const download = await downloadPromise;
    const exportPath = path.join(os.tmpdir(), `kan53-${Date.now()}.json`);
    await download.saveAs(exportPath);
    const exported = JSON.parse(fs.readFileSync(exportPath, "utf8"));
    assert.ok(exported.leader.manualUpgrades.some((item) => item.title === "Frozen upgrade"));
    fs.unlinkSync(exportPath);

    const importedRecord = { id: "imported-manual", title: "Imported", effect: "Imported effect", action: "Walk" };
    await page.locator("#importFile").setInputFiles({
      name: "import.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({
        ...exported,
        leader: { ...exported.leader, manualUpgrades: [importedRecord] },
      })),
    });
    await page.waitForFunction(() => window.MalifauxBuilder.getState().leader.manualUpgrades[0]?.id === "imported-manual");
    const beforeFailedImport = await page.evaluate(() => window.MalifauxBuilder.getState());
    await page.evaluate(() => {
      document.querySelector("#toastRegion").replaceChildren();
      window.__kan53ImportSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => { throw new Error("quota during import"); };
    });
    await page.locator("#importFile").setInputFiles({
      name: "failed-import.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({
        ...exported,
        leader: {
          ...exported.leader,
          manualUpgrades: [{ id: "must-not-import", title: "Must not import", effect: "Rollback" }],
        },
      })),
    });
    await page.getByText("Не удалось сохранить импортированное досье. Предыдущее досье восстановлено.").waitFor();
    const failedImportResult = await page.evaluate(() => {
      const result = {
        state: window.MalifauxBuilder.getState(),
        toasts: document.querySelector("#toastRegion").textContent,
        stored: JSON.parse(localStorage.getItem("m4e-untold-campaign-v1")),
      };
      Storage.prototype.setItem = window.__kan53ImportSetItem;
      return result;
    });
    assert.deepEqual(failedImportResult.state, beforeFailedImport, "Failed import must roll memory back.");
    assert.equal(failedImportResult.stored.leader.manualUpgrades[0].id, "imported-manual");
    assert.doesNotMatch(failedImportResult.toasts, /Досье импортировано/);
    await openLeader(page);
    assert.match(await page.locator('[data-permanent-section="manual-upgrades"] [data-manual-upgrade="imported-manual"]').textContent(), /Imported effect/);

    await page.locator('[data-route="arsenal"]').click();
    assert.match(await page.locator('#activeLoadoutSummary [data-manual-upgrade="imported-manual"]').textContent(), /Imported effect/);

    await page.locator('[data-route="chronicle"]').click();
    await page.locator('#gameForm [name="opponent"]').fill("Snapshot rival");
    await page.locator("#gameForm").evaluate((form) => form.requestSubmit());
    await page.waitForFunction(() => window.MalifauxBuilder.getState().games.length === 1);
    const savedGame = await page.evaluate(() => window.MalifauxBuilder.getState().games[0]);
    assert.equal(savedGame.loadoutSnapshot.leader.manualUpgrades[0].effect, "Imported effect");

    await page.evaluate(() => {
      const value = window.MalifauxBuilder.getState();
      value.leader.manualUpgrades[0].effect = "Changed after game";
      window.MalifauxBuilder.replaceState(value);
    });
    const frozenGame = await page.evaluate(() => window.MalifauxBuilder.getState().games[0]);
    assert.equal(frozenGame.loadoutSnapshot.leader.manualUpgrades[0].effect, "Imported effect");
    await page.evaluate(() => {
      const dialog = document.querySelector("#advancementDialog");
      if (dialog.open) dialog.close();
    });
    await page.locator(".game-loadout-snapshot summary").click();
    assert.match(await page.locator('.game-loadout-snapshot [data-manual-upgrade="imported-manual"]').textContent(), /Imported effect/);

    await page.evaluate(() => window.renderPrintDossier());
    assert.match(await page.locator('[data-print-manual-upgrade="imported-manual"]').textContent(), /Changed after game/);
    assert.match(await page.locator("[data-print-manual-upgrades]").textContent(), /не изменяют характеристики/i);

    await page.locator('[data-locale="en"]').click();
    await openLeader(page);
    assert.match(await page.locator(".manual-upgrade-notice").textContent(), /Manual records/);
    await page.locator("[data-add-manual-upgrade]").click();
    assert.equal(await page.locator("#manualUpgradeDialogTitle").textContent(), "Add upgrade");
    await page.keyboard.press("Escape");
    await page.locator('[data-locale="ru"]').click();

    const longToken = "UPGRADE".repeat(90);
    await page.evaluate((token) => {
      const value = window.MalifauxBuilder.getState();
      value.leader.manualUpgrades = [{ id: "long", title: token, effect: token, action: token }];
      window.MalifauxBuilder.replaceState(value);
    }, longToken);
    await openLeader(page);
    for (const width of [320, 360, 390, 430]) await assertNoHorizontalOverflow(page, width);

    const finalState = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.deepEqual(finalState.leader.advances, invariant.advances);
    assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join(" | ")}`);
    console.log("KAN-53 leader manual upgrades smoke test passed.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
