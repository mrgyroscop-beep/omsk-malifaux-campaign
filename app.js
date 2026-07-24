const STORAGE_KEY = "m4e-untold-campaign-v1";

const STATIC_TEXT_EN = {
  "Неписаный реестр": "The Unwritten Index",
  "Новое досье": "New dossier",
  "Неделя 1": "Week 1",
  "Новое": "New",
  "Импорт": "Import",
  "Экспорт": "Export",
  "Печать": "Print",
  "Досье": "Dossier",
  "Кампания и команда": "Campaign & crew",
  "Лидер": "Leader",
  "Архетип и способности": "Archetype & talents",
  "Арсенал": "Arsenal",
  "Модели и снаряжение": "Models & equipment",
  "Хроника": "Chronicle",
  "Недели и последствия": "Weeks & aftermath",
  "Справочник": "Reference",
  "Правила и таблицы": "Rules & tables",
  "Источник": "Source",
  "Campaign Mode · стр. 14–56": "Campaign Mode · pp. 14–56",
  "Запись I · Начало кампании": "Record I · Starting the campaign",
  "Откройте новое досье": "Open a new dossier",
  "Зафиксируйте договорённости группы. Эти сведения станут титульным листом арсенала и основой всех автоматических расчётов.":
    "Record your group’s campaign agreement. These details become the cover sheet for your arsenal and the basis for every automatic calculation.",
  "Идентификация": "Identification",
  "Команда и игрок": "Crew & player",
  "стр. 15": "p. 15",
  "Название команды": "Crew name",
  "Игрок": "Player",
  "Фракция": "Faction",
  "Выберите фракцию": "Choose a faction",
  "Первый ключ": "First keyword",
  "Второй ключ": "Second keyword",
  "Минимум один ключ должен принадлежать выбранной фракции. Модели одного выбранного ключа навсегда получают второй ключ в этой кампании.":
    "At least one keyword must belong to the declared faction. Models with either chosen keyword permanently gain the other keyword for this campaign.",
  "Срок": "Duration",
  "Ритм кампании": "Campaign cadence",
  "стр. 15, 18": "pp. 15, 18",
  "Продолжительность": "Campaign length",
  "8 недель": "8 weeks",
  "Текущая неделя": "Current week",
  "День общего сбора": "Weekly meeting day",
  "Готовность досье": "Dossier readiness",
  "Нужны основные сведения": "Essential details needed",
  "Перейти к лидеру →": "Continue to leader →",
  "Запись II · Уникальная нить Судьбы": "Record II · A unique thread of Fate",
  "Соберите лидера": "Build your leader",
  "Выберите каркас характеристик, затем запишите действия и способности, заимствованные у подходящих союзников.":
    "Choose a stat framework, then record actions and abilities borrowed from eligible allies.",
  "Основа": "Foundation",
  "Архетип": "Archetype",
  "стр. 17": "p. 17",
  "Личное дело": "Personal file",
  "Облик и путь": "Profile & path",
  "стр. 17–18": "pp. 17–18",
  "Имя лидера": "Leader name",
  "Характеристика I": "Characteristic I",
  "Характеристика II": "Characteristic II",
  "Размер Sz": "Size (Sz)",
  "База": "Base",
  "30 мм": "30 mm",
  "40 мм": "40 mm",
  "50 мм": "50 mm",
  "Путь получения опыта": "Experience path",
  "+1 XP, если лидер убил хотя бы одну вражескую не-peon модель.":
    "+1 XP if the leader killed one or more non-Peon enemy models.",
  "+1 XP за Interact в пределах 6″ от вражеской зоны развёртывания.":
    "+1 XP for resolving Interact within 6″ of the enemy deployment zone.",
  "Заимствованные таланты": "Borrowed talents",
  "Действия и способности": "Actions & abilities",
  "Выберите архетип. Билдер покажет допустимое число талантов и предел стоимости модели-источника.":
    "Choose an archetype to see the allowed talents and source-model Cost limits.",
  "Стартовая карта команды": "Starting crew card",
  "Первый общий приём": "First crew effect",
  "стр. 15–16": "pp. 15–16",
  "Запись III · Имущество команды": "Record III · Crew assets",
  "Ведите арсенал": "Manage your arsenal",
  "Стартовый лимит — 25 камней. Лидер добавляется бесплатно; до трёх неистраченных камней превращаются в скрип.":
    "The starting limit is 25 Soulstones. Your leader is free; up to three unspent Soulstones become scrip.",
  "Стоимость моделей": "Model cost",
  "/ 25 SS на старте": "/ 25 SS at start",
  "Моделей": "Models",
  "лидер не считается": "leader not included",
  "Скрип": "Scrip",
  "в текущем досье": "in this dossier",
  "Травм": "Injuries",
  "−1 CR за каждую": "−1 CR each",
  "Состав": "Roster",
  "Модели в арсенале": "Models in arsenal",
  "+ Добавить модель": "+ Add model",
  "Подготовка встречи": "Encounter setup",
  "Рейтинг кампании": "Campaign rating",
  "стр. 19": "p. 19",
  "Снаряжение в игре": "Equipment hired",
  "Продвижения": "Advancements",
  "Травмы в ростере": "Injuries hired",
  "Хранилище": "Storage",
  "Снаряжение": "Equipment",
  "Запись IV · Свидетельства и последствия": "Record IV · Evidence & aftermath",
  "Записывайте игры": "Record your games",
  "Результат встречи превращается в скрип, опыт и новые страницы истории. Калькулятор следует шести фазам Aftermath.":
    "Turn each encounter result into scrip, experience, and another page of your story. The calculator follows all six Aftermath phases.",
  "Новая запись": "New entry",
  "Итог встречи": "Encounter result",
  "стр. 20–35": "pp. 20–35",
  "Соперник": "Opponent",
  "Ваши VP": "Your VP",
  "Разница CR в пользу соперника": "Opponent’s CR advantage",
  "Выполнено схем": "Schemes completed",
  "Победа": "Victory",
  "+1 скрип": "+1 scrip",
  "Поражение": "Defeat",
  "Цель пути": "Path objective",
  "Ранний отход": "Early withdrawal",
  "Ход 1–2: только травмы": "Turn 1–2: injuries only",
  "Поздний отход": "Late withdrawal",
  "Ход 3+: без базовой карты": "Turn 3+: no completion card",
  "Выплата": "Payday",
  "0 скрип": "0 scrip",
  "Опыт лидера": "Leader experience",
  "Записать в хронику": "Add to chronicle",
  "Журнал": "Journal",
  "История кампании": "Campaign history",
  "0 игр": "0 games",
  "Трек развития лидера": "Leader advancement track",
  "стр. 31, 56": "pp. 31, 56",
  "Полученный опыт": "Experience gained",
  "Число внутри — максимальный тир продвижения": "Number shown — maximum advancement tier",
  "Запись V · Полевой указатель": "Record V · Field index",
  "Не листайте книгу в разгар игры": "Keep the book closed during play",
  "Короткие алгоритмы и таблицы для кампании. Формулировки сокращены; спорные случаи сверяйте с оригиналом.":
    "Compact campaign procedures and tables. Text is abbreviated; consult the original book for edge cases.",
  "Цикл кампании": "Campaign flow",
  "Травмы": "Injuries",
  "Продвижение": "Advancement",
  "Новая единица": "New asset",
  "Добавить модель": "Add model",
  "Название": "Name",
  "Стоимость": "Cost",
  "Тип": "Type",
  "Другое": "Other",
  "Ключевые слова": "Keywords",
  "В выбранной фракции": "In the declared faction",
  "Вне ключа": "Out of keyword",
  "+1 скрип при найме": "+1 scrip when hired",
  "Добавить в арсенал": "Add to arsenal",
  "Добавить снаряжение": "Add equipment",
  "Из таблицы книги": "From the book table",
  "Или своё название": "Or enter a custom name",
  "Добавить": "Add",
  "Открыть досье": "Open dossier",
  "Разделы билдера": "Builder sections",
  "Язык интерфейса": "Interface language",
  "Русский": "Russian",
  "Например, Святые из Шахты №7": "For example, Saints of Mine No. 7",
  "Имя владельца досье": "Dossier owner’s name",
  "Например, четверг": "For example, Thursday",
  "Имя, которого ещё нет в Malifaux": "A name not already used in Malifaux",
  "Название команды": "Crew name",
  "Трек опыта лидера": "Leader experience track",
  "Закрыть": "Close",
  "Например, Death Marshal": "For example, Death Marshal",
  "Через запятую": "Comma-separated",
  "Пользовательское снаряжение": "Custom equipment",
};

const UI_MESSAGES = {
  newDossier: { ru: "Новое досье", en: "New dossier" },
  week: { ru: "Неделя {n}", en: "Week {n}" },
  weeks: { ru: "{n} {word}", en: "{n} {word}" },
  dossierComplete: { ru: "Титульный лист заполнен", en: "Cover sheet complete" },
  dossierTakingShape: { ru: "Досье уже обретает форму", en: "The dossier is taking shape" },
  dossierNeedsDetails: { ru: "Нужны основные сведения", en: "Essential details needed" },
  chooseArchetypeTitle: { ru: "Сначала выберите архетип", en: "Choose an archetype first" },
  chooseArchetypeBody: {
    ru: "Ограничения талантов зависят от его специализации.",
    en: "Talent limits depend on its specialization.",
  },
  chooseArchetypeRule: {
    ru: "Выберите архетип. Билдер покажет допустимое число талантов и предел стоимости модели-источника.",
    en: "Choose an archetype to see the allowed talents and source-model Cost limits.",
  },
  talentSource: { ru: "Название · источник", en: "Name · source" },
  costLimit: { ru: "Предел стоимости {n}", en: "Cost limit {n}" },
  emptyArsenalTitle: { ru: "Арсенал пока пуст", en: "The arsenal is empty" },
  emptyArsenalBody: {
    ru: "Добавьте до 25 SS моделей. Лидер уже считается частью команды и ничего не стоит.",
    en: "Add up to 25 SS of models. Your leader is already part of the crew and costs nothing.",
  },
  noKeywords: { ru: "без ключей", en: "no keywords" },
  outOfKeyword: { ru: "вне ключа", en: "out of keyword" },
  inKeyword: { ru: "в ключе", en: "in keyword" },
  injuries: { ru: "Травмы", en: "Injuries" },
  decreaseInjuries: { ru: "Уменьшить травмы", en: "Decrease injuries" },
  addInjury: { ru: "Добавить травму", en: "Add injury" },
  deleteItem: { ru: "Удалить", en: "Delete" },
  emptyEquipmentTitle: { ru: "Пусто", en: "Empty" },
  emptyEquipmentBody: {
    ru: "Предметы появятся после Barter или особых эффектов.",
    en: "Equipment appears here after Barter or special effects.",
  },
  customEntry: { ru: "Пользовательская запись", en: "Custom entry" },
  peonNoInjuries: { ru: "Peon не получает травм.", en: "Peons do not gain injuries." },
  threeInjuries: {
    ru: "Три травмы: в конце Determine Injuries модель аннигилируется.",
    en: "Three injuries: the model is annihilated at the end of Determine Injuries.",
  },
  scripAmount: { ru: "{n} скрип", en: "{n} scrip" },
  strategistGoal: { ru: "Interact в 6″ от зоны врага", en: "Interact within 6″ of the enemy deployment zone" },
  bruiserGoal: { ru: "Лидер убил non-peon врага", en: "Leader killed a non-Peon enemy" },
  gameCount: { ru: "{n} {word}", en: "{n} {word}" },
  emptyHistoryTitle: { ru: "История ещё не написана", en: "The story has not begun" },
  emptyHistoryBody: {
    ru: "Запишите первую игру — начисления попадут сюда и в трек лидера.",
    en: "Record your first game to add its rewards here and to the leader track.",
  },
  unknownOpponent: { ru: "Неизвестный соперник", en: "Unknown opponent" },
  resultWin: { ru: "победа", en: "victory" },
  resultLoss: { ru: "поражение", en: "defeat" },
  resultDraw: { ru: "ничья", en: "draw" },
  setExperience: { ru: "Установить опыт: {n}", en: "Set experience: {n}" },
  experienceSet: { ru: "Опыт лидера: {n}.", en: "Leader experience: {n}." },
  startingArsenalLocked: {
    ru: "Стартовый арсенал уже зафиксирован. Перейдите к новой неделе для найма.",
    en: "The starting arsenal is locked. Advance to a new week before hiring.",
  },
  startingLimit: { ru: "Стартовый арсенал не может превышать 25 SS.", en: "The starting arsenal cannot exceed 25 SS." },
  hireNeedsScrip: {
    ru: "Для найма нужно {cost} скрип, доступно {available}.",
    en: "This hire costs {cost} scrip; only {available} is available.",
  },
  hired: { ru: "{name} нанят за {cost} скрип.", en: "{name} hired for {cost} scrip." },
  addedToStarting: { ru: "{name} добавлен в стартовый арсенал.", en: "{name} added to the starting arsenal." },
  equipmentAdded: { ru: "{name} добавлен в хранилище.", en: "{name} added to storage." },
  gameSaved: {
    ru: "Запись сохранена: +{scrip} скрип, +{xp} XP.",
    en: "Entry saved: +{scrip} scrip, +{xp} XP.",
  },
  backupExported: { ru: "Резервная копия экспортирована.", en: "Backup exported." },
  dossierImported: { ru: "Досье импортировано.", en: "Dossier imported." },
  importFailed: { ru: "Не удалось прочитать файл досье.", en: "Could not read the dossier file." },
  resetConfirm: {
    ru: "Создать новое пустое досье? Текущие данные будут удалены из браузера.",
    en: "Create a new empty dossier? Current browser data will be deleted.",
  },
  dossierReset: { ru: "Открыто новое пустое досье.", en: "A new empty dossier is open." },
};

const LOCALE_KEY = "m4e-untold-locale";
let currentLocale =
  localStorage.getItem(LOCALE_KEY) || (navigator.language?.toLowerCase().startsWith("en") ? "en" : "ru");

function localized(ru, en) {
  return currentLocale === "en" ? en : ru;
}

function message(key, values = {}) {
  let result = UI_MESSAGES[key]?.[currentLocale] ?? UI_MESSAGES[key]?.ru ?? key;
  Object.entries(values).forEach(([name, value]) => {
    result = result.replaceAll(`{${name}}`, String(value));
  });
  return result;
}

function countWord(number, type) {
  if (currentLocale === "en") {
    if (type === "week") return number === 1 ? "week" : "weeks";
    return number === 1 ? "game" : "games";
  }
  return type === "week"
    ? plural(number, ["неделя", "недели", "недель"])
    : plural(number, ["игра", "игры", "игр"]);
}

function displayModelType(type) {
  if (type === "Other") return localized("Другое", "Other");
  return type;
}

function displayBr(br) {
  return br === "Всегда" ? localized("Всегда", "Always Available") : br;
}

const archetypes = {
  "Lucky Upstart": {
    label: "Счастливчик",
    labelEn: "Lucky Upstart",
    tagline: "Сбалансирован и начинает с особого предмета.",
    taglineEn: "Balanced and starts with a special piece of equipment.",
    stats: { Df: 6, Wp: 6, Sp: 6, Health: 14 },
    talents: [
      { type: "Атака", typeEn: "Attack", limit: 6 },
      { type: "Способность", typeEn: "Ability", limit: 6 },
    ],
    rule:
      "Атака и способность берутся у союзников стоимостью 6 или меньше. Затем сделайте нечитаемый обманом флип и бесплатно получите предмет с точно совпавшим BR; он не учитывается в CR и возвращается после аннигиляции.",
    ruleEn:
      "Choose an Attack Action and an Ability from allies with Cost 6 or less. Then make an uncheatable flip and add matching equipment for free; it never counts toward CR and returns after being annihilated.",
  },
  Generalist: {
    label: "Универсал",
    labelEn: "Generalist",
    tagline: "По одному таланту каждого типа.",
    taglineEn: "One talent of every type.",
    stats: { Df: 5, Wp: 5, Sp: 6, Health: 14 },
    talents: [
      { type: "Атака", typeEn: "Attack", limit: 7 },
      { type: "Тактика", typeEn: "Tactical", limit: 7 },
      { type: "Способность", typeEn: "Ability", limit: 7 },
    ],
    rule: "Атака, тактика и способность берутся у союзников стоимостью 7 или меньше.",
    ruleEn: "Choose one Attack Action, one Tactical Action, and one Ability from allies with Cost 7 or less.",
  },
  "Heavy Hitter": {
    label: "Тяжеловес",
    labelEn: "Heavy Hitter",
    tagline: "Мощная атака с одним выбранным триггером.",
    taglineEn: "A powerful attack with one chosen Trigger.",
    stats: { Df: 6, Wp: 4, Sp: 6, Health: 14 },
    talents: [
      { type: "Атака + триггер", typeEn: "Attack + Trigger", limit: 10 },
      { type: "Тактика", typeEn: "Tactical", limit: 5 },
    ],
    rule:
      "Атака берётся у союзника стоимостью 10 или меньше и сохраняет один выбранный триггер. Тактика — у союзника стоимостью 5 или меньше.",
    ruleEn:
      "Choose an Attack Action from an ally with Cost 10 or less and keep one Trigger from that Action. Choose a Tactical Action from an ally with Cost 5 or less.",
  },
  Schemer: {
    label: "Интриган",
    labelEn: "Schemer",
    tagline: "Быстрый специалист по тактическим приёмам.",
    taglineEn: "A fast specialist with a deep tactical toolkit.",
    stats: { Df: 6, Wp: 5, Sp: 7, Health: 13 },
    talents: [
      { type: "Атака", typeEn: "Attack", limit: 5 },
      { type: "Тактика I", typeEn: "Tactical I", limit: 8 },
      { type: "Тактика II", typeEn: "Tactical II", limit: 8 },
      { type: "Способность", typeEn: "Ability", limit: 8 },
    ],
    rule:
      "Атака берётся у союзника стоимостью 5 или меньше; две тактики и способность — у союзников стоимостью 8 или меньше.",
    ruleEn:
      "Choose an Attack Action from an ally with Cost 5 or less; choose two Tactical Actions and an Ability from allies with Cost 8 or less.",
  },
  "Talented Individual": {
    label: "Самородок",
    labelEn: "Talented Individual",
    tagline: "Две способности и гибкий набор действий.",
    taglineEn: "Two Abilities and a flexible mix of Actions.",
    stats: { Df: 5, Wp: 5, Sp: 5, Health: 13 },
    talents: [
      { type: "Атака", typeEn: "Attack", limit: 6 },
      { type: "Тактика", typeEn: "Tactical", limit: 6 },
      { type: "Способность I", typeEn: "Ability I", limit: 8 },
      { type: "Способность II", typeEn: "Ability II", limit: 8 },
    ],
    rule:
      "Атака и тактика берутся у союзников стоимостью 6 или меньше; две способности — у союзников стоимостью 8 или меньше.",
    ruleEn:
      "Choose an Attack Action and a Tactical Action from allies with Cost 6 or less; choose two Abilities from allies with Cost 8 or less.",
  },
};

const crewCards = [
  {
    id: "expert-coordination",
    name: "Expert Coordination",
    text: "При активации модель может drain Soulstone, чтобы пройти до 3″.",
    textEn: "When this model Activates, it may drain a Soulstone to move up to 3″.",
  },
  {
    id: "shape-landscape",
    name: "Shape the Landscape",
    text: "При активации модель может drain Soulstone, чтобы создать выбранный маркер в 1″.",
    textEn: "When this model Activates, it may drain a Soulstone to make the chosen marker within 1″.",
  },
  {
    id: "heavy-blow",
    name: "Heavy Blow",
    text: "После урона врагу действием можно drain Soulstone и нанести +1 урон.",
    textEn: "After this model deals damage to an enemy with an Action, it may drain a Soulstone to deal +1 damage.",
  },
  {
    id: "unusual-specialty",
    name: "Unusual Specialty",
    text: "При активации можно drain Soulstone и получить выбранный разрешённый токен.",
    textEn: "When this model Activates, it may drain a Soulstone to gain the chosen allowed token.",
  },
  {
    id: "the-plan",
    name: "The Plan Comes Together",
    text: "Союзник в 6″ проходит до 3″, затем объявляет Interact по Strategy marker.",
    textEn: "An Ally within 6″ may move up to 3″, then declare Interact targeting a Strategy Marker.",
  },
  {
    id: "forbidden-curse",
    name: "Forbidden Curse",
    text: "Атака Wp в 6″: цель получает выбранный разрешённый токен.",
    textEn: "A 6″ Wp Attack that gives the target the chosen allowed token.",
  },
  {
    id: "specialized-tools",
    name: "Specialized Tools",
    text: "Союзник в 6″ прикрепляет upgrade выбранного разрешённого типа.",
    textEn: "An Ally within 6″ Attach an Upgrade of the chosen allowed type.",
  },
  {
    id: "prepared",
    name: "Prepared For Anything",
    text: "При активации модель может drain Soulstone, чтобы объявить Prepare.",
    textEn: "When this model Activates, it may drain a Soulstone to declare Prepare.",
  },
  {
    id: "scavenger",
    name: "Scavenger’s Instinct",
    text: "Убив врага, модель может drain Soulstone: взять карту и исцелить 1.",
    textEn: "After killing an enemy, this model may drain a Soulstone to draw a card and Heal 1.",
  },
  {
    id: "inhuman",
    name: "Inhuman Determination",
    text: "При активации можно drain Soulstone: исцелить 2 и пройти до 1″.",
    textEn: "When this model Activates, it may drain a Soulstone to Heal 2 and move up to 1″.",
  },
  {
    id: "loot-stash",
    name: "Loot Their Stash",
    text: "На половине врага сделайте флип и временно получите предмет с равным BR.",
    textEn: "On the enemy table half, flip and temporarily Attach equipment with matching BR.",
  },
  {
    id: "sadistic",
    name: "Sadistic Blow",
    text: "Ближняя атака; при raise цель получает Injured token.",
    textEn: "A melee Attack; with a Raise, the target gains an Injured Token.",
  },
];

const equipment = [
  ["Lucky Gremlin Foot", "Всегда", 1, "Предотвращает получение травмы, затем аннигилируется.", "Prevents an Injury, then is annihilated."],
  ["Pistol", "Всегда", 1, "Атака Skl 5, ближняя 1″ или дальняя 8″, урон 2.", "Skl 5 Attack, melee 1″ or ranged 8″, damage 2."],
  ["Sword", "Всегда", 1, "Ближняя атака 1″, Skl +5, урон 2.", "Melee 1″ Attack, Skl +5, damage 2."],
  ["Trusty Rifle", "Всегда", 1, "Дальняя атака 14″, Skl 5, урон 2.", "Ranged 14″ Attack, Skl 5, damage 2."],
  ["Helmet", "1 R/M", 2, "Hard to Kill.", "Hard to Kill."],
  ["Healing Salve", "1 R/M", 1, "Аннигилировать при активации: исцелить 15.", "Annihilate when Activating to Heal 15."],
  ["Blackjack", "1 R/M", 2, "Ближняя атака и перемещение цели.", "Melee Attack that moves the target."],
  ["Leg Breaker", "1 C/T", 2, "При raise цель немедленно делает injury flip.", "With a Raise, the target immediately makes an Injury flip."],
  ["Warming Flask", "1 C/T", 2, "Лечит союзника; больше лечения за raises.", "Heals an Ally, with additional healing for Raises."],
  ["Lead-Lined Coat", "1 C/T", 3, "Armor: раз за активацию снизить урон на 1.", "Armor: once per Activation, reduce damage by 1."],
  ["Flamethrower", "2 R/M", 2, "Дальняя атака 10″; Burning вокруг цели.", "Ranged 10″ Attack; applies Burning around the target."],
  ["Stage Hook", "2 R/M", 2, "Передвигает другую дружественную модель до 4″.", "Moves another friendly model up to 4″."],
  ["Guardian’s Shield", "2 R/M", 2, "Juggernaut: урон свыше 3 становится равен 3.", "Juggernaut: damage greater than 3 is reduced to 3."],
  ["Death Curse", "2 C/T", 2, "Убивший модель враг делает injury flip.", "The enemy that kills this model makes an Injury flip."],
  ["Twin Katanas", "2 C/T", 3, "Ближняя атака и рывок к врагу за Soulstone.", "Melee Attack with a Soulstone-powered rush toward an enemy."],
  ["Thieves’ Tools", "2 C/T", 2, "Может похитить снаряжение цели при raise.", "May steal the target’s equipment with a Raise."],
  ["Carrier Pigeon", "3 R/M", 2, "Создаёт Scheme marker рядом с союзником.", "Makes a Scheme Marker in base contact with an Ally."],
  ["Vengeful Vow", "3 C/T", 2, "Только лидер: +1 XP за убийство unique после аннигиляции.", "Leader only: annihilate after killing a Unique enemy to gain +1 XP."],
  ["Aetheric Displacer", "3 C/T", 3, "После промаха врага — place в пределах 3″.", "After an enemy Attack fails, Place within 3″."],
  ["Coffee", "4 R/M", 1, "Аннигилировать при активации: получить Fast.", "Annihilate when Activating to gain Fast."],
  ["Sniper’s Scope", "4 R/M", 1, "Дальние действия игнорируют cover и concealment.", "Ranged Actions ignore Cover and Concealment."],
  ["Gatling Gun", "4 C/T", 2, "Дальняя атака 12″, получает + без cover.", "Ranged 12″ Attack that gains + if the target lacks Cover."],
  ["Snake Oil", "5 R/M", 1, "Снять любое число токенов и, возможно, infuse Soulstone.", "Remove any number of Tokens and potentially infuse a Soulstone."],
  ["Assassin’s Blade", "5 C/T", 2, "Цель сбрасывает карту / drain Soulstone, иначе погибает.", "The target discards a card or drains a Soulstone; otherwise it is killed."],
  ["Whiskey", "6 R/M", 1, "Сбросить при активации: + ко всем дуэлям до End Phase.", "Discard when Activating to gain + to all duels until the End Phase."],
  ["Escape Coil", "6 R/M", 2, "После урона drain Soulstone: place к союзнику в 6″.", "After taking damage, drain a Soulstone to Place into base contact with an Ally within 6″."],
  ["Hag’s Kiss", "6 C/T", 2, "Wp-атака: Stunned и Slow.", "Wp Attack that gives Stunned and Slow."],
  ["Metal Skull Plate", "7 R/M", 3, "Может Charge по масти верхней карты сброса.", "May declare Charge based on the suit of the top discard."],
  ["Barbed Whip", "7 R/M", 2, "Ближняя атака с дистанцией 4″.", "Melee Attack with a 4″ range."],
  ["Lasso", "7 R/M", 2, "Подтягивает цель; при raise даёт Slow.", "Pulls the target closer; gives Slow with a Raise."],
  ["Trash Can", "7 C/T", 3, "Удаляет маркер.", "Removes a Marker."],
  ["Dark Crystal", "13 C/T", 1, "Рискованный сценарный эффект на половине врага.", "A risky scenario effect used on the enemy table half."],
  ["Hurled Luggage", "13 C/T", 2, "Создаёт Scheme marker рядом с целью.", "Makes a Scheme Marker in base contact with the target."],
  ["Dead Man’s Switch", "13 C/T", 1, "Demise: 3 irreducible damage врагам в 3″.", "Demise: deals 3 irreducible damage to enemies within 3″."],
];

const injuries = [
  ["Black Joker", "Traitor", "Если не лидер/тотем: модель аннигилируется и может бесплатно перейти противнику.", "If not a Leader or Totem, the model is annihilated and may join the opposing arsenal for free."],
  ["1–2 R/M", "Just a Flesh Wound", "Травма не получена.", "No Injury is gained."],
  ["3 R/M", "Severe Amputation", "Максимальное здоровье −2.", "Reduce maximum Health by 2."],
  ["4 R/M", "Pack Mule", "После гибели противник может поставить Scheme marker рядом.", "When killed, the opponent may make a Scheme Marker in base contact."],
  ["5 R/M", "Headstrong", "Стоимость +1; лидер и тотем перебрасывают.", "Increase Cost by 1; Leaders and Totems reflip."],
  ["6 R/M", "Permanent Hex", "1 урон себе, чтобы объявлять триггеры.", "Suffer 1 damage to declare Triggers."],
  ["7 R/M", "Senseless", "В начале активации сбросить карту или получить Slow.", "At the start of its Activation, discard a card or gain Slow."],
  ["8 R/M", "Mangled Limb", "−1 Skl ко всем атакам.", "−1 Skl to all Attack Actions."],
  ["9 R/M", "Leadfooted", "−1 Sp.", "−1 Sp."],
  ["10 R/M", "Defenseless", "Получает +1 урон каждый раз, когда ей наносят урон.", "Whenever dealt damage, suffer +1 damage."],
  ["11 R/M", "Loose Lips", "Враги в 3″ могут объявлять действия с карты модели.", "Enemies within 3″ may declare Actions printed on this model’s card."],
  ["12 R/M", "Blood Debt", "Особое условие снятия; противник может обменять травму на 1 VP.", "Has a special removal condition; the opponent may exchange it for 1 VP at game end."],
  ["13 R/M", "Killed Off", "Модель аннигилируется.", "Annihilate this model."],
  ["1–2 C/T", "Just a Flesh Wound", "Травма не получена.", "No Injury is gained."],
  ["3 C/T", "Distracted by Voices", "−2 Wp.", "−2 Wp."],
  ["4 C/T", "Always Wandering", "Выходит в Start Phase второго хода, затем травма аннигилируется.", "Deploy in the Start Phase of Turn 2, then annihilate this Injury."],
  ["5 C/T", "Fugitive", "При следующей гибели враг получает 2 скрип; затем травма исчезает.", "The next time this model is killed, the opponent gains 2 scrip; then annihilate this Injury."],
  ["6 C/T", "One Last Job", "После Interact модель погибает.", "After resolving Interact, this model is killed."],
  ["7 C/T", "Off Balance", "− к Df и Wp дуэлям.", "− to Df and Wp duels."],
  ["8 C/T", "Barely Holding Together", "Нельзя объявлять Charge.", "This model may not declare Charge."],
  ["9 C/T", "Dulled Edge", "−1 Df.", "−1 Df."],
  ["10 C/T", "Missing Fingers", "Без сброса карты signature-символы пусты до End Phase.", "Unless it discards a card, treat signature symbols as blank until the End Phase."],
  ["11 C/T", "Brittle Bones", "Атакующий получает + при атаке этой модели.", "Attackers gain + when targeting this model with an Attack Action."],
  ["12 C/T", "Blackmailed", "Враг может аннигилировать травму и заставить модель объявить действие.", "The enemy may annihilate this Injury to make this model declare an Action under enemy control."],
  ["13 C/T", "Killed Off", "Модель аннигилируется.", "Annihilate this model."],
  ["Red Joker", "Close Call", "При обычном флипе перейдите к Lucky Miss; при cheat травмы нет.", "If flipped, resolve Lucky Miss; if cheated, no Injury is gained."],
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

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLocale;
  document.title = localized(
    "Неписаный реестр — M4E Campaign Builder",
    "The Unwritten Index — M4E Campaign Builder",
  );
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.content = localized(
      "Локальный билдер кампании Malifaux Fourth Edition по Index of the Untold.",
      "A local Malifaux Fourth Edition campaign builder for Index of the Untold.",
    );
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest("script, style")) continue;
    const normalized = node.__i18nRu || normalizeText(node.nodeValue);
    if (!STATIC_TEXT_EN[normalized]) continue;
    if (!node.__i18nRu) {
      node.__i18nRu = normalized;
      node.__i18nLeading = node.nodeValue.match(/^\s*/)?.[0] || "";
      node.__i18nTrailing = node.nodeValue.match(/\s*$/)?.[0] || "";
    }
    node.nodeValue =
      node.__i18nLeading +
      (currentLocale === "en" ? STATIC_TEXT_EN[node.__i18nRu] : node.__i18nRu) +
      node.__i18nTrailing;
  }

  document.querySelectorAll("[placeholder], [aria-label]").forEach((element) => {
    ["placeholder", "aria-label"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const cacheKey = attribute === "placeholder" ? "i18nPlaceholderRu" : "i18nAriaRu";
      const original = element.dataset[cacheKey] || element.getAttribute(attribute);
      if (!STATIC_TEXT_EN[original]) return;
      element.dataset[cacheKey] = original;
      element.setAttribute(attribute, currentLocale === "en" ? STATIC_TEXT_EN[original] : original);
    });
  });

  document.querySelectorAll("[data-locale]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.locale === currentLocale);
    button.setAttribute("aria-pressed", String(button.dataset.locale === currentLocale));
  });
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
  document.querySelector("#headerCampaign").textContent = state.crew.name || message("newDossier");
  document.querySelector("#headerWeek").textContent = message("week", { n: state.campaign.week });
  document.querySelector("#campaignLengthOutput").textContent =
    message("weeks", { n: state.campaign.length, word: countWord(state.campaign.length, "week") });
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
    progress === 100
      ? message("dossierComplete")
      : progress >= 50
        ? message("dossierTakingShape")
        : message("dossierNeedsDetails");
}

function renderArchetypes() {
  const grid = document.querySelector("#archetypeGrid");
  grid.innerHTML = Object.entries(archetypes)
    .map(([id, data], index) => {
      const selected = state.leader.archetype === id;
      return `
        <button class="archetype-card ${selected ? "is-selected" : ""}" type="button" data-archetype="${id}">
          <span class="archetype-number">0${index + 1}</span>
          <h3>${localized(data.label, data.labelEn)}</h3>
          <p>${localized(data.tagline, data.taglineEn)}</p>
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
        <div><strong>${message("chooseArchetypeTitle")}</strong><p>${message("chooseArchetypeBody")}</p></div>
      </div>`;
    document.querySelector("#archetypeRule").textContent = message("chooseArchetypeRule");
    return;
  }

  document.querySelector("#archetypeRule").textContent = localized(data.rule, data.ruleEn);
  wrap.innerHTML = data.talents
    .map((talent, index) => {
      const saved = state.leader.talents[index] || { name: "", source: "" };
      return `
        <div class="talent-row">
          <span class="talent-type">${localized(talent.type, talent.typeEn)}</span>
          <label class="field">
            <span>${message("talentSource")}</span>
            <input data-talent-name="${index}" value="${escapeHtml(saved.name)}" placeholder="Peacebringer · Death Marshal" />
          </label>
          <label class="field">
            <span>Cost ≤</span>
            <input value="${talent.limit}" readonly aria-label="${message("costLimit", { n: talent.limit })}" />
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
          <p>${localized(card.text, card.textEn)}</p>
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
          <strong>${message("emptyArsenalTitle")}</strong>
          <p>${message("emptyArsenalBody")}</p>
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
              <small>${escapeHtml(displayModelType(model.type))} · ${escapeHtml(model.keywords || message("noKeywords"))}</small>
            </span>
            <span class="model-badge">${model.outOfKeyword ? message("outOfKeyword") : model.versatile ? "versatile" : message("inKeyword")}</span>
            <span class="mini-stepper">
              ${message("injuries")}
              <button type="button" data-injury-minus="${model.id}" aria-label="${message("decreaseInjuries")}">−</button>
              <b>${model.injuries || 0}</b>
              <button type="button" data-injury-plus="${model.id}" aria-label="${message("addInjury")}">+</button>
            </span>
            <button class="row-delete" type="button" data-delete-model="${model.id}" aria-label="${message("deleteItem")} ${escapeHtml(model.name)}">×</button>
          </div>`,
      )
      .join("");
  }

  const equipmentWrap = document.querySelector("#equipmentList");
  if (!state.arsenal.equipment.length) {
    equipmentWrap.innerHTML = `<div class="empty-state"><div><strong>${message("emptyEquipmentTitle")}</strong><p>${message("emptyEquipmentBody")}</p></div></div>`;
  } else {
    equipmentWrap.innerHTML = state.arsenal.equipment
      .map(
        (item) => `
          <div class="equipment-item">
            <b>${escapeHtml(item.name)}</b>
            <button class="row-delete" type="button" data-delete-equipment="${item.id}" aria-label="${message("deleteItem")}">×</button>
            <small>${item.cc != null ? `CC ${item.cc} · BR ${displayBr(item.br)}` : message("customEntry")}</small>
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
    toast(message("peonNoInjuries"));
    return;
  }
  model.injuries = Math.max(0, Math.min(3, Number(model.injuries || 0) + delta));
  if (model.injuries >= 3) toast(message("threeInjuries"));
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
  document.querySelector("#previewScrip").textContent = message("scripAmount", { n: scrip });
  document.querySelector("#previewXp").textContent = `${xp} XP`;
  document.querySelector("#pathGoalLabel").textContent =
    state.leader.path === "Strategist" ? message("strategistGoal") : message("bruiserGoal");
  return { vp, schemes, won, lost, pathGoal, withdrewEarly, withdrewLate, gap, hand, scrip, xp };
}

function renderChronicle() {
  const log = document.querySelector("#gameLog");
  document.querySelector("#gameCount").textContent = message("gameCount", {
    n: state.games.length,
    word: countWord(state.games.length, "game"),
  });
  if (!state.games.length) {
    log.innerHTML = `<div class="empty-state"><div><strong>${message("emptyHistoryTitle")}</strong><p>${message("emptyHistoryBody")}</p></div></div>`;
  } else {
    log.innerHTML = [...state.games]
      .reverse()
      .map(
        (game, reverseIndex) => `
          <div class="game-entry">
            <span class="game-entry-number">${String(state.games.length - reverseIndex).padStart(2, "0")}</span>
            <span>
              <b>${escapeHtml(game.opponent || message("unknownOpponent"))}</b>
              <p>${message("week", { n: game.week })} · ${game.vp} VP · ${game.won ? message("resultWin") : game.lost ? message("resultLoss") : message("resultDraw")}</p>
            </span>
            <span class="game-entry-gain">+${game.scrip} ${localized("скрип", "scrip")}<br>+${game.xp} XP</span>
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
          type="button" data-xp-index="${index}" title="${message("setExperience", { n: index + 1 })}">
          ${tier || ""}
        </button>`,
    )
    .join("");
  track.querySelectorAll("[data-xp-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.leader.xp = Number(button.dataset.xpIndex) + 1;
      saveState();
      renderXpTrack();
      toast(message("experienceSet", { n: state.leader.xp }));
    });
  });
}

function renderReference() {
  const flow = [
    ["01", localized("Начало недели", "Start of a new week"), localized("Начиная со второй недели каждый игрок нанимает минимум одну модель. Первая модель недели стоит на 5 скрип меньше.", "From Week 2 onward, each player hires at least one model. The first model hired each week costs 5 fewer scrip.")],
    ["02", localized("Подготовка", "Setup"), localized("Размер встречи не выше стоимости меньшего арсенала +6. Нанимать можно только из своего арсенала.", "Maximum encounter size is the smaller arsenal’s total Cost +6. Crews may hire only from their own arsenal.")],
    ["03", localized("Рейтинг", "Rating"), localized("Снаряжение в выбранной команде + продвижения лидера и тотема − травмы выбранных моделей.", "Equipment hired + Leader and Totem advancements − Injuries on hired models.")],
    ["04", localized("Игра", "Play"), localized("Можно сделать Strategic Withdrawal в Start Phase. Ранний отход лишает VP, Barter, руки и выплаты.", "A crew may make a Strategic Withdrawal in the Start Phase. An early withdrawal forfeits VP, Barter, the Aftermath Hand, and Payday.")],
    ["05", "Aftermath", localized("Рука → Payday → Barter → развитие лидера → доктор → травмы. Флипы делаются строго по очереди.", "Hand → Payday → Barter → Advance Leader → Back-Alley Doctor → Injuries. Resolve flips one at a time, in order.")],
    ["06", localized("Новая глава", "Next chapter"), localized("Сохраняйте арсенал, скрип, травмы и продвижения до конца согласованных 4–12 недель.", "Keep the arsenal, scrip, Injuries, and advancements until the agreed 4–12 week campaign ends.")],
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
    [localized("Флип", "Flip"), localized("Травма", "Injury"), localized("Краткий эффект", "Summary")],
    injuries.map(([flip, name, ru, en]) => [flip, name, localized(ru, en)]),
  );
  document.querySelector("#reference-equipment").innerHTML = tableHtml(
    ["BR", localized("Предмет", "Equipment"), localized("CC / краткий эффект", "CC / summary")],
    equipment.map(([name, br, cc, ru, en]) => [displayBr(br), name, `CC ${cc}. ${localized(ru, en)}`]),
  );

  const tiers = [
    [localized("Тир I", "Tier I"), localized("Модификации", "Modifications"), ["Attack Modification", "Tactical Modification"]],
    [localized("Тир II", "Tier II"), localized("Новые таланты", "New talents"), ["Action Advancement", "Ability Advancement"]],
    [localized("Тир III", "Tier III"), localized("Переломный момент", "Turning point"), ["Totem Advancement", localized("Summoning Advancement · один раз", "Summoning Advancement · once")]],
    [localized("Тир IV", "Tier IV"), localized("Наследие команды", "Crew legacy"), ["Crew Card Advancement", localized("Эффект карты мастера с общим ключом", "An eligible effect from a Master’s Crew Card")]],
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
              <small>${localized("При достижении пронумерованной ячейки можно выбрать таблицу этого тира или ниже.", "When a numbered box is reached, choose an Advancement Table of that tier or lower.")}</small>
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

function renderEquipmentCatalog() {
  const catalog = document.querySelector("#equipmentCatalog");
  const selectedValue = catalog.value;
  catalog.innerHTML = equipment
    .map(
      ([name, br, cc], index) =>
        `<option value="${index}">${name} · BR ${displayBr(br)} · CC ${cc}</option>`,
    )
    .join("");
  if (selectedValue) catalog.value = selectedValue;
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
  renderEquipmentCatalog();
  renderGamePreview();
  calculateRating();
  applyStaticTranslations();
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
    toast(message("startingArsenalLocked"));
    return;
  }
  const projected = arsenalTotals().cost + model.cost;
  if (state.campaign.week === 1 && projected > 25) {
    toast(message("startingLimit"));
    return;
  }
  if (state.campaign.week > 1) {
    const alreadyHired = state.arsenal.models.some((item) => item.addedWeek === state.campaign.week);
    const keywordTax = model.outOfKeyword && !model.versatile ? 1 : 0;
    const hireCost = Math.max(0, model.cost - (alreadyHired ? 0 : 5)) + keywordTax;
    if (hireCost > state.arsenal.scrip) {
      toast(message("hireNeedsScrip", { cost: hireCost, available: state.arsenal.scrip }));
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
      ? message("hired", { name: model.name, cost: model.scripPaid })
      : message("addedToStarting", { name: model.name }),
  );
});

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
  toast(message("equipmentAdded", { name: item.name }));
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
  toast(message("gameSaved", { scrip: calculation.scrip, xp: calculation.xp }));
});

document.querySelector("#exportButton").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  const safeName = (state.crew.name || "m4e-campaign").replace(/[^\p{L}\p{N}-]+/gu, "-").toLowerCase();
  link.href = URL.createObjectURL(blob);
  link.download = `${safeName}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast(message("backupExported"));
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
    toast(message("dossierImported"));
  } catch {
    toast(message("importFailed"));
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#printButton").addEventListener("click", () => window.print());
document.querySelector("#resetButton").addEventListener("click", () => {
  if (!window.confirm(message("resetConfirm"))) return;
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
  toast(message("dossierReset"));
});
document.querySelectorAll("[data-locale]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextLocale = button.dataset.locale;
    if (!["ru", "en"].includes(nextLocale) || nextLocale === currentLocale) return;
    currentLocale = nextLocale;
    localStorage.setItem(LOCALE_KEY, currentLocale);
    renderAll();
  });
});
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.closeDialog}`).close());
});

bindFields();
renderAll();
routeTo(location.hash.slice(1) || "dossier");
