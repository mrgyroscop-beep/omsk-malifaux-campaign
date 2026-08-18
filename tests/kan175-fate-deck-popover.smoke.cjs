const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = path.resolve(__dirname, "..", "index.html");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

async function fateSnapshot(page) {
  return page.evaluate(() => ({
    cardId: document.querySelector("#fateCard").dataset.cardId || null,
    historyCount: Number(document.querySelector("#fateHistoryCount").textContent),
    remaining: Number.parseInt(document.querySelector("#fateDeckRemaining").textContent, 10),
    result: document.querySelector("#fateFlipResult").textContent.trim(),
  }));
}

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
  await page.locator('[data-locale="ru"]').click();

  const toggle = page.locator("#fateFlipButton");
  const popover = page.locator("#fateFlipPopover");
  const draw = page.locator("#fateDrawAgainButton");

  assert.deepEqual(await fateSnapshot(page), {
    cardId: null,
    historyCount: 0,
    remaining: 54,
    result: "Нажмите «Флип», чтобы открыть верхнюю карту.",
  });
  assert.equal(await toggle.getAttribute("aria-label"), "Открыть Fate Deck");

  await toggle.click();
  await assert.doesNotReject(() => popover.waitFor({ state: "visible" }));
  assert.deepEqual(await fateSnapshot(page), {
    cardId: null,
    historyCount: 0,
    remaining: 54,
    result: "Нажмите «Флип», чтобы открыть верхнюю карту.",
  }, "opening the deck must not flip a card");
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  assert.equal(await toggle.getAttribute("aria-label"), "Закрыть Fate Deck");
  assert.equal(await page.locator("#fateDrawAgainButtonLabel").textContent(), "Флипнуть карту");

  await draw.click();
  const firstFlip = await fateSnapshot(page);
  assert.ok(firstFlip.cardId);
  assert.equal(firstFlip.historyCount, 1);
  assert.equal(firstFlip.remaining, 53);
  assert.equal(await page.locator("#fateDrawAgainButtonLabel").textContent(), "Флипнуть ещё");

  await page.locator('.nav-item[data-route="reference"]').click();
  await assert.doesNotReject(() => popover.waitFor({ state: "hidden" }));
  await toggle.click();
  await assert.doesNotReject(() => popover.waitFor({ state: "visible" }));
  assert.deepEqual(
    await fateSnapshot(page),
    firstFlip,
    "reopening the deck must preserve the last card without flipping the next one",
  );

  await toggle.click();
  await assert.doesNotReject(() => popover.waitFor({ state: "hidden" }));
  assert.deepEqual(await fateSnapshot(page), firstFlip, "closing the deck must not change it");

  await toggle.click();
  await draw.click();
  const secondFlip = await fateSnapshot(page);
  assert.equal(secondFlip.historyCount, 2);
  assert.equal(secondFlip.remaining, 52);
  assert.notEqual(secondFlip.cardId, firstFlip.cardId);

  assert.deepEqual(errors, []);
  await browser.close();
  console.log("KAN175_FATE_DECK_POPOVER_SMOKE_OK");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
