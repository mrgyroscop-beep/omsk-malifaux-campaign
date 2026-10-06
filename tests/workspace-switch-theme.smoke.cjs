const assert = require("node:assert/strict");
const { mkdir, readFile } = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const artifacts = path.join(root, ".artifacts", "workspace-switch");

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  return "application/octet-stream";
}

function channelValue(value) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  const channels = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(channelValue);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

(async () => {
  await mkdir(artifacts, { recursive: true });
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
  const baseUrl = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
    headless: true,
  });

  try {
    for (const width of [1440, 448, 360, 195]) {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      await context.addInitScript(() => {
        localStorage.setItem("m4e-release-notes-seen-v1", "2026.10.06.1");
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ));

      const switchStyles = await page.locator(".workspace-switch button").evaluateAll((buttons) =>
        buttons.map((button) => {
          const style = getComputedStyle(button);
          const box = button.getBoundingClientRect();
          return {
            pressed: button.getAttribute("aria-pressed"),
            color: style.color,
            background: style.backgroundColor,
            appearance: style.appearance,
            box: { top: box.top, bottom: box.bottom, left: box.left, right: box.right },
          };
        }),
      );
      const navBox = await page.locator(".primary-nav").evaluate((element) => {
        const box = element.getBoundingClientRect();
        return {
          top: box.top,
          bottom: box.bottom,
          left: box.left,
          right: box.right,
          scrollLeft: element.scrollLeft,
        };
      });
      const activeNavBox = await page.locator(".nav-item.is-active").evaluate((element) => {
        const box = element.getBoundingClientRect();
        return { left: box.left, right: box.right };
      });
      const active = switchStyles.find((style) => style.pressed === "true");
      const inactive = switchStyles.find((style) => style.pressed === "false");

      assert.equal(active.appearance, "none");
      assert.ok(contrast(active.color, active.background) >= 4.5, `active contrast at ${width}px`);
      assert.ok(contrast(inactive.color, inactive.background) >= 4.5, `inactive contrast at ${width}px`);
      assert.ok(active.box.right <= navBox.left + 1, `switch and section tabs must share one row at ${width}px`);
      assert.ok(Math.abs(active.box.bottom - navBox.bottom) <= 2, `tabs must align at ${width}px`);
      assert.ok(activeNavBox.left >= navBox.left - 1, `the active section must start inside its rail at ${width}px`);
      if (width >= 360) {
        assert.ok(activeNavBox.right <= navBox.right + 1, `the active section must be fully visible at ${width}px`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      }
      assert.deepEqual(errors, []);
      await page.screenshot({ path: path.join(artifacts, `workspace-switch-${width}.png`) });
      await context.close();
    }
    assert.match(
      await pageAsset(root, "index.html"),
      /organizer\.css\?v=2/,
      "the themed switch stylesheet must be cache-busted",
    );
    console.log("WORKSPACE_SWITCH_THEME_SMOKE_OK");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function pageAsset(directory, file) {
  return readFile(path.join(directory, file), "utf8");
}
