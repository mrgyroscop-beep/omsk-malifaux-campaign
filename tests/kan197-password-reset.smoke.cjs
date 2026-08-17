const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";
const resetToken = "r".repeat(43);

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

async function startServer() {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://localhost").pathname;
      const relative = pathname === "/" ? "index.html" : pathname.slice(1);
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
  const source = await readFile(path.join(root, "index.html"), "utf8");
  assert.match(source, /<script src="app\.js\?v=39"><\/script>/u);
  assert.match(source, /<script src="account\.js\?v=3"><\/script>/u);
  const server = await startServer();
  const port = server.address().port;
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ locale: "ru-RU", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let requestedEmail = "";
  let confirmed = false;

  await page.route("**/api/auth/password-reset/request", async (route) => {
    const request = route.request();
    assert.equal(request.headers()["x-account-session"], undefined);
    requestedEmail = request.postDataJSON().email;
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.route("**/api/auth/password-reset/confirm", async (route) => {
    const request = route.request();
    assert.equal(request.headers()["x-account-session"], undefined);
    assert.deepEqual(request.postDataJSON(), {
      token: resetToken,
      password: "new secure campaign password",
    });
    confirmed = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  try {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxAccount));
    await page.locator("#openAccountButton").click();
    await page.locator('[data-account-mode="forgot"]').click();
    await page.locator('input[name="email"]').fill("captain@example.com");
    await page.locator("#accountAuthForm").evaluate((form) => form.requestSubmit());
    await page.waitForFunction(() => document.querySelector(".account-notice"));
    assert.equal(requestedEmail, "captain@example.com");
    assert.match(await page.locator(".account-notice").textContent(), /ссылка уже отправлена/u);

    await page.goto(`http://127.0.0.1:${port}/#reset/${resetToken}`, {
      waitUntil: "domcontentloaded",
    });
    await page.locator('form[data-account-form-mode="reset"]').waitFor();
    assert.equal(await page.locator("#accountDialog").evaluate((dialog) => dialog.open), true);
    assert.equal(new URL(page.url()).hash, "#dossier");
    assert.equal(page.url().includes(resetToken), false);
    if (process.env.KAN197_SCREENSHOT_PATH) {
      await page.screenshot({ path: process.env.KAN197_SCREENSHOT_PATH, fullPage: true });
    }
    await page.locator('input[name="password"]').fill("new secure campaign password");
    await page.locator('input[name="passwordConfirmation"]').fill("different password");
    await page.locator("#accountAuthForm").evaluate((form) => form.requestSubmit());
    await page.locator(".account-error").waitFor();
    assert.equal(confirmed, false);
    assert.match(await page.locator(".account-error").textContent(), /не совпадают/u);

    await page.locator('input[name="password"]').fill("new secure campaign password");
    await page.locator('input[name="passwordConfirmation"]').fill("new secure campaign password");
    await page.locator("#accountAuthForm").evaluate((form) => form.requestSubmit());
    await page.waitForFunction(() => document.querySelector(".account-notice"));
    assert.equal(confirmed, true);
    assert.match(await page.locator(".account-notice").textContent(), /Пароль обновлён/u);
    assert.equal(await page.locator(".account-panel").evaluate((panel) => panel.scrollWidth <= panel.clientWidth), true);
    assert.deepEqual(errors, []);
    console.log("KAN197_PASSWORD_RESET_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
