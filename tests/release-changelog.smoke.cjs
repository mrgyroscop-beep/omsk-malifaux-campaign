const assert = require("node:assert/strict");
const { mkdir, readFile } = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const artifacts = path.join(root, ".artifacts", "changelog");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";
const expectedVersion = "2026.09.18.1";
const seenKey = "m4e-release-notes-seen-v1";
const localeKey = "m4e-untold-locale";

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

async function startServer() {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://localhost").pathname;
      const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
      const target = path.resolve(root, relative);
      if (!target.startsWith(root)) throw new Error("outside root");
      const body = await readFile(target);
      response.writeHead(200, { "Content-Type": contentType(target) });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

async function openCleanPage(browser, baseUrl, options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__MALIFAUX_TEST_RELEASE_NOTES__ = true;
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ releaseKey, languageKey }) => {
      localStorage.removeItem(releaseKey);
      localStorage.setItem(languageKey, "ru");
    },
    { releaseKey: seenKey, languageKey: localeKey },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  return { context, page, errors };
}

(async () => {
  await mkdir(artifacts, { recursive: true });
  const server = await startServer();
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/`;
  const browser = await chromium.launch({ channel: browserChannel, headless: true });

  try {
    const desktop = await openCleanPage(browser, baseUrl, {
      viewport: { width: 1440, height: 900 },
    });
    const banner = desktop.page.locator("#releaseBanner");
    await assert.doesNotReject(() => banner.waitFor({ state: "visible" }));
    assert.notEqual(await banner.getAttribute("open"), null, "release notes must open as a modal popup");
    assert.equal(
      await desktop.page.locator('meta[name="app-version"]').getAttribute("content"),
      expectedVersion,
    );
    assert.match(await banner.innerText(), /Новая версия/iu);
    assert.match(
      await banner.innerText(),
      /Хроника сохраняет все выполненные схемы/iu,
    );
    assert.match(await banner.innerText(), /v2026\.09\.18\.1/iu);
    assert.equal(await banner.locator("li").count(), 3);
    await banner.screenshot({ path: path.join(artifacts, "release-banner-desktop.png") });

    await desktop.page.locator("#releaseBannerDismiss").click();
    await assert.doesNotReject(() => banner.waitFor({ state: "hidden" }));
    assert.equal(
      await desktop.page.evaluate((key) => localStorage.getItem(key), seenKey),
      expectedVersion,
    );

    await desktop.page.reload({ waitUntil: "domcontentloaded" });
    assert.equal(await banner.isHidden(), true, "read release must stay hidden after reload");

    await desktop.page.locator("#openAccountButton").click();
    await desktop.page.locator("#accountDialog").waitFor({ state: "visible" });
    await desktop.page.locator("#accountChangelogButton").click();
    const changelog = desktop.page.locator("#changelogDialog");
    await changelog.waitFor({ state: "visible" });
    assert.equal(await desktop.page.locator("#accountDialog").getAttribute("open"), null);
    assert.equal(await changelog.locator(".changelog-entry").count(), 8);
    assert.match(await changelog.locator(".changelog-entry").first().innerText(), /Текущая/iu);
    assert.match(await changelog.innerText(), /Колода Судьбы под рукой/iu);
    await changelog.screenshot({ path: path.join(artifacts, "changelog-dialog-desktop.png") });
    await desktop.page.keyboard.press("Escape");
    await changelog.waitFor({ state: "hidden" });

    await desktop.page.locator('[data-locale="en"]').click();
    await desktop.page.locator("#openAccountButton").click();
    await desktop.page.locator("#accountChangelogButton").click();
    await changelog.waitFor({ state: "visible" });
    assert.equal(await desktop.page.locator("#changelogDialogTitle").textContent(), "Changelog");
    assert.match(await changelog.innerText(), /Current/iu);
    assert.match(await changelog.innerText(), /Fate Deck at hand/iu);
    await desktop.page.locator("#changelogDialogClose").click();
    assert.deepEqual(desktop.errors, []);
    await desktop.context.close();

    const mobile = await openCleanPage(browser, baseUrl, {
      viewport: { width: 375, height: 667 },
      reducedMotion: "reduce",
    });
    const mobileBanner = mobile.page.locator("#releaseBanner");
    await mobileBanner.waitFor({ state: "visible" });
    const mobileBox = await mobileBanner.boundingBox();
    assert.ok(mobileBox);
    assert.ok(mobileBox.x >= 0 && mobileBox.x + mobileBox.width <= 375);
    assert.ok(mobileBox.y >= 0 && mobileBox.y + mobileBox.height <= 667);
    assert.equal(
      await mobile.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      "mobile release banner must not create horizontal scrolling",
    );
    assert.ok((await mobile.page.locator("#releaseBannerDismiss").boundingBox()).height >= 44);
    assert.ok(
      await mobileBanner.evaluate((element) => {
        const value = getComputedStyle(element).transitionDuration;
        return value.endsWith("ms")
          ? Number.parseFloat(value) <= 1
          : Number.parseFloat(value) <= 0.001;
      }),
      "reduced motion must make the banner transition effectively instant",
    );
    await mobile.page.screenshot({ path: path.join(artifacts, "release-banner-mobile.png") });

    await mobile.page.locator("#releaseBannerChangelog").click();
    const mobileDialog = mobile.page.locator("#changelogDialog");
    await mobileDialog.waitFor({ state: "visible" });
    assert.equal(
      await mobile.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      "mobile changelog must not create horizontal scrolling",
    );
    await mobile.page.screenshot({ path: path.join(artifacts, "changelog-dialog-mobile.png") });
    assert.deepEqual(mobile.errors, []);
    await mobile.context.close();

    const landscape = await openCleanPage(browser, baseUrl, {
      viewport: { width: 667, height: 375 },
    });
    const landscapeBanner = landscape.page.locator("#releaseBanner");
    await landscapeBanner.waitFor({ state: "visible" });
    const landscapeBox = await landscapeBanner.boundingBox();
    assert.ok(landscapeBox.y >= 0 && landscapeBox.y + landscapeBox.height <= 375);
    assert.equal(
      await landscape.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(landscape.errors, []);
    await landscape.context.close();

    console.log("RELEASE_CHANGELOG_SMOKE_OK");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
