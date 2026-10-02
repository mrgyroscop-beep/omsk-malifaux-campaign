const assert = require("node:assert/strict");
const { mkdir, readFile } = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const artifacts = path.join(root, ".artifacts", "kan211-212");
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

function model(id, name, cost) {
  return {
    id,
    name,
    cost,
    type: "Minion",
    keywords: "Experimental",
    modelLimit: 2,
    injuries: [],
  };
}

(async () => {
  await mkdir(artifacts, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 1280, height: 900 },
  });
  await context.addInitScript(() => {
    localStorage.setItem("m4e-untold-locale", "ru");
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate(
      ({ traitor, first, second }) => {
        const state = window.MalifauxBuilder.getState();
        state.arsenal.models = [traitor, first, second];
        state.arsenal.equipment = [
          {
            id: "traitor-equipment",
            name: "Test Equipment",
            br: "5",
            cc: 1,
          },
        ];
        state.loadout.hiredModelIds = [traitor.id, first.id, second.id];
        state.loadout.assignments = [
          {
            equipmentId: "traitor-equipment",
            targetKind: "model",
            targetId: traitor.id,
          },
        ];
        window.MalifauxBuilder.replaceState(state);
      },
      {
        traitor: model("traitor-target", "Future Traitor", 7),
        first: model("active-model-one", "Active Model One", 5),
        second: model("active-model-two", "Active Model Two", 6),
      },
    );
    await page.locator('[data-route="arsenal"]').click();

    assert.equal(await page.locator("#arsenalCost").textContent(), "18");
    assert.equal(await page.locator("#modelCount").textContent(), "3");

    await page.locator('[data-add-injury-model="traitor-target"]').click();
    await page.locator("#injuryDialog").waitFor({ state: "visible" });
    await page.locator('[data-select-injury="injury-01"]').click();
    await page.locator("#injuryDialog").waitFor({ state: "hidden" });

    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    const traitor = state.arsenal.models.find((entry) => entry.id === "traitor-target");
    assert.equal(traitor.injuries[0].catalogId, "injury-01");
    assert.deepEqual(state.loadout.hiredModelIds, ["active-model-one", "active-model-two"]);
    assert.equal(state.loadout.assignments.length, 0);
    assert.equal(await page.locator("#arsenalCost").textContent(), "11");
    assert.equal(await page.locator("#modelCount").textContent(), "2");

    const archivedRow = page.locator(".model-row.is-annihilated");
    assert.equal(await archivedRow.count(), 1);
    assert.match(await archivedRow.locator(".model-badge").textContent(), /Аннигилирована/u);
    assert.equal(await archivedRow.locator("[data-toggle-hired-model]").count(), 0);
    assert.match(await page.locator("#toastRegion").textContent(), /исключена из стоимости Арсенала/u);
    await archivedRow.screenshot({ path: path.join(artifacts, "traitor-archive-row.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      "The annihilated model state introduced horizontal overflow on mobile.",
    );
    await archivedRow.screenshot({ path: path.join(artifacts, "traitor-archive-row-mobile.png") });
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    assert.equal(await page.locator("#arsenalCost").textContent(), "11");
    assert.equal(await page.locator("#modelCount").textContent(), "2");
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(
      state.arsenal.models.find((entry) => entry.id === "traitor-target").injuries[0].name,
      "Traitor",
    );

    await page.evaluate(() => window.renderPrintDossier());
    const printedCards = page.locator("[data-print-model-card]");
    assert.equal(await printedCards.count(), 2);
    assert.equal(await page.locator('[data-print-model-card="traitor-target"]').count(), 0);
    const summary = page.locator(".print-arsenal-page .print-summary span");
    assert.equal(await summary.nth(0).locator("b").textContent(), "2");
    assert.equal(await summary.nth(1).locator("b").textContent(), "11");

    await page.emulateMedia({ media: "print" });
    const breaks = await printedCards.evaluateAll((cards) =>
      cards.map((card) => ({
        breakBefore: getComputedStyle(card).breakBefore,
        pageBreakBefore: getComputedStyle(card).pageBreakBefore,
        breakInside: getComputedStyle(card).breakInside,
      })),
    );
    assert.doesNotMatch(`${breaks[0].breakBefore} ${breaks[0].pageBreakBefore}`, /page|always/u);
    assert.match(`${breaks[1].breakBefore} ${breaks[1].pageBreakBefore}`, /page|always/u);
    assert.match(breaks[0].breakInside, /avoid/u);
    await page.pdf({
      path: path.join(artifacts, "models-on-separate-pages.pdf"),
      format: "A4",
      printBackground: true,
    });

    assert.deepEqual(errors, []);
    console.log("KAN211_212_FEEDBACK_SMOKE_OK");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
