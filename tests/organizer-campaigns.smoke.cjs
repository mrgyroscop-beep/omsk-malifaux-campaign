const assert = require("node:assert/strict");
const { readFile, mkdir } = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");

(async () => {
  const { FakeD1, registerUser, jsonRequest } = await import("../worker/test/test-db.js");
  const { handleAccountCampaignRequest } = await import("../worker/src/account-campaigns.js");
  const { handleOrganizerCampaignRequest } = await import("../worker/src/organizer-campaigns.js");
  const { default: worker } = await import("../worker/src/index.js");
  const env = { DB: new FakeD1() };
  const organizer = await registerUser(env, "organizer-smoke@example.com");
  const player = await registerUser(env, "player-smoke@example.com");
  const third = await registerUser(env, "third-smoke@example.com");
  const createArsenal = async (token, name, leader) => {
    const response = await handleAccountCampaignRequest(jsonRequest("http://test/api/account/campaign", "PUT", {
      revision: 0, name, dossier: { version: 5, crew: { name, player: leader, faction: "Guild", keywords: ["Marshal", "Frontier"] },
        campaign: { week: 2, length: 8 }, leader: { name: leader, archetype: "generalist", xp: 3, talents: [], advances: [] },
        arsenal: { models: [{ id: "guard001", name: "Death Marshal", type: "Minion", cost: 5, injuries: [] }], equipment: [], scrip: 7 }, games: [] },
    }, token), env);
    assert.ok(response.ok);
    return (await response.json()).campaign;
  };
  await createArsenal(player.token, "Стражи старого моста", "Мария");
  await createArsenal(third.token, "Шахтёры Нижнего города", "Илья");
  let slowMember = "", slowResponse = null, origin = "";
  let accountWrites = 0;
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, origin);
      if (url.pathname.startsWith("/api/")) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = Buffer.concat(chunks);
        if (url.pathname === "/api/account/campaign" && req.method === "PUT") accountWrites++;
        const response = await worker.fetch(new Request(url, { method: req.method, headers: { ...req.headers, origin }, ...(body.length ? { body } : {}) }), env);
        const send = async () => { res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer())); };
        if (slowMember && url.pathname.includes(`/members/${slowMember}/arsenal`)) { slowResponse = send; return; }
        await send(); return;
      }
      const file = path.resolve(root, "." + (url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname)));
      if (!file.startsWith(root + path.sep)) throw new Error("outside root");
      let content = await readFile(file);
      if (file.endsWith("index.html")) content = Buffer.from(content.toString().replaceAll("https://omsk-malifaux-campaign-chat.mrgyroscop.workers.dev", origin));
      res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" }); res.end(content);
    } catch (error) { res.writeHead(500).end(String(error)); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  env.ALLOWED_ORIGINS = origin;
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, locale: "ru-RU" });
  const errors = [];
  await context.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.addInitScript(({ token }) => {
    sessionStorage.setItem("m4e-account-session-v1", JSON.stringify({ token, expiresAt: "2099-01-01T00:00:00Z" }));
  }, { token: organizer.token });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const click = (name, id) => page.locator(`[data-org-action="${name}"]${id ? `[data-id="${id}"]` : ""}`).first().click();
  try {
    await page.goto(origin);
    await page.waitForFunction(() => window.MalifauxAccount?.getUser() && window.MalifauxAccount.getSyncStatus() === "synced");
    await page.locator('[data-bind="crew.name"]').fill("Мой независимый арсенал");
    await page.locator('[data-bind="crew.player"]').fill("Организатор");
    await page.locator('[data-workspace="organizer"]').click();
    await page.locator('[data-org-form="create"] input[name="name"]').fill("Тени над Малифо");
    await page.locator('[data-org-form="create"] button').click();
    await page.waitForFunction(() => document.querySelector(".org-heading h1")?.textContent === "Тени над Малифо");
    const groupId = new URL(page.url()).searchParams.get("group");
    assert.ok(groupId);
    const group = await (await handleOrganizerCampaignRequest(jsonRequest(`http://test/api/organizer-campaigns/${groupId}`, "GET", undefined, organizer.token), env)).json();
    assert.equal(group.members.length, 0, "Creating a group must not enroll its organizer");
    for (const p of [player, third]) {
      const joined = await handleOrganizerCampaignRequest(jsonRequest(`http://test/api/organizer-campaigns/${groupId}/join`, "POST", { inviteToken: group.inviteToken }, p.token), env);
      assert.equal(joined.status, 201);
    }
    await click("refresh");
    await page.waitForFunction(() => document.querySelectorAll(".org-member").length === 2);
    await click("join");
    await page.waitForFunction(() => document.querySelectorAll(".org-member").length === 3);
    await page.waitForFunction(() => window.MalifauxAccount.getSyncStatus() === "synced");
    const before = await page.evaluate(() => ({ state: window.MalifauxBuilder.getState(), stored: localStorage.getItem("m4e-untold-campaign-v1") }));
    const writesBefore = accountWrites;
    const members = await page.locator('[data-org-action="member"]').evaluateAll((els) => els.map((el) => ({ id: el.dataset.id, text: el.textContent })));
    const maria = members.find((m) => m.text.includes("Мария")), ilya = members.find((m) => m.text.includes("Илья"));
    await click("member", maria.id);
    await page.waitForSelector("#orgReader .print-arsenal-page");
    assert.match(await page.locator("#orgReader").innerText(), /Стражи старого моста/);
    await click("tab", "leader");
    assert.equal(await page.locator("#orgReader .print-arsenal-page").isVisible(), false);
    slowMember = maria.id;
    await click("refresh-member");
    await page.waitForFunction(() => document.querySelector(".org-viewer")?.textContent.includes("Загружаю"));
    await click("member", ilya.id);
    await page.waitForFunction(() => document.querySelector("#orgReader")?.textContent.includes("Шахтёры Нижнего города"));
    assert.equal(await page.locator('[data-org-action="tab"][data-id="leader"]').getAttribute("aria-pressed"), "true");
    assert.ok(slowResponse, "Delayed response should be pending");
    await slowResponse(); slowMember = "";
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.match(await page.locator("#orgReader").textContent(), /Шахтёры Нижнего города/);
    assert.deepEqual(await page.evaluate(() => window.MalifauxBuilder.getState()), before.state);
    assert.equal(await page.evaluate(() => localStorage.getItem("m4e-untold-campaign-v1")), before.stored);
    assert.equal(accountWrites, writesBefore, "Viewing arsenals must not save them to the organizer's account");
    assert.equal(await page.locator("#orgReader input, #orgReader button, #orgReader textarea").count(), 0);
    await click("tab", "arsenal");
    await page.locator("#route-organizer").evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
    await mkdir(path.join(root, ".artifacts", "organizer"), { recursive: true });
    await page.screenshot({ path: path.join(root, ".artifacts", "organizer", "desktop.png"), fullPage: true });
    await page.reload();
    await page.waitForFunction(() => document.querySelector("#orgReader")?.textContent.includes("Шахтёры Нижнего города"));
    assert.equal(await page.locator(".org-member").count(), 3);
    await page.locator('.org-panel > summary').first().click();
    await page.locator('[data-org-form="settings"] input[name="week"]').fill("3");
    await page.locator('[data-org-form="settings"] textarea[name="notes"]').fill("Играем по пятницам");
    await page.locator('[data-org-form="settings"] button').click();
    await page.waitForFunction(() => document.querySelector('.org-notes')?.textContent === "Играем по пятницам");
    assert.equal(await page.evaluate(() => window.MalifauxBuilder.getState().campaign.week), before.state.campaign.week);
    await page.locator('[data-org-form="event"] input[name="title"]').fill("Кампания началась");
    await page.locator('[data-org-form="event"] textarea[name="details"]').fill("Участники собрались у старого моста.");
    await page.locator('[data-org-form="event"] button').click();
    await page.waitForSelector(".org-events li");
    assert.match(await page.locator('.org-events').textContent(), /Кампания началась/);
    await page.locator('.org-panel > summary').first().click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#route-organizer").evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
    await page.screenshot({ path: path.join(root, ".artifacts", "organizer", "mobile.png"), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Mobile should not overflow horizontally");
    await page.locator('[data-locale="en"]').click();
    assert.equal(await page.locator('[data-org-action="tab"][data-id="arsenal"]').innerText(), "Arsenal");
    await page.locator('[data-workspace="arsenal"]').click();
    assert.equal(await page.locator('[data-bind="crew.name"]').inputValue(), "Мой независимый арсенал");

    // Exercise invitation acceptance and revocation through the actual player UI.
    const invited = await registerUser(env, "invited-smoke@example.com");
    const invitedArsenal = await createArsenal(invited.token, "Приглашённая команда", "Анна");
    const playerContext = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ru-RU" });
    await playerContext.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await playerContext.addInitScript(({ token }) => sessionStorage.setItem("m4e-account-session-v1", JSON.stringify({ token, expiresAt: "2099-01-01T00:00:00Z" })), { token: invited.token });
    const playerPage = await playerContext.newPage();
    playerPage.on("pageerror", (e) => errors.push(e.message));
    await playerPage.goto(`${origin}/?group=${groupId}&invite=${group.inviteToken}#organizer`);
    await playerPage.waitForFunction(() => window.MalifauxAccount?.getSyncStatus() === "synced");
    assert.equal(await playerPage.locator('.org-invitation').count(), 1);
    await playerPage.locator('[data-org-action="join"]').click();
    await playerPage.waitForSelector('.org-own-stamp');
    assert.equal(await playerPage.locator('[data-org-action="delete-group"]').count(), 0);
    assert.equal(await playerPage.locator('.org-member').count(), 4);
    assert.equal(new URL(playerPage.url()).searchParams.has("invite"), false);
    playerPage.on("dialog", (dialog) => dialog.accept());
    await playerPage.locator('[data-org-action="leave"]').click();
    await playerPage.waitForSelector('[data-org-form="create"]');
    assert.ok(env.DB.database.prepare("SELECT id FROM campaigns WHERE id = ?").get(invitedArsenal.id));
    assert.equal(env.DB.database.prepare("SELECT count(*) AS n FROM organizer_members WHERE arsenal_id = ?").get(invitedArsenal.id).n, 0);
    await playerContext.close();
    assert.deepEqual(errors, []);
    console.log("Organizer browser smoke passed: real API, independent campaign, self-join, private participants, race, read-only state, reload, mobile, EN.");
  } finally { await browser.close(); server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
