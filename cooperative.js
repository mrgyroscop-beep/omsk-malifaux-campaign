(function () {
  "use strict";

  const STORAGE_KEY = "m4e-cooperative-campaign-v1";
  const archetypes = {
    "Lucky Upstart": "6 / 6 / 6 / 14",
    Generalist: "5 / 5 / 6 / 14",
    "Heavy Hitter": "6 / 4 / 6 / 14",
    Schemer: "6 / 5 / 7 / 13",
    "Talented Individual": "5 / 5 / 5 / 13",
  };

  const scenarios = [
    { id: "intro", n: "00", name: "Just Another Day in the Neighborhood", next: "smash", weekEnd: true, fields: [["strategy", "Strategy на столе", "number"], ["firepower", "Все Firepower убиты", "check"], ["elite", "Elite убит", "check"], ["scrip", "Скрип, полученный в игре", "number"]] },
    { id: "smash", n: "01", name: "Smash and Grab", next: "mine", fields: [["elites", "Убитые Elite", "number"], ["loot", "Модели, сбежавшие с Loot", "number"], ["boss", "Boss убит", "check"], ["extraInjury", "Дополнительная модель для Injury Flip", "text"]] },
    { id: "mine", n: "02", name: "The Empty Mine", next: "soulstone", fields: [["savedCost", "Стоимость спасённых моделей", "number"], ["removed", "Удалённые Strategy", "number"], ["remaining", "Оставшиеся Strategy", "number"]] },
    { id: "soulstone", n: "03", name: "Snatch the Soulstone", next: "train", weekEnd: true, fields: [["sentry", "Число Sentry", "number"], ["lootHealth", "Здоровье носителя Loot", "number"], ["fullHealth", "Полное здоровье", "check"], ["challenge", "Challenge выполнен", "check"]] },
    { id: "train", n: "04", name: "Train Heist", next: "bargain", fields: [["emptyCars", "Пустые вагоны", "number"], ["loot", "Loot в дружественной зоне", "number"], ["boss", "Boss убит", "check"], ["killer", "Лидер, убивший Boss", "text"]] },
    { id: "bargain", n: "05A", name: "A Reasonable Bargain", branches: [{ value: "deal", label: "Заключить сделку", next: "infiltration" }, { value: "overthrow", label: "Свергнуть Lieutenant", next: "overthrow" }], fields: [["overthrow", "Overthrow", "number"], ["hands", "Карты в руках", "number"], ["bribes", "Сумма Bribes", "number"], ["strategy", "Оставшиеся Strategy", "number"]] },
    { id: "overthrow", n: "05B", name: "Overthrow", next: "bounty", fields: [["lieutenantHealth", "Здоровье Lieutenant", "number"], ["elites", "Убитые Elite и Support", "number"], ["position", "Положение Lieutenant при убийстве Boss", "text"]] },
    { id: "infiltration", n: "06", name: "Infiltration", next: "jailbreak", weekEnd: true, fields: [["suspicion", "Suspicion", "number"], ["vp", "VP", "number"], ["idle", "NP-модели с Idle", "number"]] },
    { id: "bounty", n: "07", name: "Bounty Hunt", next: "jailbreak", weekEnd: true, fields: [["remains", "Remains у Strategy", "number"], ["brawler", "Brawler на Crew Card", "check"], ["bossPosition", "Положение Boss", "text"]] },
    { id: "jailbreak", n: "08", name: "Jailbreak", next: "call", fields: [["obstructor", "Obstructor на столе", "check"], ["prisonerHealth", "Здоровье Prisoner", "number"], ["prisonerFate", "Судьба Prisoner", "text"], ["rescuer", "Освободивший лидер", "text"]] },
    { id: "call", n: "09", name: "Call for Help", next: "last", fields: [["dead", "Погибшие модели", "number"], ["remains", "Remains у центра", "number"], ["killer", "Лидер, убивший Boss", "text"]] },
    { id: "last", n: "10", name: "Last Stand", next: "workshop", weekEnd: true, fields: [["dead", "Погибшие модели", "number"], ["wards", "Оставшиеся Makeshift Wards", "number"], ["boss", "Boss убит", "check"]] },
    { id: "workshop", n: "11", name: "Crack the Workshop Door", next: "ritual", fields: [["escaped", "Сбежавшие модели", "number"], ["turn", "Ход завершения", "number"]] },
    { id: "ritual", n: "12", name: "Disrupt the Ritual", next: "pillars", fields: [["scheme", "Enemy Scheme", "text"], ["clues", "Найденные Clues", "number"], ["phase", "Способ перехода фазы", "text"]] },
    { id: "pillars", n: "13", name: "Pillars of Power", next: null, fields: [["pillars", "Убитые Pillars", "number"], ["wounded", "Погибшие / ≤ половины здоровья", "number"], ["leaders", "Живые лидеры", "number"]] },
  ];
  const scenarioMap = Object.fromEntries(scenarios.map((item) => [item.id, item]));
  const phases = ["Draw Aftermath Hand", "Payday", "Barter", "Advance Leader", "Back-Alley Doctor", "Determine Injuries"];

  const freshPlayer = (index = 0) => ({
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    name: `Игрок ${index + 1}`,
    leader: "",
    faction: "",
    keywords: "",
    archetype: "Generalist",
    advances: 0,
    scrip: 0,
    xp: 0,
    miraculousRecovery: true,
    arsenal: [],
  });

  const freshState = () => ({
    version: 1,
    active: "hq",
    campaign: { name: "Новая кооперативная кампания", week: 1, scenario: "intro", losses: 0, status: "active" },
    settings: { challenge: false, threads: false, threadCount: 3, equipment: false, fateDeck: "physical" },
    players: [freshPlayer(0)],
    run: { status: "setup", outcome: "", tracker: {}, crews: {}, notes: "", branch: "deal", attempt: 1 },
    aftermath: null,
    history: [],
  });

  let state = load();
  let locale = "ru";

  function normalize(raw) {
    const base = freshState();
    if (!raw || typeof raw !== "object") return base;
    const next = { ...base, ...raw };
    next.campaign = { ...base.campaign, ...(raw.campaign || {}) };
    next.settings = { ...base.settings, ...(raw.settings || {}) };
    next.run = { ...base.run, ...(raw.run || {}) };
    next.players = Array.isArray(raw.players) && raw.players.length
      ? raw.players.slice(0, 3).map((p, i) => ({ ...freshPlayer(i), ...p, arsenal: Array.isArray(p.arsenal) ? p.arsenal : [] }))
      : base.players;
    next.history = Array.isArray(raw.history) ? raw.history : [];
    return next;
  }

  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch { return freshState(); }
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function scenario() { return scenarioMap[state.campaign.scenario] || scenarios[0]; }
  function leaderCost(player) { return player.advances >= 7 ? 10 : player.advances >= 4 ? 8 : 6; }
  function rating(player) {
    const crew = state.run.crews[player.id] || {};
    const selected = Array.isArray(crew.models) ? crew.models : [];
    return selected.reduce((sum, id) => {
      const model = player.arsenal.find((item) => item.id === id);
      return sum + (model?.equipment || 0) - (model?.injuries || 0);
    }, player.advances || 0);
  }
  function timestamp() {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
  }
  function notify(text) {
    const region = document.querySelector("#toastRegion");
    if (!region) return;
    const node = document.createElement("div"); node.className = "toast"; node.textContent = text; region.append(node);
    setTimeout(() => node.remove(), 2800);
  }

  function hqView() {
    const s = scenario();
    const completed = state.history.length;
    return `
      <div class="coop-hero">
        <div><p class="coop-overline">COOPERATIVE OPERATIONS / LOCAL DOSSIER</p><h1 id="cooperativeTitle">${esc(state.campaign.name)}</h1><p>Одна кампания, отдельные лидеры и арсеналы. Все решения сохраняются на этом устройстве.</p></div>
        <div class="coop-scenario-seal"><small>Текущий приказ</small><b>${s.n}</b><span>${esc(s.name)}</span></div>
      </div>
      <div class="coop-kpis">
        <article><small>Участники</small><b>${state.players.length}<i>/3</i></b><span>локальных профиля</span></article>
        <article><small>Неделя</small><b>${state.campaign.week}</b><span>${s.weekEnd ? "рубеж недели" : "операция продолжается"}</span></article>
        <article><small>Завершено</small><b>${completed}</b><span>записей в журнале</span></article>
        <article class="${state.settings.threads ? "is-lit" : ""}"><small>Threads of Fate</small><b>${state.settings.threads ? state.settings.threadCount : "—"}</b><span>${state.settings.threads ? "общий резерв" : "правило выключено"}</span></article>
      </div>
      <div class="coop-grid coop-grid-hq">
        <article class="coop-card">
          <header><span>01 / Паспорт</span><h2>Параметры кампании</h2></header>
          <div class="coop-form-grid">
            <label class="coop-field wide"><span>Название</span><input data-coop-path="campaign.name" value="${esc(state.campaign.name)}"></label>
            <label class="coop-field"><span>Стартовый сценарий</span><select data-coop-action="scenario-select">${scenarios.map(x => `<option value="${x.id}" ${x.id === s.id ? "selected" : ""}>${x.n} · ${esc(x.name)}</option>`).join("")}</select></label>
            <label class="coop-field"><span>Режим Fate Deck</span><select data-coop-path="settings.fateDeck"><option value="physical" ${state.settings.fateDeck === "physical" ? "selected" : ""}>Физическая · ручной ввод</option><option value="digital" ${state.settings.fateDeck === "digital" ? "selected" : ""}>Цифровая колода</option></select></label>
          </div>
          <div class="coop-toggles">
            ${toggle("settings.challenge", "Challenge Mode", "Условия сложности и отдельные награды")}
            ${toggle("settings.threads", "Threads of Fate", "Поражение расходует общую нить")}
            ${toggle("settings.equipment", "Cooperative Equipment", "Общие правила снаряжения")}
          </div>
          ${state.settings.threads ? `<label class="coop-thread-count"><span>Начальный резерв нитей</span><input type="number" min="0" max="9" data-coop-path="settings.threadCount" value="${state.settings.threadCount}"></label>` : ""}
        </article>
        <article class="coop-card coop-map-card">
          <header><span>02 / Маршрут</span><h2>Цепочка операций</h2></header>
          <div class="coop-route-map">${scenarios.map(x => `<button type="button" data-coop-scenario="${x.id}" class="${x.id === s.id ? "is-current" : ""} ${state.history.some(h => h.scenarioId === x.id) ? "is-done" : ""}"><small>${x.n}</small><span>${esc(x.name)}</span></button>`).join("")}</div>
          <p class="coop-caption">Развилка после A Reasonable Bargain фиксируется в трекере сценария. Переход выполняется только после подтверждения всего Aftermath.</p>
        </article>
      </div>`;
  }

  function toggle(path, title, note) {
    const value = path.split(".").reduce((v, k) => v[k], state);
    return `<label class="coop-toggle"><input type="checkbox" data-coop-path="${path}" ${value ? "checked" : ""}><span><b>${title}</b><small>${note}</small></span></label>`;
  }

  function playersView() {
    return `<div class="coop-section-heading"><div><p class="coop-overline">ПЕРСОНАЛЬНЫЕ ДОСЬЕ</p><h1>Лидеры и арсеналы</h1><p>Каждый профиль хранит собственную экономику, опыт и модели.</p></div>${state.players.length < 3 ? `<button class="coop-button" data-coop-action="add-player">+ Добавить игрока</button>` : ""}</div>
      <div class="coop-player-list">${state.players.map((p, i) => playerCard(p, i)).join("")}</div>`;
  }

  function playerCard(p, index) {
    const total = p.arsenal.reduce((sum, m) => sum + Number(m.cost || 0), 0);
    const remainder = Math.max(0, 25 - total);
    return `<article class="coop-player coop-card" data-player-id="${p.id}">
      <header class="coop-player-head"><div><span>Профиль ${String(index + 1).padStart(2, "0")}</span><h2>${esc(p.name)}</h2></div><div class="coop-player-money"><b>${p.scrip}</b><small>скрип</small></div>${state.players.length > 1 ? `<button class="coop-icon-button" data-coop-action="remove-player" data-id="${p.id}" title="Удалить профиль">×</button>` : ""}</header>
      <div class="coop-form-grid coop-profile-fields">
        <label class="coop-field"><span>Игрок</span><input data-player-path="name" value="${esc(p.name)}"></label>
        <label class="coop-field"><span>Лидер</span><input data-player-path="leader" value="${esc(p.leader)}" placeholder="Уникальное имя"></label>
        <label class="coop-field"><span>Фракция</span><input data-player-path="faction" value="${esc(p.faction)}" placeholder="Guild"></label>
        <label class="coop-field"><span>Два ключевых слова</span><input data-player-path="keywords" value="${esc(p.keywords)}" placeholder="Marshal, Witch Hunter"></label>
        <label class="coop-field"><span>Архетип</span><select data-player-path="archetype">${Object.entries(archetypes).map(([name, stats]) => `<option value="${name}" ${p.archetype === name ? "selected" : ""}>${name} · ${stats}</option>`).join("")}</select></label>
        <label class="coop-field"><span>Улучшения лидера</span><input type="number" min="0" data-player-path="advances" value="${p.advances}"><small>Стоимость в отряде: ${leaderCost(p)} SS</small></label>
      </div>
      <div class="coop-arsenal-head"><div><span>Стартовый лимит</span><b>${total} / 25 SS</b><small>${total <= 25 ? `остаток превращается в ${Math.min(3, remainder)} скрип` : `превышение на ${total - 25} SS`}</small></div><button class="coop-button minor" data-coop-action="add-model" data-id="${p.id}">+ Модель</button></div>
      <div class="coop-models">${p.arsenal.length ? p.arsenal.map(m => `<div class="coop-model"><b>${esc(m.name)}</b><span>${m.cost} SS · ${esc(m.type)}</span><label>Ранения <input type="number" min="0" max="3" value="${m.injuries || 0}" data-model-path="injuries" data-model-id="${m.id}"></label><label>Снаряжение <input type="number" min="0" value="${m.equipment || 0}" data-model-path="equipment" data-model-id="${m.id}"></label><button data-coop-action="remove-model" data-player="${p.id}" data-id="${m.id}">×</button></div>`).join("") : `<p class="coop-empty">Арсенал пуст. Добавьте модели на сумму до 25 soulstones.</p>`}</div>
    </article>`;
  }

  function encounterView() {
    const s = scenario();
    const inProgress = state.run.status === "active";
    const resolved = state.run.status === "resolved";
    return `<div class="coop-section-heading"><div><p class="coop-overline">ОПЕРАЦИЯ ${s.n} / ПОПЫТКА ${state.run.attempt}</p><h1>${esc(s.name)}</h1><p>${inProgress ? "Трекер открыт. Вводите показатели постепенно или после партии." : resolved ? "Исход зафиксирован. Перейдите к Aftermath." : "Соберите допустимые отряды и подтвердите начало партии."}</p></div><span class="coop-status ${state.run.status}">${state.run.status === "setup" ? "Подготовка" : state.run.status === "active" ? "В игре" : "Завершён"}</span></div>
      <div class="coop-grid">
        <article class="coop-card">
          <header><span>01 / Составы</span><h2>Распределение сил</h2></header>
          <p class="coop-callout">Лимит сценария делится поровну. Остатки участников объединяются в общий пул; Masters запрещены.</p>
          <label class="coop-field"><span>Общий размер встречи, SS</span><input type="number" min="0" data-run-path="size" value="${state.run.size || 30}" ${inProgress || resolved ? "disabled" : ""}></label>
          <div class="coop-crews">${state.players.map(p => crewPicker(p, inProgress || resolved)).join("")}</div>
          ${state.run.status === "setup" ? `<button class="coop-button primary wide" data-coop-action="start-encounter">Начать сценарий</button>` : ""}
        </article>
        <article class="coop-card coop-tracker-card">
          <header><span>02 / Трекер</span><h2>Только необходимые данные</h2></header>
          ${state.run.status === "setup" ? `<div class="coop-lock"><b>Трекер запечатан</b><p>Подтвердите составы. Приложение не управляет моделями и не раскрывает скрытые награды.</p></div>` : trackerFields(s, resolved)}
        </article>
      </div>`;
  }

  function crewPicker(p, disabled) {
    const crew = state.run.crews[p.id] || { models: [] };
    const allocation = Math.floor(Number(state.run.size || 30) / state.players.length);
    const selectedCost = (crew.models || []).reduce((sum, id) => sum + Number(p.arsenal.find(m => m.id === id)?.cost || 0), leaderCost(p));
    return `<section class="coop-crew"><div><b>${esc(p.name)}</b><span>Лидер ${leaderCost(p)} SS · лимит ${allocation} SS</span></div><output class="${selectedCost > allocation ? "is-over" : ""}">${selectedCost} / ${allocation}</output><div>${p.arsenal.map(m => `<label><input type="checkbox" data-crew-model="${m.id}" data-player="${p.id}" ${(crew.models || []).includes(m.id) ? "checked" : ""} ${disabled ? "disabled" : ""}><span><b>${esc(m.name)}</b><small>${m.cost} SS · ${m.injuries || 0} ран.</small></span></label>`).join("") || `<small>Нет моделей в арсенале</small>`}</div><footer>Campaign Rating <b>${rating(p)}</b></footer></section>`;
  }

  function trackerFields(s, disabled) {
    return `<div class="coop-tracker-fields">${s.fields.map(([key, label, type]) => type === "check" ? `<label class="coop-check"><input type="checkbox" data-tracker="${key}" ${state.run.tracker[key] ? "checked" : ""} ${disabled ? "disabled" : ""}><span>${label}</span></label>` : `<label class="coop-field"><span>${label}</span><input type="${type}" data-tracker="${key}" value="${esc(state.run.tracker[key] || "")}" ${disabled ? "disabled" : ""}></label>`).join("")}</div>
      ${s.branches && !disabled ? `<label class="coop-field"><span>Решение группы</span><select data-run-path="branch">${s.branches.map(b => `<option value="${b.value}" ${state.run.branch === b.value ? "selected" : ""}>${b.label} → ${scenarioMap[b.next].name}</option>`).join("")}</select></label>` : ""}
      <label class="coop-field"><span>Заметки ведущего</span><textarea data-run-path="notes" ${disabled ? "disabled" : ""}>${esc(state.run.notes)}</textarea></label>
      ${!disabled ? `<div class="coop-outcomes"><button data-coop-action="resolve" data-outcome="win">Подтвердить победу</button><button data-coop-action="resolve" data-outcome="loss">Подтвердить поражение</button></div>` : `<div class="coop-result ${state.run.outcome}"><small>Подтверждённый исход</small><b>${state.run.outcome === "win" ? "Победа" : "Поражение"}</b></div>`}`;
  }

  function aftermathView() {
    if (!state.aftermath) return `<div class="coop-section-heading"><div><p class="coop-overline">AFTERMATH / ЗАКРЫТО</p><h1>Сначала завершите сценарий</h1><p>Мастер последствий становится доступен после подтверждения победы или поражения.</p></div><button class="coop-button" data-coop-tab="encounter">К трекеру</button></div>`;
    const a = state.aftermath;
    return `<div class="coop-section-heading"><div><p class="coop-overline">AFTERMATH / ШАГ ${Math.min(a.step + 1, 6)} ИЗ 6</p><h1>${a.step < 6 ? phases[a.step] : "Итоговая сверка"}</h1><p>Шаги выполняются строго по порядку. Изменения применятся только при итоговом подтверждении.</p></div><span class="coop-status active">Черновик сохранён</span></div>
      <div class="coop-aftermath-rail">${phases.map((p, i) => `<div class="${i === a.step ? "is-current" : ""} ${i < a.step ? "is-done" : ""}"><span>${i + 1}</span><b>${p}</b></div>`).join("")}</div>
      <article class="coop-card coop-aftermath-card">${a.step < 6 ? phaseView(a) : summaryView(a)}</article>`;
  }

  function phaseView(a) {
    const barterSkipped = a.step === 2 && scenario().id === "call" && state.run.outcome === "loss";
    const help = ["Запишите индивидуальную руку. Для физической колоды используйте формат «13 C, 8 T…».", "Подтвердите скрип и предметные награды по сценарию.", barterSkipped ? "Call for Help: при поражении Barter пропускается." : "Один Barter Flip на игрока. Покупки не могут увести баланс ниже нуля.", "Начислите базовый и бонусный XP; открытые улучшения разрешайте по очереди.", "Каждая попытка стоит 1 скрип до Flip. Запишите выбранную модель и результат.", "Обработайте погибшие non-Peon модели по одной; повторное одноимённое ранение не добавляется."][a.step];
    return `<header><span>${String(a.step + 1).padStart(2, "0")} / ${phases[a.step]}</span><h2>${help}</h2></header>${barterSkipped ? `<div class="coop-lock"><b>Barter пропущен</b><p>Система зафиксирует переход к Advance Leader без Barter Flip и покупок.</p></div>` : `<div class="coop-phase-players">${state.players.map(p => phasePlayer(p, a)).join("")}</div>`}<footer class="coop-phase-actions">${a.step > 0 ? `<button class="coop-button minor" data-coop-action="phase-back">← Назад</button>` : "<span></span>"}<button class="coop-button primary" data-coop-action="phase-next">Подтвердить шаг →</button></footer>`;
  }

  function phasePlayer(p, a) {
    const draft = a.players[p.id] || {};
    const fields = [
      `<label class="coop-field"><span>Карты руки</span><input data-phase-player="${p.id}" data-key="hand" value="${esc(draft.hand || "")}" placeholder="Например: 13 C, 8 T"></label>`,
      `<label class="coop-field"><span>Получено скрип</span><input type="number" min="0" data-phase-player="${p.id}" data-key="payday" value="${draft.payday || 0}"></label><label class="coop-field"><span>Предметные награды</span><input data-phase-player="${p.id}" data-key="rewards" value="${esc(draft.rewards || "")}"></label>`,
      `<label class="coop-field"><span>Потрачено скрип</span><input type="number" min="0" max="${p.scrip + Number(draft.payday || 0)}" data-phase-player="${p.id}" data-key="spent" value="${draft.spent || 0}"></label><label class="coop-field"><span>Покупки</span><input data-phase-player="${p.id}" data-key="purchases" value="${esc(draft.purchases || "")}"></label>`,
      `<label class="coop-field"><span>Получено XP</span><input type="number" min="0" data-phase-player="${p.id}" data-key="xp" value="${draft.xp ?? (state.run.outcome === "loss" ? 2 : 1)}"></label><label class="coop-field"><span>Выбранные улучшения</span><input data-phase-player="${p.id}" data-key="advances" value="${esc(draft.advances || "")}"></label>`,
      `<label class="coop-field"><span>Потрачено на Doctor</span><input type="number" min="0" data-phase-player="${p.id}" data-key="doctorCost" value="${draft.doctorCost || 0}"></label><label class="coop-field"><span>Результаты лечения</span><input data-phase-player="${p.id}" data-key="doctor" value="${esc(draft.doctor || "")}"></label>`,
      `<label class="coop-field"><span>Новые ранения / Lucky Miss</span><input data-phase-player="${p.id}" data-key="injuries" value="${esc(draft.injuries || "")}"></label><label class="coop-field"><span>Уничтоженные модели</span><input data-phase-player="${p.id}" data-key="destroyed" value="${esc(draft.destroyed || "")}"></label>`,
    ][a.step];
    return `<section><div><b>${esc(p.name)}</b><small>${esc(p.leader || "лидер не назван")} · ${p.scrip} скрип · ${p.xp} XP</small></div><div class="coop-form-grid">${fields}</div></section>`;
  }

  function summaryView(a) {
    return `<header><span>06 / Атомарное сохранение</span><h2>Проверьте все операции</h2></header><div class="coop-summary">${state.players.map(p => { const d = a.players[p.id] || {}; return `<section><h3>${esc(p.name)}</h3><dl><div><dt>Aftermath Hand</dt><dd>${esc(d.hand || "—")}</dd></div><div><dt>Скрип</dt><dd>+${d.payday || 0} / −${Number(d.spent || 0) + Number(d.doctorCost || 0)}</dd></div><div><dt>XP</dt><dd>+${d.xp || 0}</dd></div><div><dt>Покупки и награды</dt><dd>${esc([d.purchases, d.rewards].filter(Boolean).join("; ") || "—")}</dd></div><div><dt>Ранения</dt><dd>${esc(d.injuries || "—")}</dd></div></dl></section>`; }).join("")}</div><div class="coop-atomic-note"><b>После подтверждения запись станет неизменяемой.</b><span>Исправления следует вносить отдельной корректирующей операцией в журнале.</span></div><button class="coop-button primary wide" data-coop-action="commit-aftermath">Подтвердить весь Aftermath</button>`;
  }

  function historyView() {
    return `<div class="coop-section-heading"><div><p class="coop-overline">НЕИЗМЕНЯЕМАЯ ХРОНИКА</p><h1>Журнал операций</h1><p>Сценарии и атомарно сохранённые последствия.</p></div><div><button class="coop-button minor" data-coop-action="import">Импорт</button> <button class="coop-button" data-coop-action="export">Экспорт JSON</button><input id="coopImport" type="file" accept="application/json" hidden></div></div>
      <div class="coop-history">${state.history.length ? [...state.history].reverse().map((h, index) => `<article class="coop-card"><span>${String(state.history.length - index).padStart(3, "0")} / ${esc(h.time)}</span><h2>${esc(h.scenario)} · ${h.outcome === "win" ? "Победа" : "Поражение"}</h2><p>Неделя ${h.week}, попытка ${h.attempt}. ${esc(h.notes || "Без заметок ведущего.")}</p><div>${h.players.map(p => `<b>${esc(p.name)} <small>${p.scripDelta >= 0 ? "+" : ""}${p.scripDelta} скрип · +${p.xp} XP</small></b>`).join("")}</div></article>`).join("") : `<div class="coop-lock"><b>Журнал пока пуст</b><p>Первая запись появится после полного подтверждения Aftermath.</p></div>`}</div>`;
  }

  function shell() {
    const labels = { hq: "Штаб", players: "Игроки", encounter: "Сценарий", aftermath: "Aftermath", history: "Журнал" };
    return `<div class="coop-shell"><nav class="coop-tabs" aria-label="Разделы кооперативной кампании">${Object.entries(labels).map(([id, label], i) => `<button class="${state.active === id ? "is-active" : ""}" data-coop-tab="${id}"><span>0${i + 1}</span>${label}${id === "aftermath" && state.aftermath ? `<i>${Math.min(6, state.aftermath.step + 1)}</i>` : ""}</button>`).join("")}</nav><div class="coop-content">${state.active === "hq" ? hqView() : state.active === "players" ? playersView() : state.active === "encounter" ? encounterView() : state.active === "aftermath" ? aftermathView() : historyView()}</div></div>`;
  }

  function setPath(root, path, value) {
    const keys = path.split("."); let current = root;
    keys.slice(0, -1).forEach(k => current = current[k]); current[keys.at(-1)] = value;
  }
  function readInput(input) { return input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value; }

  function bind(root) {
    root.onclick = (event) => {
      const tab = event.target.closest("[data-coop-tab]");
      if (tab) { state.active = tab.dataset.coopTab; save(); render(); return; }
      const scenarioButton = event.target.closest("[data-coop-scenario]");
      if (scenarioButton && state.run.status === "setup" && confirm("Перейти к выбранному сценарию? Текущая подготовка будет очищена.")) { state.campaign.scenario = scenarioButton.dataset.coopScenario; state.run = { status: "setup", outcome: "", tracker: {}, crews: {}, notes: "", branch: "deal", attempt: 1 }; save(); render(); return; }
      const button = event.target.closest("[data-coop-action]"); if (!button) return;
      action(button.dataset.coopAction, button);
    };
    const handleField = (event) => {
      const el = event.target;
      const changeOnly = el.type === "checkbox" || el.tagName === "SELECT";
      if ((event.type === "input" && changeOnly) || (event.type === "change" && !changeOnly)) return;
      if (el.dataset.coopPath) { setPath(state, el.dataset.coopPath, readInput(el)); save(); if (changeOnly || el.type === "number") render(); return; }
      const playerCard = el.closest("[data-player-id]");
      if (playerCard && el.dataset.playerPath) { const p = state.players.find(x => x.id === playerCard.dataset.playerId); setPath(p, el.dataset.playerPath, readInput(el)); save(); if (event.type === "change" || el.type === "number") render(); return; }
      if (playerCard && el.dataset.modelPath) { const p = state.players.find(x => x.id === playerCard.dataset.playerId); const m = p.arsenal.find(x => x.id === el.dataset.modelId); m[el.dataset.modelPath] = readInput(el); save(); return; }
      if (el.dataset.runPath) { setPath(state.run, el.dataset.runPath, readInput(el)); save(); if (event.type === "change" || el.type === "number") render(); return; }
      if (el.dataset.tracker) { state.run.tracker[el.dataset.tracker] = readInput(el); save(); return; }
      if (el.dataset.crewModel) { const id = el.dataset.player; state.run.crews[id] ||= { models: [] }; const models = state.run.crews[id].models; el.checked ? models.push(el.dataset.crewModel) : models.splice(models.indexOf(el.dataset.crewModel), 1); save(); render(); return; }
      if (el.dataset.phasePlayer) { const draft = state.aftermath.players[el.dataset.phasePlayer] ||= {}; draft[el.dataset.key] = readInput(el); save(); }
      if (el.dataset.coopAction === "scenario-select") { state.campaign.scenario = el.value; state.run = { status: "setup", outcome: "", tracker: {}, crews: {}, notes: "", branch: "deal", attempt: 1 }; save(); render(); }
    };
    root.addEventListener("input", handleField);
    root.addEventListener("change", handleField);
  }

  function action(name, button) {
    if (name === "add-player") { state.players.push(freshPlayer(state.players.length)); save(); render(); }
    if (name === "remove-player" && confirm("Удалить профиль и его арсенал?")) { state.players = state.players.filter(p => p.id !== button.dataset.id); save(); render(); }
    if (name === "add-model") {
      const title = prompt("Название модели"); if (!title) return;
      const cost = Number(prompt("Стоимость модели, SS", "5")); if (!Number.isFinite(cost) || cost < 0) return;
      state.players.find(p => p.id === button.dataset.id).arsenal.push({ id: crypto.randomUUID?.() || `${Date.now()}`, name: title, cost, type: "Minion", injuries: 0, equipment: 0, addedWeek: state.run.status === "resolved" || state.aftermath ? state.campaign.week : 0 }); save(); render();
    }
    if (name === "remove-model") { const p = state.players.find(x => x.id === button.dataset.player); p.arsenal = p.arsenal.filter(m => m.id !== button.dataset.id); save(); render(); }
    if (name === "start-encounter") {
      const invalidArsenal = state.players.some(p => p.arsenal.reduce((sum, m) => sum + Number(m.cost || 0), 0) > 25 && state.history.length === 0);
      if (invalidArsenal) return notify("Стартовый арсенал одного из игроков превышает 25 soulstones.");
      const invalid = state.players.some(p => {
        const max = Math.floor(Number(state.run.size || 30) / state.players.length);
        const crew = state.run.crews[p.id]?.models || [];
        return leaderCost(p) + crew.reduce((sum, id) => sum + Number(p.arsenal.find(m => m.id === id)?.cost || 0), 0) > max;
      });
      if (invalid) return notify("Один из отрядов превышает личный лимит soulstones.");
      state.run.status = "active"; save(); render();
    }
    if (name === "resolve") {
      if (!confirm(`Зафиксировать ${button.dataset.outcome === "win" ? "победу" : "поражение"}?`)) return;
      state.run.status = "resolved"; state.run.outcome = button.dataset.outcome;
      state.aftermath = { step: 0, players: Object.fromEntries(state.players.map(p => [p.id, { xp: button.dataset.outcome === "loss" ? 2 : 1 }])) };
      state.active = "aftermath"; save(); render();
    }
    if (name === "phase-next") {
      const a = state.aftermath;
      if (a.step === 2 && state.players.some(p => Number(a.players[p.id]?.spent || 0) > p.scrip + Number(a.players[p.id]?.payday || 0))) return notify("Barter не может сделать баланс отрицательным.");
      if (a.step === 4 && state.players.some(p => Number(a.players[p.id]?.doctorCost || 0) > p.scrip + Number(a.players[p.id]?.payday || 0) - Number(a.players[p.id]?.spent || 0))) return notify("Недостаточно скрипов для Back-Alley Doctor.");
      a.step += 1; save(); render();
    }
    if (name === "phase-back") { state.aftermath.step -= 1; save(); render(); }
    if (name === "commit-aftermath") commitAftermath();
    if (name === "export") exportBackup();
    if (name === "import") document.querySelector("#coopImport")?.click();
  }

  function commitAftermath() {
    if (!confirm("Атомарно сохранить весь Aftermath и перейти дальше?")) return;
    const s = scenario(); const a = state.aftermath;
    if (s.weekEnd) {
      const missingHire = state.players.find(p => !p.arsenal.some(m => Number(m.addedWeek) === state.campaign.week));
      if (missingHire) {
        state.active = "players"; save(); render();
        return notify(`${missingHire.name}: добавьте минимум одну модель для завершения недели.`);
      }
    }
    const record = { id: crypto.randomUUID?.() || `${Date.now()}`, time: timestamp(), scenarioId: s.id, scenario: s.name, week: state.campaign.week, attempt: state.run.attempt, outcome: state.run.outcome, notes: state.run.notes, tracker: { ...state.run.tracker }, players: [] };
    state.players.forEach(p => {
      const d = a.players[p.id] || {}; const delta = Number(d.payday || 0) - Number(d.spent || 0) - Number(d.doctorCost || 0);
      p.scrip = Math.max(0, p.scrip + delta); p.xp += Number(d.xp || 0);
      record.players.push({ id: p.id, name: p.name, scripDelta: delta, xp: Number(d.xp || 0), summary: d });
    });
    state.history.push(record);
    let next = s.next;
    if (s.branches) next = s.branches.find(b => b.value === state.run.branch)?.next || s.branches[0].next;
    if (state.run.outcome === "loss") {
      if (state.settings.threads && state.settings.threadCount > 0) { state.settings.threadCount -= 1; if (!s.next) next = s.id; }
      else if (state.run.attempt < 2) next = s.id;
      else state.campaign.status = "lost";
    }
    if (s.weekEnd) state.campaign.week += 1;
    if (next) state.campaign.scenario = next; else state.campaign.status = "complete";
    state.run = { status: "setup", outcome: "", tracker: {}, crews: {}, notes: "", branch: "deal", attempt: next === s.id ? state.run.attempt + 1 : 1, size: state.run.size };
    state.aftermath = null; state.active = "hq"; save(); render(); notify("Aftermath сохранён. Кампания продвинута.");
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify({ kind: "m4e-cooperative-backup", exportedAt: new Date().toISOString(), data: state }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${state.campaign.name.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}-coop.json`; a.click(); URL.revokeObjectURL(a.href); notify("Резервная копия экспортирована.");
  }

  function render(nextLocale = locale) {
    locale = nextLocale || locale;
    const root = document.querySelector("#cooperativeApp"); if (!root) return;
    root.innerHTML = shell(); bind(root);
    const input = root.querySelector("#coopImport");
    if (input) input.onchange = async () => { try { const raw = JSON.parse(await input.files[0].text()); state = normalize(raw.kind === "m4e-cooperative-backup" ? raw.data : raw); save(); render(); notify("Кооперативная кампания импортирована."); } catch { notify("Не удалось импортировать файл."); } };
  }

  window.CooperativeCampaign = { render, getState: () => state };
})();
