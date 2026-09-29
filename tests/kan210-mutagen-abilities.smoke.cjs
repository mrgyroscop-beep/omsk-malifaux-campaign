const assert = require("node:assert/strict");
const { mkdir, readFile } = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const artifacts = path.join(root, ".artifacts", "kan210");
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
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
  await mkdir(artifacts, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate(() => {
      const state = window.MalifauxBuilder.getState();
      state.campaign.week = 4;
      state.arsenal.models = [
        {
          id: "kan210-model",
          name: "Mutagen Test Subject",
          cost: 7,
          type: "Minion",
          keywords: "Experimental",
          injuries: [],
          luckyMissUpgrades: [],
          mutagenAbilities: [],
        },
      ];
      state.loadout.hiredModelIds = ["kan210-model"];
      window.MalifauxBuilder.replaceState(state);
    });
    await page.locator('[data-route="arsenal"]').click();

    const addButton = page.locator('[data-add-mutagen-ability-model="kan210-model"]');
    await addButton.click();
    const dialog = page.locator("#mutagenAbilityDialog");
    await dialog.waitFor({ state: "visible" });
    await page.locator("#mutagenAbilityFlip").selectOption("6");
    assert.equal(await page.locator("#mutagenAbilityChoice option").count(), 15);
    await page.locator("#mutagenAbilityChoice").selectOption("ability-flight");
    await dialog.screenshot({ path: path.join(artifacts, "mutagen-dialog-mobile.png") });
    await page.locator("#mutagenAbilitySubmit").click();
    await dialog.waitFor({ state: "hidden" });

    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models[0].mutagenAbilities.length, 1);
    assert.equal(state.arsenal.models[0].mutagenAbilities[0].name, "Flight");
    assert.equal(state.arsenal.models[0].mutagenAbilities[0].flip, "6");
    assert.match(await page.locator(".model-row").innerText(), /Mutagen · Flight/u);
    assert.match(await page.locator("#activeLoadoutSummary").innerText(), /Flight/u);

    await page.reload({ waitUntil: "domcontentloaded" });
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models[0].mutagenAbilities[0].catalogId, "ability-flight");
    assert.equal(await page.locator('[data-remove-mutagen-ability]').count(), 1);

    await addButton.click();
    await page.locator("#mutagenAbilityFlip").selectOption("6");
    assert.equal(
      await page.locator('#mutagenAbilityChoice option[value="ability-flight"]').evaluate((option) => option.disabled),
      true,
    );
    await dialog.locator('.modal-close[data-close-dialog="mutagenAbilityDialog"]').click();

    await addButton.click();
    await page.locator("#mutagenAbilityFlip").selectOption("black-joker");
    await page.locator('#mutagenAbilityManualFields input[name="manualName"]').fill("Borrowed Mutation");
    await page.locator('#mutagenAbilityManualFields textarea[name="manualEffect"]').fill("Custom natural Joker effect.");
    await page.locator("#mutagenAbilitySubmit").click();
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models[0].mutagenAbilities.length, 2);
    assert.equal(state.arsenal.models[0].mutagenAbilities[1].name, "Borrowed Mutation");

    await page.evaluate(() => window.renderPrintDossier());
    const printed = page.locator('[data-print-section="mutagen-abilities"]');
    assert.match(await printed.innerText(), /Flight/u);
    assert.match(await printed.innerText(), /Borrowed Mutation/u);

    page.once("dialog", (confirmation) => confirmation.accept());
    await page.locator('[data-remove-mutagen-ability]').first().click();
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.models[0].mutagenAbilities.length, 1);

    await page.evaluate(() => {
      const state = window.MalifauxBuilder.getState();
      state.arsenal.models[0].mutagenAbilities.push({
        id: "forged-mutagen",
        name: "Forged Numeric Ability",
        flip: "6",
      });
      state.arsenal.models[0].mutagenAbilities.push({
        id: "forged-too-high",
        catalogId: "ability-flight",
        name: "Flight",
        flip: "1",
      });
      window.MalifauxBuilder.replaceState(state);
    });
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(
      state.arsenal.models[0].mutagenAbilities.some((ability) => ability.name === "Forged Numeric Ability"),
      false,
    );
    assert.equal(
      state.arsenal.models[0].mutagenAbilities.some((ability) => ability.id === "forged-too-high"),
      false,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      "Mutagen controls must not overflow on mobile.",
    );
    assert.deepEqual(errors, []);
    console.log("KAN210_MUTAGEN_ABILITIES_SMOKE_OK");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
