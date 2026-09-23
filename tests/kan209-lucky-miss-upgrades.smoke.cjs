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
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
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

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`, {
      waitUntil: "domcontentloaded",
    });
    try {
      await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    } catch {
      throw new Error(`Builder did not initialize: ${errors.join(" | ")}`);
    }
    await page.evaluate(() => {
      const state = window.MalifauxBuilder.getState();
      state.campaign.week = 3;
      state.arsenal.models = [
        {
          id: "kan209-model",
          name: "Lucky Test Subject",
          cost: 6,
          type: "Minion",
          keywords: "Experimental",
          injuries: [],
          luckyMissUpgrades: [],
        },
      ];
      window.MalifauxBuilder.replaceState(state);
    });
    await page.locator('[data-route="arsenal"]').click();

    const addButton = page.locator('[data-add-lucky-miss-model="kan209-model"]');
    await assert.doesNotReject(() => addButton.waitFor({ state: "visible" }));
    await addButton.click();
    const dialog = page.locator("#luckyMissDialog");
    await dialog.waitFor({ state: "visible" });
    assert.equal(await page.locator("#luckyMissSearchResults [data-select-lucky-miss]").count(), 14);

    await page.locator("#luckyMissSearch").fill("Lowered Expectations");
    const result = page.locator('[data-select-lucky-miss="lucky-miss-03"]');
    await assert.doesNotReject(() => result.waitFor({ state: "visible" }));
    await result.click();
    await dialog.waitFor({ state: "hidden" });

    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models[0].luckyMissUpgrades.length, 1);
    assert.equal(state.arsenal.models[0].luckyMissUpgrades[0].name, "Lowered Expectations");
    assert.equal(state.arsenal.models[0].luckyMissUpgrades[0].week, 3);
    assert.match(await page.locator(".model-row").innerText(), /Lucky Miss · Lowered Expectations/iu);

    await page.reload({ waitUntil: "domcontentloaded" });
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models[0].luckyMissUpgrades[0].catalogId, "lucky-miss-03");
    assert.equal(await page.locator('[data-remove-lucky-miss]').count(), 1);

    page.once("dialog", (confirmation) => confirmation.accept());
    await page.locator('[data-remove-lucky-miss]').click();
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models[0].luckyMissUpgrades.length, 0);
    assert.equal(await page.locator('[data-remove-lucky-miss]').count(), 0);

    await page.locator('[data-add-injury-model="kan209-model"]').click();
    await page.locator("#injurySearch").fill("Close Call");
    await page.locator("#injurySearchResults [data-select-injury]").click();
    await dialog.waitFor({ state: "visible" });
    await page.locator('[data-select-lucky-miss="lucky-miss-01"]').click();
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models[0].injuries.length, 0, "Red Joker must not attach Close Call as an injury.");
    assert.equal(state.arsenal.models[0].luckyMissUpgrades[0].name, "Martyr");

    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      "Lucky Miss controls must not overflow on mobile.",
    );
    assert.deepEqual(errors, []);
    console.log("KAN209_LUCKY_MISS_SMOKE_OK");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
