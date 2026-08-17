const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = path.resolve(__dirname, "..", "index.html");
const stableSelectors = [
  ".topbar",
  "#cooperativeModeButton",
  ".language-switch",
  "#openAccountButton",
  "#openChatButton",
  "#openCloudButton",
  "#openFeedbackButton",
];

async function geometry(page) {
  return page.evaluate((selectors) => Object.fromEntries(selectors.map((selector) => {
    const rect = document.querySelector(selector).getBoundingClientRect();
    return [selector, { x: rect.x, y: rect.y, width: rect.width, height: rect.height }];
  })), stableSelectors);
}

function assertStable(before, after) {
  for (const selector of stableSelectors) {
    for (const key of ["x", "y", "width", "height"]) {
      assert.ok(
        Math.abs(before[selector][key] - after[selector][key]) < 0.5,
        `${selector} ${key} moved: ${before[selector][key]} -> ${after[selector][key]}`,
      );
    }
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1700, height: 700 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${pathToFileURL(appPath).href}#leader`, { waitUntil: "domcontentloaded" });

  assert.equal(await page.locator("#cooperativeModeLabel").textContent(), "Кооп");
  const campaignGeometry = await geometry(page);
  await page.locator("#cooperativeModeButton").click();
  assert.equal(await page.locator("#cooperativeModeLabel").textContent(), "Кампейн");
  assert.equal(await page.locator("#cooperativeModeButton").getAttribute("aria-label"), "Вернуться в режим кампейна");
  assert.deepEqual(
    await page.locator(".coop-tabs button").allTextContents().then((items) => items.map((item) => item.replace(/^\d+/u, "").trim())),
    ["Штаб", "Игроки", "Сценарий", "Aftermath", "Журнал"],
    "co-op tab names remain unchanged",
  );
  const cooperativeGeometry = await geometry(page);
  assertStable(campaignGeometry, cooperativeGeometry);

  const chrome = await page.evaluate(() => {
    const standard = getComputedStyle(document.querySelector(".nav-item"));
    const cooperative = getComputedStyle(document.querySelector(".coop-tabs button"));
    const reset = getComputedStyle(document.querySelector("#resetButton"));
    return {
      standardRadius: standard.borderRadius,
      cooperativeRadius: cooperative.borderRadius,
      standardClip: standard.clipPath,
      cooperativeClip: cooperative.clipPath,
      resetVisibility: reset.visibility,
      resetDisplay: reset.display,
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  assert.equal(chrome.cooperativeRadius, chrome.standardRadius);
  assert.equal(chrome.cooperativeClip, chrome.standardClip);
  assert.equal(chrome.resetVisibility, "hidden", "desktop keeps campaign-only action slots reserved");
  assert.notEqual(chrome.resetDisplay, "none", "reserved desktop slots participate in layout");
  assert.ok(chrome.overflow <= 0, "desktop header must not cause horizontal overflow");

  await page.locator('[data-coop-tab="players"]').click();
  assert.equal(await page.locator('[data-coop-tab="players"]').getAttribute("class"), "is-active");
  await page.locator('[data-locale="en"]').click();
  assert.equal(await page.locator("#cooperativeModeLabel").textContent(), "Campaign");
  await page.locator('[data-locale="ru"]').click();
  await page.locator("#cooperativeModeButton").click();
  assert.equal(await page.locator("#cooperativeModeLabel").textContent(), "Кооп");
  assertStable(campaignGeometry, await geometry(page));

  await page.setViewportSize({ width: 390, height: 700 });
  const mobileCampaignWidth = (await page.locator("#cooperativeModeButton").boundingBox()).width;
  await page.locator("#cooperativeModeButton").click();
  const mobileCooperativeWidth = (await page.locator("#cooperativeModeButton").boundingBox()).width;
  assert.equal(mobileCampaignWidth, mobileCooperativeWidth);
  assert.equal(await page.locator("#resetButton").evaluate((node) => getComputedStyle(node).display), "none");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

  if (process.env.KAN174_SCREENSHOT_DIR) {
    await page.setViewportSize({ width: 1700, height: 700 });
    await page.screenshot({ path: path.join(process.env.KAN174_SCREENSHOT_DIR, "stable-coop-header.png") });
  }
  assert.deepEqual(errors, []);
  await browser.close();
  console.log("KAN174_STABLE_MODE_HEADER_SMOKE_OK");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
