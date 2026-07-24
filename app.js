const STORAGE_KEY = "m4e-untold-campaign-v1";

const archetypes = {
  "Lucky Upstart": {
    label: "Счастливчик",
    tagline: "Сбалансирован и начинает с особого предмета.",
    stats: { Df: 6, Wp: 6, Sp: 6, Health: 14 },
    talents: [
      { type: "Атака", limit: 6 },
      { type: "Способность", limit: 6 },
    ],
    rule:
      "Атака и способность берутся у союзников стоимостью 6 или меньше. Затем сделайте нечитаемый обманом флип и бесплатно получите предмет с точно совпавшим BR; он не учитывается в CR и возвращается после аннигиляции.",
  },
  Generalist: {
    label: "Универсал",
    tagline: "По одному таланту каждого типа.",
    stats: { Df: 5, Wp: 5, Sp: 6, Health: 14 },
    talents: [
      { type: "Атака", limit: 7 },
      { type: "Тактика", limit: 7 },
      { type: "Способность", limit: 7 },
    ],
    rule: "Атака, тактика и способность берутся у союзников стоимостью 7 или меньше.",
  },
  "Heavy Hitter": {
    label: "Тяжеловес",
    tagline: "Мощная атака с одним выбранным триггером.",
    stats: { Df: 6, Wp: 4, Sp: 6, Health: 14 },
    talents: [
      { type: "Атака + триггер", limit: 10 },
      { type: "Тактика", limit: 5 },
    ],
    rule:
      "Атака берётся у союзника стоимостью 10 или меньше и сохраняет один выбранный триггер. Тактика — у союзника стоимостью 5 или меньше.",
  },
  Schemer: {
    label: "Интриган",
    tagline: "Быстрый специалист по тактическим приёмам.",
    stats: { Df: 6, Wp: 5, Sp: 7, Health: 13 },
    talents: [
      { type: "Атака", limit: 5 },
      { type: "Тактика I", limit: 8 },
      { type: "Тактика II", limit: 8 },
      { type: "Способность", limit: 8 },
    ],
    rule:
      "Атака берётся у союзника стоимостью 5 или меньше; две тактики и способность — у союзников стоимостью 8 или меньше.",
  },
  "Talented Individual": {
    label: "Самородок",
    tagline: "Две способности и гибкий набор действий.",
    stats: { Df: 5, Wp: 5, Sp: 5, Health: 13 },
    talents: [
      { type: "Атака", limit: 6 },
      { type: "Тактика", limit: 6 },
      { type: "Способность I", limit: 8 },
      { type: "Способность II", limit: 8 },
    ],
    rule:
      "Атака и тактика берутся у союзников стоимостью 6 или меньше; две способности — у союзников стоимостью 8 или меньше.",
  },
};

const crewCards = [
  {
    id: "expert-coordination",
    name: "Expert Coordination",
    text: "При активации модель может drain Soulstone, чтобы пройти до 3″.",
  },
  {
    id: "shape-landscape",
    name: "Shape the Landscape",
    text: "При активации модель может drain Soulstone, чтобы создать выбранный маркер в 1″.",
  },
  {
    id: "heavy-blow",
    name: "Heavy Blow",
    text: "После урона врагу действием можно drain Soulstone и нанести +1 урон.",
  },
  {
    id: "unusual-specialty",
    name: "Unusual Specialty",
    text: "При активации можно drain Soulstone и получить выбранный разрешённый токен.",
  },
  {
    id: "the-plan",
    name: "The Plan Comes Together",
    text: "Союзник в 6″ проходит до 3″, затем объявляет Interact по Strategy marker.",
  },
  {
    id: "forbidden-curse",
    name: "Forbidden Curse",
    text: "Атака Wp в 6″: цель получает выбранный разрешённый токен.",
  },
  {
    id: "specialized-tools",
    name: "Specialized Tools",
    text: "Союзник в 6″ прикрепляет upgrade выбранного разрешённого типа.",
  },
  {
    id: "prepared",
    name: "Prepared For Anything",
    text: "При активации модель может drain Soulstone, чтобы объявить Prepare.",
  },
  {
    id: "scavenger",
    name: "Scavenger’s Instinct",
    text: "Убив врага, модель может drain Soulstone: взять карту и исцелить 1.",
  },
  {
    id: "inhuman",
    name: "Inhuman Determination",
    text: "При активации можно drain Soulstone: исцелить 2 и пройти до 1″.",
  },
  {
    id: "loot-stash",
    name: "Loot Their Stash",
    text: "На половине врага сделайте флип и временно получите предмет с равным BR.",
  },
  {
    id: "sadistic",
    name: "Sadistic Blow",
    text: "Ближняя атака; при raise цель получает Injured token.",
  },
];

const equipment = [
  ["Lucky Gremlin Foot", "Всегда", 1, "Предотвращает получение травмы, затем аннигилируется."],
  ["Pistol", "Всегда", 1, "Атака Skl 5, ближняя 1″ или дальняя 8″, урон 2."],
  ["Sword", "Всегда", 1, "Ближняя атака 1″, Skl +5, урон 2."],
  ["Trusty Rifle", "Всегда", 1, "Дальняя атака 14″, Skl 5, урон 2."],
  ["Helmet", "1 R/M", 2, "Hard to Kill."],
  ["Healing Salve", "1 R/M", 1, "Аннигилировать при активации: исцелить 15."],
  ["Blackjack", "1 R/M", 2, "Ближняя атака и перемещение цели."],
  ["Leg Breaker", "1 C/T", 2, "При raise цель немедленно делает injury flip."],
  ["Warming Flask", "1 C/T", 2, "Лечит союзника; больше лечения за raises."],
  ["Lead-Lined Coat", "1 C/T", 3, "Armor: раз за активацию снизить урон на 1."],
  ["Flamethrower", "2 R/M", 2, "Дальняя атака 10″; Burning вокруг цели."],
  ["Stage Hook", "2 R/M", 2, "Передвигает другую дружественную модель до 4″."],
  ["Guardian’s Shield", "2 R/M", 2, "Juggernaut: урон свыше 3 становится равен 3."],
  ["Death Curse", "2 C/T", 2, "Убивший модель враг делает injury flip."],
  ["Twin Katanas", "2 C/T", 3, "Ближняя атака и рывок к врагу за Soulstone."],
  ["Thieves’ Tools", "2 C/T", 2, "Может похитить снаряжение цели при raise."],
  ["Carrier Pigeon", "3 R/M", 2, "Создаёт Scheme marker рядом с союзником."],
  ["Vengeful Vow", "3 C/T", 2, "Только лидер: +1 XP за убийство unique после аннигиляции."],
  ["Aetheric Displacer", "3 C/T", 3, "После промаха врага — place в пределах 3″."],
  ["Coffee", "4 R/M", 1, "Аннигилировать при активации: получить Fast."],
  ["Sniper’s Scope", "4 R/M", 1, "Дальние действия игнорируют cover и concealment."],
  ["Gatling Gun", "4 C/T", 2, "Дальняя атака 12″, получает + без cover."],
  ["Snake Oil", "5 R/M", 1, "Снять любое число токенов и, возможно, infuse Soulstone."],
  ["Assassin’s Blade", "5 C/T", 2, "Цель сбрасывает карту / drain Soulstone, иначе погибает."],
  ["Whiskey", "6 R/M", 1, "Сбросить при активации: + ко всем дуэлям до End Phase."],
  ["Escape Coil", "6 R/M", 2, "После урона drain Soulstone: place к союзнику в 6″."],
  ["Hag’s Kiss", "6 C/T", 2, "Wp-атака: Stunned и Slow."],
  ["Metal Skull Plate", "7 R/M", 3, "Может Charge по масти верхней карты сброса."],
  ["Barbed Whip", "7 R/M", 2, "Ближняя атака с дистанцией 4″."],
  ["Lasso", "7 R/M", 2, "Подтягивает цель; при raise даёт Slow."],
  ["Trash Can", "7 C/T", 3, "Удаляет маркер."],
  ["Dark Crystal", "13 C/T", 1, "Рискованный сценарный эффект на половине врага."],
  ["Hurled Luggage", "13 C/T", 2, "Создаёт Scheme marker рядом с целью."],
  ["Dead Man’s Switch", "13 C/T", 1, "Demise: 3 irreducible damage врагам в 3″."],
];

const injuries = [
  ["Black Joker", "Traitor", "Если не лидер/тотем: модель аннигилируется и может бесплатно перейти противнику."],
  ["1–2 R/M", "Just a Flesh Wound", "Травма не получена."],
  ["3 R/M", "Severe Amputation", "Максимальное здоровье −2."],
  ["4 R/M", "Pack Mule", "После гибели противник может поставить Scheme marker рядом."],
  ["5 R/M", "Headstrong", "Стоимость +1; лидер и тотем перебрасывают."],
  ["6 R/M", "Permanent Hex", "1 урон себе, чтобы объявлять триггеры."],
  ["7 R/M", "Senseless", "В начале активации сбросить карту или получить Slow."],
  ["8 R/M", "Mangled Limb", "−1 Skl ко всем атакам."],
  ["9 R/M", "Leadfooted", "−1 Sp."],
  ["10 R/M", "Defenseless", "Получает +1 урон каждый раз, когда ей наносят урон."],
  ["11 R/M", "Loose Lips", "Враги в 3″ могут объявлять действия с карты модели."],
  ["12 R/M", "Blood Debt", "Особое условие снятия; противник может обменять травму на 1 VP."],
  ["13 R/M", "Killed Off", "Модель аннигилируется."],
  ["1–2 C/T", "Just a Flesh Wound", "Травма не получена."],
  ["3 C/T", "Distracted by Voices", "−2 Wp."],
  ["4 C/T", "Always Wandering", "Выходит в Start Phase второго хода, затем травма аннигилируется."],
  ["5 C/T", "Fugitive", "При следующей гибели враг получает 2 скрип; затем травма исчезает."],
  ["6 C/T", "One Last Job", "После Interact модель погибает."],
  ["7 C/T", "Off Balance", "− к Df и Wp дуэлям."],
  ["8 C/T", "Barely Holding Together", "Нельзя объявлять Charge."],
  ["9 C/T", "Dulled Edge", "−1 Df."],
  ["10 C/T", "Missing Fingers", "Без сброса карты signature-символы пусты до End Phase."],
  ["11 C/T", "Brittle Bones", "Атакующий получает + при атаке этой модели."],
  ["12 C/T", "Blackmailed", "Враг может аннигилировать травму и заставить модель объявить действие."],
  ["13 C/T", "Killed Off", "Модель аннигилируется."],
  ["Red Joker", "Close Call", "При обычном флипе перейдите к Lucky Miss; при cheat травмы нет."],
];

const xpTiers = [
  1, 1, 2, null, 3, null, 4, null, 1, null, 2, null, 4,
  null, null, null, 1, null, null, 2, 1, null, null, null, 3, null,
  null, null, null, 1, null, null, null, null, 2, null, null, null, 4,
];

const defaultState = {
  version: 1,
  crew: {
    name: "",
    player: "",
    faction: "",
    keywords: ["", ""],
  },
  campaign: {
    length: 8,
    week: 1,
    meetingDay: "",
  },
  leader: {
    name: "",
    archetype: "",
    characteristics: ["", ""],
    size: 2,
    base: 30,
    path: "Bruiser",
    talents: [],
    crewCard: "",
    xp: 0,
    advances: [],
  },
  arsenal: {
    models: [],
    equipment: [],
    scrip: 0,
  },
  games: [],
};

let state = loadState();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeDefaults(saved) {
  const base = clone(defaultState);
  if (!saved || typeof saved !== "object") return base;
  return {
    ...base,
    ...saved,
    crew: { ...base.crew, ...(saved.crew || {}) },
    campaign: { ...base.campaign, ...(saved.campaign || {}) },
    leader: { ...base.leader, ...(saved.leader || {}) },
    arsenal: { ...base.arsenal, ...(saved.arsenal || {}) },
    games: Array.isArray(saved.games) ? saved.games : [],
  };
}

function loadState() {
  try {
    return mergeDefaults(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return clone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getAtPath(path) {
  return path.split(".").reduce((value, key) => value?.[key], state);
}

function setAtPath(path, rawValue) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((value, key) => value[key], state);
  target[last] = rawValue;
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plural(number, forms) {
  const n = Math.abs(number) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.querySelector("#toastRegion").append(node);
  setTimeout(() => node.remove(), 2800);
}

function routeTo(route) {
  document.querySelectorAll(".route").forEach((section) => {
    section.classList.toggle("is-active", section.id === `route-${route}`);
  });
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.classList.toggle("is-active", button.classList.contains("nav-item") && button.dataset.route === route);
  });
  history.replaceState(null, "", `#${route}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindFields() {
  document.querySelectorAll("[data-bind]").forEach((input) => {
    const value = getAtPath(input.dataset.bind);
    input.value = value ?? "";
    input.addEventListener("input", () => {
      const next = input.type === "number" || input.type === "range" ? Number(input.value) : input.value;
      setAtPath(input.dataset.bind, next);
      saveState();
      renderChrome();
      renderDossier();
    });
  });

  document.querySelectorAll("[data-path-choice]").forEach((input) => {
    input.checked = state.leader.path === input.value;
    input.addEventListener("change", () => {
      state.leader.path = input.value;
      saveState();
      renderChrome();
      renderGamePreview();
    });
  });
}

function renderChrome() {
  document.querySelector("#headerCampaign").textContent = state.crew.name || "Новое досье";
  document.querySelector("#headerWeek").textContent = `Неделя ${state.campaign.week}`;
  document.querySelector("#campaignLengthOutput").textContent =
    `${state.campaign.length} ${plural(state.campaign.length, ["неделя", "недели", "недель"])}`;
}

function renderDossier() {
  const checks = [
    state.crew.name,
    state.crew.player,
    state.crew.faction,
    state.crew.keywords[0],
    state.crew.keywords[1],
    state.campaign.meetingDay,
  ];
  const done = checks.filter(Boolean).length;
  const progress = Math.round((done / checks.length) * 100);
  document.querySelector("#dossierProgress").textContent = `${progress}%`;
  document.querySelector("#dossierStatus").textContent =
    progress === 100 ? "Титульный лист заполнен" : progress >= 50 ? "Досье уже обретает форму" : "Нужны основные сведения";
}

function renderArchetypes() {
  const grid = document.querySelector("#archetypeGrid");
  grid.innerHTML = Object.entries(archetypes)
    .map(([id, data], index) => {
      const selected = state.leader.archetype === id;
      return `
        <button class="archetype-card ${selected ? "is-selected" : ""}" type="button" data-archetype="${id}">
          <span class="archetype-number">0${index + 1}</span>
          <h3>${data.label}</h3>
          <p>${data.tagline}</p>
          <div class="stat-row">
            ${Object.entries(data.stats)
              .map(([key, value]) => `<span><small>${key}</small>${value}</span>`)
              .join("")}
          </div>
        </button>
      `;
    })
    .join("");

  grid.querySelectorAll("[data-archetype]").forEach((button) => {
    button.addEventListener("click", () => {
      state.leader.archetype = button.dataset.archetype;
      const count = archetypes[state.leader.archetype].talents.length;
      state.leader.talents = Array.from({ length: count }, (_, index) => state.leader.talents[index] || {
        name: "",
        source: "",
      });
      saveState();
      renderArchetypes();
      renderTalents();
    });
  });
}

function renderTalents() {
  const wrap = document.querySelector("#talentFields");
  const data = archetypes[state.leader.archetype];
  if (!data) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div><strong>Сначала выберите архетип</strong><p>Ограничения талантов зависят от его специализации.</p></div>
      </div>`;
    document.querySelector("#archetypeRule").textContent =
      "Выберите архетип. Билдер покажет допустимое число талантов и предел стоимости модели-источника.";
    return;
  }

  document.querySelector("#archetypeRule").textContent = data.rule;
  wrap.innerHTML = data.talents
    .map((talent, index) => {
      const saved = state.leader.talents[index] || { name: "", source: "" };
      return `
        <div class="talent-row">
          <span class="talent-type">${talent.type}</span>
          <label class="field">
            <span>Название · источник</span>
            <input data-talent-name="${index}" value="${escapeHtml(saved.name)}" placeholder="Peacebringer · Death Marshal" />
          </label>
          <label class="field">
            <span>Cost ≤</span>
            <input value="${talent.limit}" readonly aria-label="Предел стоимости ${talent.limit}" />
          </label>
        </div>
      `;
    })
    .join("");

  wrap.querySelectorAll("[data-talent-name]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.talentName);
      state.leader.talents[index] = { ...(state.leader.talents[index] || {}), name: input.value };
      saveState();
    });
  });
}

function renderCrewCards() {
  const grid = document.querySelector("#crewCardGrid");
  grid.innerHTML = crewCards
    .map(
      (card) => `
        <button class="crew-option ${state.leader.crewCard === card.id ? "is-selected" : ""}" type="button" data-crew-card="${card.id}">
          <h3>${card.name}</h3>
          <p>${card.text}</p>
        </button>`,
    )
    .join("");
  grid.querySelectorAll("[data-crew-card]").forEach((button) => {
    button.addEventListener("click", () => {
      state.leader.crewCard = button.dataset.crewCard;
      saveState();
      renderCrewCards();
    });
  });
}

function arsenalTotals() {
  const cost = state.arsenal.models.reduce((sum, model) => sum + Number(model.cost || 0), 0);
  const injuriesCount = state.arsenal.models.reduce((sum, model) => sum + Number(model.injuries || 0), 0);
  return { cost, injuriesCount };
}

function renderArsenal() {
  const { cost, injuriesCount } = arsenalTotals();
  document.querySelector("#arsenalCost").textContent = cost;
  document.querySelector("#modelCount").textContent = state.arsenal.models.length;
  document.querySelector("#scripCount").textContent = state.arsenal.scrip;
  document.querySelector("#injuryCount").textContent = injuriesCount;
  document.querySelector("#ratingInjuries").value = injuriesCount;

  const list = document.querySelector("#modelList");
  if (!state.arsenal.models.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div>
          <strong>Арсенал пока пуст</strong>
          <p>Добавьте до 25 SS моделей. Лидер уже считается частью команды и ничего не стоит.</p>
        </div>
      </div>`;
  } else {
    list.innerHTML = state.arsenal.models
      .map(
        (model) => `
          <div class="model-row">
            <span class="model-cost">${model.cost}</span>
            <span class="model-main">
              <b>${escapeHtml(model.name)}</b>
              <small>${escapeHtml(model.type)} · ${escapeHtml(model.keywords || "без ключей")}</small>
            </span>
            <span class="model-badge">${model.outOfKeyword ? "вне ключа" : model.versatile ? "versatile" : "в ключе"}</span>
            <span class="mini-stepper">
              Травмы
              <button type="button" data-injury-minus="${model.id}" aria-label="Уменьшить травмы">−</button>
              <b>${model.injuries || 0}</b>
              <button type="button" data-injury-plus="${model.id}" aria-label="Добавить травму">+</button>
            </span>
            <button class="row-delete" type="button" data-delete-model="${model.id}" aria-label="Удалить ${escapeHtml(model.name)}">×</button>
          </div>`,
      )
      .join("");
  }

  const equipmentWrap = document.querySelector("#equipmentList");
  if (!state.arsenal.equipment.length) {
    equipmentWrap.innerHTML = `<div class="empty-state"><div><strong>Пусто</strong><p>Предметы появятся после Barter или особых эффектов.</p></div></div>`;
  } else {
    equipmentWrap.innerHTML = state.arsenal.equipment
      .map(
        (item) => `
          <div class="equipment-item">
            <b>${escapeHtml(item.name)}</b>
            <button class="row-delete" type="button" data-delete-equipment="${item.id}" aria-label="Удалить">×</button>
            <small>${item.cc != null ? `CC ${item.cc} · BR ${item.br}` : "Пользовательская запись"}</small>
          </div>`,
      )
      .join("");
  }

  list.querySelectorAll("[data-delete-model]").forEach((button) => {
    button.addEventListener("click", () => {
      const removed = state.arsenal.models.find((model) => model.id === button.dataset.deleteModel);
      state.arsenal.models = state.arsenal.models.filter((model) => model.id !== button.dataset.deleteModel);
      if (removed?.scripPaid) state.arsenal.scrip += removed.scripPaid;
      if (state.campaign.week === 1 && state.games.length === 0) {
        state.arsenal.scrip = Math.min(3, Math.max(0, 25 - arsenalTotals().cost));
      }
      saveState();
      renderArsenal();
      calculateRating();
    });
  });

  list.querySelectorAll("[data-injury-plus]").forEach((button) => {
    button.addEventListener("click", () => changeInjury(button.dataset.injuryPlus, 1));
  });
  list.querySelectorAll("[data-injury-minus]").forEach((button) => {
    button.addEventListener("click", () => changeInjury(button.dataset.injuryMinus, -1));
  });
  equipmentWrap.querySelectorAll("[data-delete-equipment]").forEach((button) => {
    button.addEventListener("click", () => {
      state.arsenal.equipment = state.arsenal.equipment.filter((item) => item.id !== button.dataset.deleteEquipment);
      saveState();
      renderArsenal();
    });
  });
}

function changeInjury(id, delta) {
  const model = state.arsenal.models.find((item) => item.id === id);
  if (!model || model.type === "Peon") {
    toast("Peon не получает травм.");
    return;
  }
  model.injuries = Math.max(0, Math.min(3, Number(model.injuries || 0) + delta));
  if (model.injuries >= 3) toast("Три травмы: в конце Determine Injuries модель аннигилируется.");
  saveState();
  renderArsenal();
  calculateRating();
}

function calculateRating() {
  const equipmentCount = Number(document.querySelector("#ratingEquipment").value || 0);
  const advances = Number(document.querySelector("#ratingAdvances").value || 0);
  const injuriesCount = Number(document.querySelector("#ratingInjuries").value || 0);
  document.querySelector("#ratingResult").textContent = equipmentCount + advances - injuriesCount;
}

function renderGamePreview() {
  const form = document.querySelector("#gameForm");
  const data = new FormData(form);
  const vp = Number(data.get("vp") || 0);
  const schemes = Math.min(3, Number(data.get("schemes") || 0));
  const won = data.get("won") === "on";
  const lost = data.get("lost") === "on";
  const pathGoal = data.get("pathGoal") === "on";
  const withdrewEarly = data.get("withdrewEarly") === "on";
  const withdrewLate = data.get("withdrewLate") === "on";
  const gap = Number(data.get("ratingGap") || 0);

  const hand = withdrewEarly ? 0 : schemes + (withdrewLate ? 0 : 1);
  const scrip = withdrewEarly ? 0 : Math.ceil(vp / 3) + (won ? 1 : 0) + gap;
  const xp = withdrewEarly ? 0 : 1 + (lost ? 1 : 0) + (pathGoal ? 1 : 0);

  document.querySelector("#previewHand").textContent = hand;
  document.querySelector("#previewScrip").textContent = `${scrip} скрип`;
  document.querySelector("#previewXp").textContent = `${xp} XP`;
  document.querySelector("#pathGoalLabel").textContent =
    state.leader.path === "Strategist" ? "Interact в 6″ от зоны врага" : "Лидер убил non-peon врага";
  return { vp, schemes, won, lost, pathGoal, withdrewEarly, withdrewLate, gap, hand, scrip, xp };
}

function renderChronicle() {
  const log = document.querySelector("#gameLog");
  document.querySelector("#gameCount").textContent =
    `${state.games.length} ${plural(state.games.length, ["игра", "игры", "игр"])}`;
  if (!state.games.length) {
    log.innerHTML = `<div class="empty-state"><div><strong>История ещё не написана</strong><p>Запишите первую игру — начисления попадут сюда и в трек лидера.</p></div></div>`;
  } else {
    log.innerHTML = [...state.games]
      .reverse()
      .map(
        (game, reverseIndex) => `
          <div class="game-entry">
            <span class="game-entry-number">${String(state.games.length - reverseIndex).padStart(2, "0")}</span>
            <span>
              <b>${escapeHtml(game.opponent || "Неизвестный соперник")}</b>
              <p>Неделя ${game.week} · ${game.vp} VP · ${game.won ? "победа" : game.lost ? "поражение" : "ничья"}</p>
            </span>
            <span class="game-entry-gain">+${game.scrip} скрип<br>+${game.xp} XP</span>
          </div>`,
      )
      .join("");
  }
  renderXpTrack();
}

function renderXpTrack() {
  const track = document.querySelector("#xpTrack");
  track.innerHTML = xpTiers
    .map(
      (tier, index) => `
        <button class="xp-box ${index < state.leader.xp ? "is-earned" : ""} ${index === state.leader.xp ? "is-current" : ""}"
          type="button" data-xp-index="${index}" title="Установить опыт: ${index + 1}">
          ${tier || ""}
        </button>`,
    )
    .join("");
  track.querySelectorAll("[data-xp-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.leader.xp = Number(button.dataset.xpIndex) + 1;
      saveState();
      renderXpTrack();
      toast(`Опыт лидера: ${state.leader.xp}.`);
    });
  });
}

function renderReference() {
  const flow = [
    ["01", "Начало недели", "Начиная со второй недели каждый игрок нанимает минимум одну модель. Первая модель недели стоит на 5 скрип меньше."],
    ["02", "Подготовка", "Размер встречи не выше стоимости меньшего арсенала +6. Нанимать можно только из своего арсенала."],
    ["03", "Рейтинг", "Снаряжение в выбранной команде + продвижения лидера и тотема − травмы выбранных моделей."],
    ["04", "Игра", "Можно сделать Strategic Withdrawal в Start Phase. Ранний отход лишает VP, Barter, руки и выплаты."],
    ["05", "Aftermath", "Рука → Payday → Barter → развитие лидера → доктор → травмы. Флипы делаются строго по очереди."],
    ["06", "Новая глава", "Сохраняйте арсенал, скрип, травмы и продвижения до конца согласованных 4–12 недель."],
  ];
  document.querySelector("#reference-flow").innerHTML = `<div class="flow-grid">${flow
    .map(
      ([number, title, text]) => `
        <article class="flow-step">
          <span class="flow-step-number">${number}</span>
          <h3>${title}</h3>
          <p>${text}</p>
        </article>`,
    )
    .join("")}</div>`;

  document.querySelector("#reference-injuries").innerHTML = tableHtml(
    ["Флип", "Травма", "Краткий эффект"],
    injuries,
  );
  document.querySelector("#reference-equipment").innerHTML = tableHtml(
    ["BR", "Предмет", "CC / краткий эффект"],
    equipment.map(([name, br, cc, text]) => [br, name, `CC ${cc}. ${text}`]),
  );

  const tiers = [
    ["Тир I", "Модификации", ["Attack Modification", "Tactical Modification"]],
    ["Тир II", "Новые таланты", ["Action Advancement", "Ability Advancement"]],
    ["Тир III", "Переломный момент", ["Totem Advancement", "Summoning Advancement · один раз"]],
    ["Тир IV", "Наследие команды", ["Crew Card Advancement", "Эффект карты мастера с общим ключом"]],
  ];
  document.querySelector("#reference-advancement").innerHTML = `
    <div class="advancement-grid">
      ${tiers
        .map(
          ([label, title, entries]) => `
            <article class="tier-column">
              <span>${label}</span>
              <h3>${title}</h3>
              <ul>${entries.map((entry) => `<li>${entry}</li>`).join("")}</ul>
              <small>При достижении пронумерованной ячейки можно выбрать таблицу этого тира или ниже.</small>
            </article>`,
        )
        .join("")}
    </div>`;
}

function tableHtml(headings, rows) {
  return `
    <div class="reference-table-wrap">
      <table class="reference-table">
        <thead><tr>${headings.map((heading) => `<th>${heading}</th>`).join("")}</tr></thead>
        <tbody>${rows
          .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
          .join("")}</tbody>
      </table>
    </div>`;
}

function renderAll() {
  renderChrome();
  renderDossier();
  renderArchetypes();
  renderTalents();
  renderCrewCards();
  renderArsenal();
  renderChronicle();
  renderReference();
  renderGamePreview();
  calculateRating();
}

document.querySelectorAll("[data-route]").forEach((button) => {
  button.addEventListener("click", () => routeTo(button.dataset.route));
});

document.querySelectorAll("[data-reference-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-reference-tab]").forEach((item) => item.classList.toggle("is-active", item === button));
    document.querySelectorAll(".reference-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === `reference-${button.dataset.referenceTab}`);
    });
  });
});

document.querySelector("#addModelButton").addEventListener("click", () => {
  document.querySelector("#modelDialog").showModal();
});

document.querySelector("#modelForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const model = {
    id: uid(),
    name: data.get("name").trim(),
    cost: Number(data.get("cost")),
    type: data.get("type"),
    keywords: data.get("keywords").trim(),
    versatile: data.get("versatile") === "on",
    outOfKeyword: data.get("outOfKeyword") === "on",
    injuries: 0,
  };
  if (state.campaign.week === 1 && state.games.length > 0) {
    toast("Стартовый арсенал уже зафиксирован. Перейдите к новой неделе для найма.");
    return;
  }
  const projected = arsenalTotals().cost + model.cost;
  if (state.campaign.week === 1 && projected > 25) {
    toast("Стартовый арсенал не может превышать 25 SS.");
    return;
  }
  if (state.campaign.week > 1) {
    const alreadyHired = state.arsenal.models.some((item) => item.addedWeek === state.campaign.week);
    const keywordTax = model.outOfKeyword && !model.versatile ? 1 : 0;
    const hireCost = Math.max(0, model.cost - (alreadyHired ? 0 : 5)) + keywordTax;
    if (hireCost > state.arsenal.scrip) {
      toast(`Для найма нужно ${hireCost} скрип, доступно ${state.arsenal.scrip}.`);
      return;
    }
    model.addedWeek = state.campaign.week;
    model.scripPaid = hireCost;
    state.arsenal.scrip -= hireCost;
  } else {
    model.addedWeek = 1;
    model.scripPaid = 0;
  }
  state.arsenal.models.push(model);
  if (state.campaign.week === 1) {
    state.arsenal.scrip = Math.min(3, Math.max(0, 25 - projected));
  }
  saveState();
  form.reset();
  document.querySelector("#modelDialog").close();
  renderArsenal();
  toast(
    state.campaign.week > 1
      ? `${model.name} нанят за ${model.scripPaid} скрип.`
      : `${model.name} добавлен в стартовый арсенал.`,
  );
});

document.querySelector("#equipmentCatalog").innerHTML = equipment
  .map(([name, br, cc], index) => `<option value="${index}">${name} · BR ${br} · CC ${cc}</option>`)
  .join("");

document.querySelector("#addEquipmentButton").addEventListener("click", () => {
  document.querySelector("#equipmentDialog").showModal();
});

document.querySelector("#equipmentForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const customName = data.get("customName").trim();
  const selected = equipment[Number(data.get("catalog"))];
  const item = customName
    ? { id: uid(), name: customName }
    : { id: uid(), name: selected[0], br: selected[1], cc: selected[2] };
  state.arsenal.equipment.push(item);
  saveState();
  form.reset();
  document.querySelector("#equipmentDialog").close();
  renderArsenal();
  toast(`${item.name} добавлен в хранилище.`);
});

["ratingEquipment", "ratingAdvances", "ratingInjuries"].forEach((id) => {
  document.querySelector(`#${id}`).addEventListener("input", calculateRating);
});

document.querySelector("#gameForm").addEventListener("input", renderGamePreview);
document.querySelectorAll("[data-game-result]").forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    document.querySelectorAll("[data-game-result]").forEach((other) => {
      if (other !== input) other.checked = false;
    });
    if (input.dataset.gameResult === "won") {
      document.querySelectorAll("[data-withdrawal]").forEach((withdrawal) => {
        withdrawal.checked = false;
      });
    }
    renderGamePreview();
  });
});
document.querySelectorAll("[data-withdrawal]").forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    document.querySelectorAll("[data-withdrawal]").forEach((other) => {
      if (other !== input) other.checked = false;
    });
    document.querySelector('[data-game-result="won"]').checked = false;
    document.querySelector('[data-game-result="lost"]').checked = true;
    renderGamePreview();
  });
});
document.querySelector("#gameForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const calculation = renderGamePreview();
  const data = new FormData(event.currentTarget);
  state.games.push({
    id: uid(),
    week: state.campaign.week,
    opponent: data.get("opponent").trim(),
    ...calculation,
  });
  state.arsenal.scrip += calculation.scrip;
  state.leader.xp = Math.min(xpTiers.length, state.leader.xp + calculation.xp);
  saveState();
  event.currentTarget.reset();
  event.currentTarget.elements.vp.value = 0;
  event.currentTarget.elements.ratingGap.value = 0;
  event.currentTarget.elements.schemes.value = 0;
  renderAll();
  toast(`Запись сохранена: +${calculation.scrip} скрип, +${calculation.xp} XP.`);
});

document.querySelector("#exportButton").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  const safeName = (state.crew.name || "m4e-campaign").replace(/[^\p{L}\p{N}-]+/gu, "-").toLowerCase();
  link.href = URL.createObjectURL(blob);
  link.download = `${safeName}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast("Резервная копия экспортирована.");
});

document.querySelector("#importButton").addEventListener("click", () => document.querySelector("#importFile").click());
document.querySelector("#importFile").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    state = mergeDefaults(JSON.parse(await file.text()));
    saveState();
    document.querySelectorAll("[data-bind]").forEach((input) => {
      input.value = getAtPath(input.dataset.bind) ?? "";
    });
    document.querySelectorAll("[data-path-choice]").forEach((input) => {
      input.checked = state.leader.path === input.value;
    });
    renderAll();
    toast("Досье импортировано.");
  } catch {
    toast("Не удалось прочитать файл досье.");
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#printButton").addEventListener("click", () => window.print());
document.querySelector("#resetButton").addEventListener("click", () => {
  if (!window.confirm("Создать новое пустое досье? Текущие данные будут удалены из браузера.")) return;
  state = clone(defaultState);
  saveState();
  document.querySelectorAll("[data-bind]").forEach((input) => {
    input.value = getAtPath(input.dataset.bind) ?? "";
  });
  document.querySelectorAll("[data-path-choice]").forEach((input) => {
    input.checked = state.leader.path === input.value;
  });
  document.querySelector("#gameForm").reset();
  renderAll();
  routeTo("dossier");
  toast("Открыто новое пустое досье.");
});
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.closeDialog}`).close());
});

bindFields();
renderAll();
routeTo(location.hash.slice(1) || "dossier");
