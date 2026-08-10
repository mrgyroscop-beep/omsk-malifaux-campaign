const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";
const screenshotDir = process.env.KAN55_SCREENSHOT_DIR || "";
const NA = "not-applicable";
const statOrder = ["rg", "skl", "rst", "tn", "dmg"];
const actionMarkers = { isSignature: true, stoneCost: 1 };

const expectedActions = {
  "the-plan": { ...actionMarkers, rg: "6″", skl: 0, rst: NA, tn: 5, dmg: NA },
  "forbidden-curse": { ...actionMarkers, rg: "6″", skl: 5, rst: "Wp", tn: NA, dmg: NA },
  "specialized-tools": { ...actionMarkers, rg: "6″", skl: 5, rst: "Wp", tn: 11, dmg: NA },
  "loot-stash": { ...actionMarkers, rg: NA, skl: NA, rst: NA, tn: NA, dmg: NA },
  sadistic: { ...actionMarkers, rg: "1″", skl: 5, rst: "Df", tn: NA, dmg: 2 },
};

const expectedAbilities = [
  "expert-coordination",
  "shape-landscape",
  "heavy-blow",
  "unusual-specialty",
  "prepared",
  "scavenger",
  "inhuman",
];

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    cards: [...document.querySelectorAll(".crew-option")].map((card) => ({
      clientWidth: card.clientWidth,
      scrollWidth: card.scrollWidth,
    })),
    offenders: [...document.body.querySelectorAll("*")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${
            element.classList.length ? `.${[...element.classList].join(".")}` : ""
          }`,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((element) => element.right > document.documentElement.clientWidth + 1 || element.left < -1)
      .sort((left, right) => right.right - left.right)
      .slice(0, 12),
    landmarks: [".topbar", ".app-shell", ".rail", ".primary-nav", ".workspace"]
      .map((selector) => {
        const element = document.querySelector(selector);
        const rect = element.getBoundingClientRect();
        return { selector, width: Math.round(rect.width), scrollWidth: element.scrollWidth };
      }),
  }));
  assert.ok(
    dimensions.documentWidth <= dimensions.viewportWidth + 1,
    `${label} document overflows by ${dimensions.documentWidth - dimensions.viewportWidth}px: ${JSON.stringify({ offenders: dimensions.offenders, landmarks: dimensions.landmarks })}`,
  );
  dimensions.cards.forEach((card, index) => {
    assert.ok(
      card.scrollWidth <= card.clientWidth + 1,
      `${label} card ${index + 1} overflows by ${card.scrollWidth - card.clientWidth}px.`,
    );
  });
}

async function actionUi(page, id) {
  return page.locator(`[data-crew-card="${id}"] [data-crew-stat]`).evaluateAll((nodes) =>
    nodes.map((node) => ({
      key: node.dataset.crewStat,
      state: node.dataset.statState,
      value: node.querySelector("dd").textContent.trim(),
      ariaLabel: node.querySelector("dd").getAttribute("aria-label"),
    })),
  );
}

function expectedDisplay(value) {
  return value === NA ? "—" : String(value);
}

function rgbChannels(value) {
  const normalized = String(value).trim();
  const hex = normalized.match(/^#([\da-f]{6})$/i)?.[1];
  const channels = hex
    ? [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16))
    : normalized.match(/[\d.]+/g)?.slice(0, 3).map(Number);
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

function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function assertCrewStatLabelContrast(page, label) {
  const colors = await page.evaluate(() => {
    const bodyStyle = getComputedStyle(document.body);
    const variable = (name) => bodyStyle.getPropertyValue(name).trim();
    return {
      unselected: [...document.querySelectorAll(".crew-option:not(.is-selected) .crew-action-stats dt")]
        .map((node) => getComputedStyle(node).color),
      selected: [...document.querySelectorAll(".crew-option.is-selected .crew-action-stats dt")]
        .map((node) => getComputedStyle(node).color),
      lightSurfaces: [
        variable("--dossier-paper-deep"),
        variable("--dossier-paper"),
        variable("--dossier-paper-light"),
      ],
      darkSurfaces: [variable("--folder"), variable("--folder-raised")],
    };
  });
  assert.ok(colors.unselected.length > 0, `${label} has no unselected crew stat labels.`);
  const unselectedRatios = colors.unselected.flatMap((foreground) =>
    colors.lightSurfaces.map((background) => contrastRatio(foreground, background)),
  );
  assert.ok(
    Math.min(...unselectedRatios) >= 4.5,
    `${label} unselected stat-label contrast is ${Math.min(...unselectedRatios).toFixed(2)}:1.`,
  );
  if (colors.selected.length) {
    const selectedRatios = colors.selected.flatMap((foreground) =>
      colors.darkSurfaces.map((background) => contrastRatio(foreground, background)),
    );
    assert.ok(
      Math.min(...selectedRatios) >= 4.5,
      `${label} selected stat-label contrast is ${Math.min(...selectedRatios).toFixed(2)}:1.`,
    );
  }
}

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate(() => {
      const state = window.MalifauxBuilder.getState();
      state.leader.crewCard = "";
      window.MalifauxBuilder.replaceState(state);
    });
    await page.locator('[data-route="leader"]').first().click();

    const cards = await page.evaluate(() => window.MalifauxBuilder.getCrewCards());
    assert.equal(cards.length, 12);
    assert.equal(new Set(cards.map((card) => card.id)).size, 12, "Crew card IDs are not unique.");
    assert.equal(cards.filter((card) => card.effectType === "action").length, 5);
    assert.equal(cards.filter((card) => card.effectType === "ability").length, 7);
    assert.deepEqual(
      cards.filter((card) => card.effectType === "ability").map((card) => card.id),
      expectedAbilities,
    );
    cards.forEach((card) => {
      if (card.effectType === "action") {
        assert.deepEqual(card.action, expectedActions[card.id], `${card.id} action metadata differs.`);
        assert.deepEqual(
          Object.keys(card.action).filter((key) => statOrder.includes(key)),
          statOrder,
          `${card.id} stat order differs.`,
        );
      } else {
        assert.equal(card.action, null, `${card.id} must be explicitly ability-only.`);
      }
    });

    assert.equal(await page.locator(".crew-option").count(), 12);
    assert.equal(await page.locator('.crew-option[data-crew-effect="action"]').count(), 5);
    assert.equal(await page.locator('.crew-option[data-crew-effect="ability"]').count(), 7);
    for (const card of await page.locator('.crew-option[data-crew-effect="action"]').all()) {
      assert.equal(await card.locator('[data-action-marker="signature"]').count(), 1);
      assert.equal(await card.locator('[data-action-marker="stone"][data-stone-cost="1"]').count(), 1);
    }
    assert.equal(await page.locator(".crew-no-actions").count(), 7);
    assert.deepEqual(await page.locator(".crew-no-actions").allTextContents(), Array(7).fill("∅Действий нет"));

    for (const [id, expected] of Object.entries(expectedActions)) {
      const rendered = await actionUi(page, id);
      assert.deepEqual(rendered.map((stat) => stat.key), statOrder);
      rendered.forEach((stat) => {
        assert.equal(stat.value, expectedDisplay(expected[stat.key]), `${id}.${stat.key} display differs.`);
        assert.equal(
          stat.state,
          expected[stat.key] === NA ? "not-applicable" : "value",
          `${id}.${stat.key} state differs.`,
        );
        if (expected[stat.key] === NA) assert.equal(stat.ariaLabel, "Не применяется");
      });
    }
    assert.equal((await actionUi(page, "the-plan"))[1].value, "0", "Skl 0 was lost.");
    await assertCrewStatLabelContrast(page, "1440x900 RU");

    const ruUnknowns = await page.evaluate(() => [
      window.MalifauxBuilder.getCrewStatPresentation(null),
      window.MalifauxBuilder.getCrewStatPresentation(undefined),
      window.MalifauxBuilder.getCrewStatPresentation(""),
      window.MalifauxBuilder.getCrewStatPresentation(0),
    ]);
    assert.deepEqual(ruUnknowns.slice(0, 3), Array(3).fill({
      state: "unknown",
      display: "Нет данных",
      accessible: "Нет данных",
    }));
    assert.deepEqual(ruUnknowns[3], { state: "value", display: "0", accessible: "0" });

    const plan = page.locator('[data-crew-card="the-plan"]');
    await plan.focus();
    await page.keyboard.press("Space");
    assert.equal(await plan.getAttribute("aria-pressed"), "true");
    assert.equal(await plan.evaluate((button) => document.activeElement === button), true);
    assert.equal((await page.evaluate(() => window.MalifauxBuilder.getState())).leader.crewCard, "the-plan");

    const curse = page.locator('[data-crew-card="forbidden-curse"]');
    await curse.focus();
    await page.keyboard.press("Enter");
    assert.equal(await curse.getAttribute("aria-pressed"), "true");
    assert.equal(await plan.getAttribute("aria-pressed"), "false");
    assert.equal(await curse.evaluate((button) => document.activeElement === button), true);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.locator('[data-route="leader"]').first().click();
    assert.equal((await page.evaluate(() => window.MalifauxBuilder.getState())).leader.crewCard, "forbidden-curse");
    assert.equal(await page.locator('[data-crew-card="forbidden-curse"]').getAttribute("aria-pressed"), "true");
    await assertCrewStatLabelContrast(page, "1440x900 RU selected");

    if (screenshotDir) {
      fs.mkdirSync(screenshotDir, { recursive: true });
      await page.locator(".crew-card-section").screenshot({ path: path.join(screenshotDir, "desktop-ru.png") });
    }
    await assertNoHorizontalOverflow(page, "1440x900 RU");

    await page.locator('[data-locale="en"]').click();
    assert.deepEqual(await page.locator(".crew-no-actions").allTextContents(), Array(7).fill("∅No actions"));
    for (const [id, expected] of Object.entries(expectedActions)) {
      const rendered = await actionUi(page, id);
      assert.deepEqual(rendered.map((stat) => stat.key), statOrder);
      rendered.forEach((stat) => {
        assert.equal(stat.value, expectedDisplay(expected[stat.key]), `${id}.${stat.key} EN differs.`);
        if (expected[stat.key] === NA) assert.equal(stat.ariaLabel, "Not applicable");
      });
    }
    assert.deepEqual(await page.evaluate(() => window.MalifauxBuilder.getCrewStatPresentation(null)), {
      state: "unknown",
      display: "No data",
      accessible: "No data",
    });
    await assertCrewStatLabelContrast(page, "1440x900 EN");
    if (screenshotDir) {
      await page.locator(".crew-card-section").screenshot({ path: path.join(screenshotDir, "desktop-en.png") });
    }

    await page.evaluate(() => window.renderPrintDossier());
    assert.equal(await page.locator('.print-crew-card-title [data-action-marker="signature"]').count(), 1);
    assert.equal(await page.locator('.print-crew-card-title [data-action-marker="stone"][data-stone-cost="1"]').count(), 1);
    assert.deepEqual(
      await page.locator(".print-crew-action-stats [data-print-crew-stat]").evaluateAll((nodes) =>
        nodes.map((node) => ({
          key: node.dataset.printCrewStat,
          value: node.querySelector("dd").textContent.trim(),
        })),
      ),
      statOrder.map((key) => ({ key, value: expectedDisplay(expectedActions["forbidden-curse"][key]) })),
      "Print did not use the selected crew card action catalog.",
    );
    await page.locator('[data-crew-card="expert-coordination"]').click();
    await page.evaluate(() => window.renderPrintDossier());
    assert.equal(await page.locator(".print-crew-action-stats").count(), 0);
    assert.equal(await page.locator(".print-crew-no-actions").textContent(), "No actions");

    await page.setViewportSize({ width: 768, height: 1024 });
    await assertNoHorizontalOverflow(page, "768x1024 EN");
    await assertCrewStatLabelContrast(page, "768x1024 EN");
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoHorizontalOverflow(page, "390x844 EN");
    await assertCrewStatLabelContrast(page, "390x844 EN");
    if (screenshotDir) {
      await page.locator(".crew-card-section").screenshot({ path: path.join(screenshotDir, "mobile-en.png") });
    }
    await page.locator('[data-locale="ru"]').click();
    await assertNoHorizontalOverflow(page, "390x844 RU");
    await assertCrewStatLabelContrast(page, "390x844 RU");
    if (screenshotDir) {
      await page.locator(".crew-card-section").screenshot({ path: path.join(screenshotDir, "mobile-ru.png") });
    }

    // A 195 CSS-pixel viewport is the layout-width equivalent of 390px at 200% browser zoom.
    await page.setViewportSize({ width: 195, height: 422 });
    await assertNoHorizontalOverflow(page, "390x844 at 200% zoom equivalent");
    await assertCrewStatLabelContrast(page, "390x844 at 200% zoom equivalent RU");
    assert.equal(await page.locator(".crew-card-flipper, [data-card-face]").count(), 0, "KAN-27 flip UI returned.");
    assert.deepEqual(pageErrors, []);

    process.stdout.write("KAN55_SMOKE_OK\n");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
