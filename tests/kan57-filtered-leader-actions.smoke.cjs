const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";
const artifactDir = process.env.ARTIFACT_DIR || "";

function summary(slug, name, overrides = {}) {
  return {
    id: overrides.id || slug,
    slug,
    game_mode_type: "standard",
    name,
    display_name: name,
    faction: "guild",
    faction_label: "Guild",
    station: "minion",
    station_label: "Minion",
    cost: 6,
    keywords: [{ id: 1, name: "Test", slug: "test" }],
    characteristics: ["Minion"],
    ...overrides,
  };
}

const sharedStrike = {
  id: 7,
  slug: "shared-strike",
  name: "Shared Strike",
  type: "attack",
  type_label: "Attack",
  range: "1",
  range_type: "melee",
  range_type_label: "Melee",
  stat: "6",
  resisted_by: "df",
  resisted_by_label: "Df",
  damage: "2/3/4",
  description: "Shared exact rule text.",
  triggers: [
    {
      id: 70,
      slug: "driven-home",
      name: "Driven Home",
      suits: "{{ram}}",
      description: "Push the target 2 inches.",
    },
  ],
};

const summaries = [
  summary("alpha", "Alpha Marshal"),
  summary("beta", "Beta Marshal"),
  summary("gamma", "Gamma Marshal"),
  summary("broken", "Broken Detail"),
  summary("master", "Forbidden Master", { station: "master", station_label: "Master" }),
  summary("expensive", "Expensive Ally", { cost: 12 }),
  summary("outsider", "Outside Keyword", {
    keywords: [{ id: 2, name: "Other", slug: "other" }],
  }),
];

const details = {
  alpha: {
    ...summary("alpha", "Alpha Marshal"),
    actions: [
      sharedStrike,
      {
        ...sharedStrike,
        id: 8,
        slug: "shared-strike-variant",
        stat: "5",
        description: "Unique rule text for search.",
      },
      { ...sharedStrike, id: 9, name: "Wrong Tactical", type: "tactical" },
      ...Array.from({ length: 22 }, (_, index) => ({
        ...sharedStrike,
        id: 200 + index,
        slug: `zeta-action-${index}`,
        name: `Zeta Action ${String(index).padStart(2, "0")}`,
        description: `Pagination rule ${index}.`,
      })),
    ],
    abilities: [
      {
        id: 101,
        slug: "steady-hands",
        name: "Steady Hands",
        description: "Special ability rule.",
      },
    ],
  },
  beta: {
    ...summary("beta", "Beta Marshal"),
    actions: [{ ...sharedStrike, id: 7 }],
    abilities: [],
  },
  gamma: {
    ...summary("gamma", "Gamma Marshal"),
    actions: [
      {
        ...sharedStrike,
        id: 7,
        slug: "triggerless-hit",
        name: "Triggerless Hit",
        description: "No trigger can be selected.",
        triggers: [],
      },
    ],
    abilities: [],
  },
};

const fixture = {
  version: 4,
  crew: {
    name: "KAN-57 Crew",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Test", ""],
  },
  campaign: { length: 8, week: 1, meetingDay: "" },
  leader: {
    name: "Direct Picker",
    archetype: "Generalist",
    characteristics: ["Living", ""],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [
      {
        slotId: "attack-1",
        kind: "attack",
        mode: "manual",
        name: "Keep Until Explicit Choice",
      },
    ],
    crewCard: "",
    xp: 3,
    advances: [],
    manualUpgrades: [],
    injuries: [],
    totem: null,
  },
  arsenal: { models: [], equipment: [], equipmentScripSpent: 0, scrip: 5 },
  loadout: { hiredModelIds: [], assignments: [] },
  games: [],
};

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  let detailInFlight = 0;
  let maxDetailInFlight = 0;
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.route("https://biggerhat.net/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/\/characters\/([^/]+)$/u);
    if (!match) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: summaries, meta: { last_page: 1 } }),
      });
      return;
    }
    const slug = decodeURIComponent(match[1]);
    detailInFlight += 1;
    maxDetailInFlight = Math.max(maxDetailInFlight, detailInFlight);
    await new Promise((resolve) => setTimeout(resolve, slug === "alpha" ? 80 : 25));
    detailInFlight -= 1;
    const detail = details[slug];
    await route.fulfill({
      status: detail ? 200 : 404,
      contentType: "application/json",
      body: JSON.stringify(detail ? { data: detail } : { message: "missing" }),
    });
  });

  try {
    await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), fixture);
    await page.locator('.nav-item[data-route="leader"]').click();

    const openSlot = async (index = 0) => {
      await page.locator(`[data-pick-talent="${index}"]`).click();
      await page.locator("#talentDialog").waitFor({ state: "visible" });
    };

    await openSlot(0);
    assert.equal(await page.locator('input[name="talentPickerMode"]:checked').inputValue(), "model");
    const modelMode = page.locator('input[name="talentPickerMode"][value="model"]');
    const directMode = page.locator('input[name="talentPickerMode"][value="direct"]');
    await modelMode.focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await directMode.isChecked(), true);
    assert.equal(
      await directMode.evaluate((input) => document.activeElement === input),
      true,
      "ArrowRight moved focus away from the newly checked native radio.",
    );
    await page.keyboard.press("ArrowLeft");
    assert.equal(await modelMode.isChecked(), true);
    assert.equal(
      await modelMode.evaluate((input) => document.activeElement === input),
      true,
      "ArrowLeft moved focus away from the newly checked native radio.",
    );
    await page.waitForTimeout(150);
    assert.equal(await page.locator(".talent-direct-choice").count(), 0, "A stale direct result rendered in model mode.");
    await page.locator('[data-close-dialog="talentDialog"]').click();
    assert.equal(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).leader.talents[0].name,
      "Keep Until Explicit Choice",
      "Mode switching or closing changed the saved talent.",
    );

    await openSlot(0);
    await page.locator('input[name="talentPickerMode"][value="direct"]').check();
    await page.waitForFunction(() => {
      const text = document.querySelector("#talentCatalogStatus")?.textContent || "";
      return text.includes("Проверено") && !text.includes("Загружаю");
    });
    assert.ok(maxDetailInFlight <= 4, `Detail concurrency exceeded four: ${maxDetailInFlight}`);
    assert.match(await page.locator("#talentCatalogStatus").textContent(), /1 не загрузилось/);
    assert.equal(await page.locator("[data-show-more-talents]").count(), 1);
    await page.locator("[data-show-more-talents]").click();
    assert.equal(await page.locator(".talent-direct-choice").count(), 25);
    assert.equal(await page.locator(".talent-direct-choice h4", { hasText: "Shared Strike" }).count(), 2);
    const grouped = page
      .locator(".talent-direct-choice")
      .filter({ has: page.locator("h4", { hasText: "Shared Strike" }) })
      .filter({ has: page.locator("select[data-direct-source]") });
    assert.equal(await grouped.count(), 1, "Exact duplicates were not grouped once.");
    assert.deepEqual(await grouped.locator("select[data-direct-source] option").allTextContents(), [
      "Alpha Marshal · Guild · Cost 6",
      "Beta Marshal · Guild · Cost 6",
    ]);
    assert.equal(await page.getByText("Wrong Tactical", { exact: true }).count(), 0);
    assert.equal(await page.getByText("Forbidden Master", { exact: true }).count(), 0);

    await page.locator("#talentCardSearch").fill("unique rule");
    await page.waitForTimeout(320);
    assert.equal(await page.locator(".talent-direct-choice").count(), 1);
    assert.match(await page.locator(".talent-direct-choice").textContent(), /Unique rule text/);
    await page.locator("#talentCardSearch").fill("does not exist");
    await page.waitForTimeout(320);
    assert.match(await page.locator("#talentEntryPanel").textContent(), /Подходящих записей не найдено/);
    await page.locator("#talentCardSearch").fill("");
    await page.waitForTimeout(320);

    const groupedAgain = page
      .locator(".talent-direct-choice")
      .filter({ has: page.locator("h4", { hasText: "Shared Strike" }) })
      .filter({ has: page.locator("select[data-direct-source]") });
    await groupedAgain.locator("select[data-direct-source]").selectOption("beta");
    if (artifactDir) {
      fs.mkdirSync(artifactDir, { recursive: true });
      await page.screenshot({ path: path.join(artifactDir, "kan57-direct-desktop.png"), fullPage: false });
      await page.setViewportSize({ width: 390, height: 844 });
      await groupedAgain.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(artifactDir, "kan57-direct-mobile.png"), fullPage: false });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await page.setViewportSize({ width: 600, height: 900 });
    const fitsAtTwoHundredPercent = await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
      const panel = document.querySelector("#talentDialog .modal-panel");
      return panel.scrollWidth <= panel.clientWidth + 1;
    });
    assert.equal(fitsAtTwoHundredPercent, true, "Direct picker overflows horizontally at 200% zoom.");
    await page.evaluate(() => {
      document.documentElement.style.zoom = "";
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await groupedAgain.locator("[data-select-direct-talent]").click();
    await page.waitForFunction(() =>
      document.querySelector('[data-pick-talent="0"]') === document.activeElement,
    );
    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.talents[0].source, "Beta Marshal");
    assert.equal(state.leader.talents[0].cardSlug, "beta");
    assert.equal(state.leader.talents[0].snapshot.sourceCard.slug, "beta");
    assert.equal(state.leader.talents[0].snapshot.entry.name, "Shared Strike");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.talents[0].source, "Beta Marshal");
    await page.locator('.nav-item[data-route="leader"]').click();
    assert.match(await page.locator('[data-talent-name="0"]').inputValue(), /Shared Strike · Beta Marshal/);

    // The existing model-first path remains the default and can still select a detailed card entry.
    await openSlot(0);
    assert.equal(await page.locator('input[name="talentPickerMode"]:checked').inputValue(), "model");
    await page.locator("#talentCardSearch").fill("Alpha Marshal");
    await page.waitForTimeout(320);
    await page.locator('[data-catalog-slug="alpha"]').click();
    await page.locator('[data-select-talent-entry="8"]').click();
    assert.equal(
      (await page.evaluate(() => window.MalifauxBuilder.getState())).leader.talents[0].snapshot.entry.stat,
      "5",
    );

    // Ability slots receive their own direct label and search the eligible ability collection.
    await page.locator('[data-locale="en"]').click();
    await openSlot(2);
    assert.equal(await page.locator("#talentPickerModeDirect").textContent(), "By abilities");
    await page.locator('input[name="talentPickerMode"][value="direct"]').check();
    await page.waitForFunction(() => {
      const text = document.querySelector("#talentCatalogStatus")?.textContent || "";
      return text.includes("Checked") && !text.includes("Loading");
    });
    await page.locator("#talentCardSearch").fill("special ability");
    await page.waitForTimeout(320);
    assert.match(await page.locator(".talent-direct-choice").textContent(), /Steady Hands/);
    await page.locator('[data-close-dialog="talentDialog"]').click();
    await page.locator('[data-locale="ru"]').click();

    // Heavy Hitter keeps exactly one available selected trigger; triggerless actions stay disabled.
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    state.leader.archetype = "Heavy Hitter";
    state.leader.talents = [];
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), state);
    await openSlot(0);
    await page.locator('input[name="talentPickerMode"][value="direct"]').check();
    await page.waitForFunction(() => {
      const text = document.querySelector("#talentCatalogStatus")?.textContent || "";
      return text.includes("Проверено") && !text.includes("Загружаю");
    });
    const triggerless = page.locator(".talent-direct-choice").filter({
      has: page.locator("h4", { hasText: "Triggerless Hit" }),
    });
    assert.equal(await triggerless.locator("[data-select-direct-talent]").isDisabled(), true);
    const strike = page
      .locator(".talent-direct-choice")
      .filter({ has: page.locator("h4", { hasText: "Shared Strike" }) })
      .filter({ has: page.locator("select[data-direct-source]") });
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileControls = await strike.evaluate((card) => {
      const source = card.querySelector("select[data-direct-source]").getBoundingClientRect();
      const trigger = card.querySelector("select[data-direct-trigger]").getBoundingClientRect();
      const button = card.querySelector("[data-select-direct-talent]").getBoundingClientRect();
      return {
        stacked: trigger.top > source.bottom && button.top > trigger.bottom,
        sameWidth: Math.abs(source.width - trigger.width) < 2 && Math.abs(trigger.width - button.width) < 2,
      };
    });
    assert.deepEqual(mobileControls, { stacked: true, sameWidth: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await strike.locator("[data-select-direct-talent]").click();
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.leader.talents[0].snapshot.selectedTrigger.name, "Driven Home");
    assert.equal(state.leader.talents[0].snapshot.entry.triggers.length, 1);

    // Natural Joker advancement still opens the original model-first picker without the new initial-only control.
    state.leader.xp = 13;
    await page.evaluate((value) => window.MalifauxBuilder.replaceState(value), state);
    await page.locator('.nav-item[data-route="chronicle"]').click();
    await page.locator("#addAdvancementButton").click();
    await page.selectOption("#advancementXpIndex", "7");
    await page.selectOption("#advancementTable", "action");
    await page.selectOption("#advancementFlip", "red-joker");
    const naturalChoice = await page.locator("#advancementChoice option").evaluateAll((options) =>
      options.find((option) => /choose|выбрать/i.test(option.textContent || ""))?.value,
    );
    assert.ok(naturalChoice, "Natural Joker choice is unavailable in the advancement regression.");
    await page.selectOption("#advancementChoice", naturalChoice);
    await page.locator("#advancementBiggerHatButton").click();
    assert.equal(await page.locator("#talentPickerMode").isHidden(), true);
    assert.equal(await page.locator('input[name="talentPickerMode"]:checked').inputValue(), "model");
    await page.locator('[data-close-dialog="talentDialog"]').click();

    assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join(" | ")}`);
    console.log("KAN57_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
