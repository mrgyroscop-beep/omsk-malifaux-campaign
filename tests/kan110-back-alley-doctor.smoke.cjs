const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const appPath = process.env.APP_PATH || path.resolve(__dirname, "..", "index.html");
const appUrl = /^[a-z][a-z0-9+.-]*:/iu.test(appPath) ? appPath : pathToFileURL(appPath).href;
const browserChannel = process.env.BROWSER_CHANNEL || "msedge";
const screenshotDir = process.env.KAN110_SCREENSHOT_DIR || "";

const fixture = {
  version: 6,
  crew: {
    name: "Night Clinic",
    player: "Smoke Test",
    faction: "Guild",
    keywords: ["Marshal", "Witch Hunter"],
  },
  campaign: { length: 8, week: 3, meetingDay: "", ratingAdjustment: 0 },
  leader: {
    name: "Clinic Leader",
    archetype: "",
    characteristics: ["Living", ""],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [],
    crewCard: "",
    xp: 0,
    advances: [],
    manualUpgrades: [],
    injuries: [],
    luckyMissUpgrades: [],
    totem: null,
  },
  arsenal: {
    models: [{
      id: "model-patient",
      name: "Patient Zero",
      cost: 8,
      type: "Minion",
      henchman: false,
      keywords: "Marshal",
      versatile: false,
      outOfKeyword: false,
      modelLimit: 1,
      characteristics: [],
      injuries: [
        { id: "injury-a", name: "Severe Amputation", effect: "Health -2", flip: "3 R/M", week: 1 },
        { id: "injury-b", name: "Senseless", effect: "Discard or Slow", flip: "7 R/M", week: 2 },
        { id: "injury-c", name: "Off Balance", effect: "Penalty", flip: "7 C/T", week: 3 },
        { id: "injury-d", name: "Brittle Bones", effect: "Attacker gains +", flip: "11 C/T", week: 3 },
      ],
      luckyMissUpgrades: [],
      addedWeek: 1,
      scripPaid: 0,
    }],
    equipment: [],
    equipmentScripSpent: 0,
    scrip: 5,
    scripTransactions: [],
  },
  loadout: { hiredModelIds: ["model-patient"], assignments: [] },
  games: [],
};

async function openDoctor(page) {
  await page.locator("#openDoctorButton").click();
  await page.locator("#doctorDialog").waitFor({ state: "visible" });
}

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ locale: "ru-RU", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(appUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    await page.evaluate((state) => window.MalifauxBuilder.replaceState(state), fixture);
    await page.locator('[data-route="arsenal"]').click();

    await openDoctor(page);
    await page.locator('#doctorDialog [data-close-dialog="doctorDialog"]').last().click();
    assert.equal((await page.evaluate(() => window.MalifauxBuilder.getState())).arsenal.scrip, 5);

    await openDoctor(page);
    await page.locator('#doctorForm select[name="injury"]').selectOption("injury-a");
    await page.locator('#doctorForm select[name="mainCard"]').selectOption("black-joker");
    await page.locator('#doctorForm select[name="secondaryInjury"]').selectOption("injury-10");
    await page.locator('#doctorForm input[name="secondaryCheated"]').check();
    await page.locator("#doctorSubmit").click();
    await page.waitForFunction(() => window.MalifauxBuilder.getState().arsenal.scrip === 4);
    let state = await page.evaluate(() => window.MalifauxBuilder.getState());
    let patient = state.arsenal.models[0];
    assert.equal(patient.injuries.some((injury) => injury.id === "injury-a"), true);
    assert.equal(patient.injuries.some((injury) => injury.name === "Leadfooted"), true);
    assert.equal(state.arsenal.scripTransactions[0].doctorVisit.secondary.cheated, true);

    await openDoctor(page);
    await page.locator('#doctorForm select[name="injury"]').selectOption("injury-b");
    await page.locator('#doctorForm select[name="mainCard"]').selectOption("red-joker");
    await page.locator('#doctorForm input[name="mainCheated"]').check();
    assert.equal(await page.locator("#doctorSecondary").isHidden(), true);
    assert.equal(await page.locator("#doctorSubmit").isDisabled(), false);
    await page.locator("#doctorSubmit").click();
    await page.waitForFunction(() => window.MalifauxBuilder.getState().arsenal.scrip === 3);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    patient = state.arsenal.models[0];
    assert.equal(patient.injuries.some((injury) => injury.id === "injury-b"), false);
    assert.equal(state.arsenal.scripTransactions[1].doctorVisit.main.cheated, true);
    assert.equal(state.arsenal.scripTransactions[1].doctorVisit.secondary, null);

    await openDoctor(page);
    await page.locator('#doctorForm select[name="injury"]').selectOption("injury-c");
    await page.locator('#doctorForm select[name="mainCard"]').selectOption("red-joker");
    await page.locator('#doctorForm select[name="secondaryLucky"]').selectOption("lucky-miss-06");
    await page.locator('#doctorForm input[name="secondaryCheated"]').check();

    if (screenshotDir) {
      fs.mkdirSync(screenshotDir, { recursive: true });
      await page.locator("#doctorDialog").screenshot({
        path: path.join(screenshotDir, "KAN-110-back-alley-doctor.png"),
      });
    }

    await page.locator("#doctorSubmit").click();
    await page.waitForFunction(() => window.MalifauxBuilder.getState().arsenal.scrip === 2);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    patient = state.arsenal.models[0];
    assert.equal(patient.injuries.some((injury) => injury.id === "injury-c"), false);
    assert.equal(patient.luckyMissUpgrades.length, 1);
    assert.equal(patient.luckyMissUpgrades[0].name, "Hydraulic Limb");
    assert.equal(patient.luckyMissUpgrades[0].cheated, true);
    assert.equal(state.arsenal.scripTransactions.length, 3);
    assert.match(await page.locator("#doctorHistory").textContent(), /Hydraulic Limb/u);
    assert.match(await page.locator("#modelList").textContent(), /Lucky Miss.*Hydraulic Limb/su);

    await openDoctor(page);
    await page.locator('#doctorForm select[name="injury"]').selectOption("injury-d");
    await page.locator('#doctorForm select[name="mainCard"]').selectOption("10");
    await page.locator("#doctorSubmit").click();
    await page.waitForFunction(() => window.MalifauxBuilder.getState().arsenal.scrip === 1);
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    patient = state.arsenal.models[0];
    assert.equal(patient.injuries.some((injury) => injury.id === "injury-d"), false);
    assert.equal(patient.characteristics.includes("Undead"), true);
    assert.equal(state.arsenal.scripTransactions.length, 4);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.MalifauxBuilder));
    state = await page.evaluate(() => window.MalifauxBuilder.getState());
    assert.equal(state.arsenal.scrip, 1);
    assert.equal(state.arsenal.models[0].luckyMissUpgrades[0].name, "Hydraulic Limb");
    assert.equal(state.arsenal.scripTransactions[2].doctorVisit.secondary.resultName, "Hydraulic Limb");
    assert.equal(state.arsenal.models[0].characteristics.includes("Undead"), true);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.locator('[data-route="arsenal"]').click();
    await openDoctor(page);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      false,
      "Doctor controls introduced horizontal overflow on mobile.",
    );
    assert.equal(
      await page.locator("#doctorDialog").evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth),
      false,
      "Doctor receipt overflows its mobile dialog.",
    );
    assert.deepEqual(pageErrors, []);
    console.log("KAN110_BACK_ALLEY_DOCTOR_SMOKE_OK");
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
