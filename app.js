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
  "Существующие ключевые слова": "Existing keywords",
  "Минимум один ключ должен принадлежать выбранной фракции. Модели одного выбранного ключа навсегда получают второй ключ в этой кампании.":
    "Each player chooses two keywords, at least one of which contains a model belonging to their declared faction. You may hire models from either of these keywords without penalty. Models added to your arsenal from one of these keywords permanently gain the second keyword for the duration of the campaign.",
  "Срок": "Duration",
  "Ритм кампании": "Campaign cadence",
  "стр. 15, 18": "pp. 15, 18",
  "Продолжительность": "Campaign length",
  "До 14 недель для кооперативной кампании": "Up to 14 weeks for a cooperative campaign",
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
    "1 Experience Point if your leader is a Bruiser and killed one or more non-peon enemy models.",
  "+1 XP за Interact в пределах 6″ от вражеской зоны развёртывания.":
    "1 Experience Point if your leader is a Strategist and resolves one or more Interact actions within 6\" of the enemy deployment zone.",
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
    "Each player has 25 soulstones to add models into their starting arsenal. Players do not spend any soulstones to add their leader into their arsenal. Each soulstone a player chooses not to spend during this step becomes one scrip, up to a maximum of three scrip.",
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
  "Ход 1–2: только травмы":
    "If the crew withdrew on or before the second turn, then that crew receives no VP, barter flips, or aftermath hand and loses any scrip earned during the game.",
  "Поздний отход": "Late withdrawal",
  "Ход 3+: без базовой карты":
    "If the crew withdrew on or after the third turn, then the crew that did not withdraw may use any remaining turns to try to score VP.",
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
    "The English rules text below is reproduced verbatim from Index of the Untold.",
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
  "Характеристика модели": "Model characteristic",
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
  "Каталог карточек · BiggerHat": "Card catalog · BiggerHat",
  "Найдите модель и заполните поля автоматически": "Find a model and fill in the fields automatically",
  "Обновить каталог": "Refresh catalog",
  "Поиск модели": "Model search",
  "Название, ключевое слово или фракция": "Name, keyword, or faction",
  "или заполните вручную": "or enter manually",
  "Заимствованный талант": "Borrowed talent",
  "Выбрать с карточки": "Choose from a card",
  "Источник · BiggerHat": "Source · BiggerHat",
  "Сначала выберите модель-источник": "First choose a source model",
  "Поиск модели-источника": "Source model search",
  "Выберите модель": "Choose a model",
  "Здесь появятся подходящие действия или способности с её карточки.":
    "Matching actions or abilities from its card will appear here.",
  "Снимок карточки · BiggerHat": "Card snapshot · BiggerHat",
  "Карточка модели": "Model card",
};

const UI_MESSAGES = {
  newDossier: { ru: "Новое досье", en: "New dossier" },
  week: { ru: "Неделя {n}", en: "Week {n}" },
  weeks: { ru: "{n} {word}", en: "{n} {word}" },
  dossierComplete: { ru: "Титульный лист заполнен", en: "Cover sheet complete" },
  dossierTakingShape: { ru: "Досье уже обретает форму", en: "The dossier is taking shape" },
  dossierNeedsDetails: { ru: "Нужны основные сведения", en: "Essential details needed" },
  keywordHint: {
    ru: "Свободный ввод · проверка по BiggerHat",
    en: "Free entry · validated with BiggerHat",
  },
  keywordChecking: {
    ru: "Проверяю по каталогу BiggerHat…",
    en: "Checking the BiggerHat catalog…",
  },
  keywordValid: {
    ru: "Ключ «{name}» найден.",
    en: "Keyword “{name}” found.",
  },
  keywordInvalid: {
    ru: "Такого ключа нет в каталоге BiggerHat.",
    en: "This keyword is not in the BiggerHat catalog.",
  },
  keywordUnavailable: {
    ru: "Сейчас проверить нельзя. Значение сохранено без подтверждения.",
    en: "Validation is unavailable. The value was saved without confirmation.",
  },
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
    en: "Each player has 25 soulstones to add models into their starting arsenal. Players do not spend any soulstones to add their leader into their arsenal.",
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
  peonNoInjuries: {
    ru: "Peon не получает травм.",
    en: "Peons may never have equipment attached, gain injuries, or be annihilated.",
  },
  threeInjuries: {
    ru: "Три травмы: в конце Determine Injuries модель аннигилируется.",
    en: "After flipping for injuries, all models with three or more injury upgrades attached are annihilated. They are simply too injured to go on!",
  },
  scripAmount: { ru: "{n} скрип", en: "{n} scrip" },
  strategistGoal: {
    ru: "Interact в 6″ от зоны врага",
    en: "1 Experience Point if your leader is a Strategist and resolves one or more Interact actions within 6\" of the enemy deployment zone.",
  },
  bruiserGoal: {
    ru: "Лидер убил non-peon врага",
    en: "1 Experience Point if your leader is a Bruiser and killed one or more non-peon enemy models.",
  },
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
  startingLimit: {
    ru: "Стартовый арсенал не может превышать 25 SS.",
    en: "Each player has 25 soulstones to add models into their starting arsenal.",
  },
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
  catalogLoading: { ru: "Загружаю каталог BiggerHat…", en: "Loading the BiggerHat catalog…" },
  catalogProgress: {
    ru: "Загружаю каталог BiggerHat: {loaded} из {total} страниц.",
    en: "Loading the BiggerHat catalog: page {loaded} of {total}.",
  },
  catalogReady: {
    ru: "В каталоге {n} карточек. Поиск больше не расходует лимит API.",
    en: "The catalog contains {n} cards. Searching no longer uses the API limit.",
  },
  catalogUnavailable: {
    ru: "BiggerHat сейчас недоступен. Можно заполнить модель вручную; сохранённые карточки продолжат работать.",
    en: "BiggerHat is currently unavailable. You can enter the model manually; saved cards will keep working.",
  },
  catalogNoMatches: {
    ru: "Подходящих карточек не найдено. Попробуйте другое имя или ручной ввод.",
    en: "No matching cards found. Try another name or enter it manually.",
  },
  catalogSelecting: { ru: "Загружаю полную карточку…", en: "Loading the full card…" },
  catalogSelected: { ru: "Карточка выбрана и сохранится в досье.", en: "The card is selected and will be saved in the dossier." },
  cardDetached: {
    ru: "Карточка откреплена: поля теперь заполняются вручную.",
    en: "The card was detached; the fields are now manual.",
  },
  catalogRefreshed: { ru: "Каталог BiggerHat обновлён.", en: "The BiggerHat catalog has been refreshed." },
  catalogRateLimited: {
    ru: "BiggerHat исчерпал лимит запросов. Повторите через {seconds} сек.; ручной ввод работает.",
    en: "The BiggerHat request limit was reached. Try again in {seconds}s; manual entry still works.",
  },
  cardAttached: { ru: "Карточка BiggerHat прикреплена", en: "BiggerHat card attached" },
  cardCounts: {
    ru: "{actions} действ. · {abilities} способн.",
    en: "{actions} actions · {abilities} abilities",
  },
  openCard: { ru: "Карточка", en: "Card" },
  chooseFromCard: { ru: "Выбрать", en: "Choose" },
  changeCard: { ru: "Сменить", en: "Change" },
  sourceCard: { ru: "Карточка источника", en: "Source card" },
  exactEnglish: { ru: "Оригинальный текст · EN", en: "Original card text · EN" },
  cardActions: { ru: "Действия", en: "Actions" },
  cardAbilities: { ru: "Способности", en: "Abilities" },
  cardNoActions: { ru: "На карточке нет действий.", en: "This card has no actions." },
  cardNoAbilities: { ru: "На карточке нет способностей.", en: "This card has no abilities." },
  talentPickerRule: {
    ru: "{kind} · модель-источник Cost {limit} или меньше.",
    en: "{kind} · source model Cost {limit} or less.",
  },
  talentChooseSource: {
    ru: "Выберите модель-источник — покажу только подходящие записи.",
    en: "Choose a source model to see only eligible entries.",
  },
  talentNoEntries: {
    ru: "На этой карточке нет подходящих действий или способностей.",
    en: "This card has no matching actions or abilities.",
  },
  talentEntrySelected: {
    ru: "{name} зафиксирован в досье вместе с текстом карточки.",
    en: "{name} has been saved in the dossier together with its card text.",
  },
  talentTrigger: { ru: "Выбранный триггер", en: "Chosen trigger" },
  talentChooseTrigger: { ru: "Выберите триггер", en: "Choose a trigger" },
  talentNeedsTrigger: {
    ru: "У этой атаки нет триггеров, поэтому её нельзя выбрать для этого слота.",
    en: "This attack has no triggers, so it cannot be chosen for this slot.",
  },
  affinityKeyword: { ru: "выбранный ключ", en: "chosen keyword" },
  affinityFaction: { ru: "объявленная фракция", en: "declared faction" },
  affinityVersatile: { ru: "Versatile", en: "Versatile" },
  affinityOther: { ru: "вне ключа", en: "out of keyword" },
  modelPickerHint: {
    ru: "Показаны нанимаемые модели; карточки без Cost исключены.",
    en: "Only hireable models are shown; cards without a Cost are excluded.",
  },
  cardLoadFailed: {
    ru: "Не удалось открыть карточку. Попробуйте обновить каталог или используйте сохранённый снимок.",
    en: "Could not open the card. Refresh the catalog or use a saved snapshot.",
  },
  storageFull: {
    ru: "Браузер не смог сохранить изменения: локальное хранилище заполнено. Экспортируйте досье и очистите данные сайта.",
    en: "The browser could not save the change because local storage is full. Export the dossier and clear this site's data.",
  },
};

const LOCALE_KEY = "m4e-untold-locale";
let storedLocale = null;
try {
  storedLocale = localStorage.getItem(LOCALE_KEY);
} catch {
  storedLocale = null;
}
let currentLocale =
  storedLocale || (navigator.language?.toLowerCase().startsWith("en") ? "en" : "ru");

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
  if (br === "Всегда") return localized("Всегда", "Always Available");
  if (currentLocale === "en") {
    return br.replace(/^(\d+) R\/M$/, "$1 of Ram or Mask").replace(/^(\d+) C\/T$/, "$1 of Crow or Tome");
  }
  return br;
}

function displayFlip(flip) {
  if (currentLocale !== "en") return flip;
  return flip
    .replace(/^(\d+)–(\d+) R\/M$/, "$1 or $2 of Ram or Mask")
    .replace(/^(\d+)–(\d+) C\/T$/, "$1 or $2 of Crow or Tome")
    .replace(/^(\d+) R\/M$/, "$1 of Ram or Mask")
    .replace(/^(\d+) C\/T$/, "$1 of Crow or Tome");
}

const archetypes = {
  "Lucky Upstart": {
    label: "Счастливчик",
    labelEn: "Lucky Upstart",
    tagline: "Сбалансирован и начинает с особого предмета.",
    taglineEn: "Attack Actions: Choose any one attack action from an ally of cost 6 or less.",
    stats: { Df: 6, Wp: 6, Sp: 6, Health: 14 },
    talents: [
      { id: "attack-1", kind: "attack", type: "Атака", typeEn: "Attack", limit: 6 },
      { id: "ability-1", kind: "ability", type: "Способность", typeEn: "Ability", limit: 6 },
    ],
    rule:
      "Атака и способность берутся у союзников стоимостью 6 или меньше. Затем сделайте нечитаемый обманом флип и бесплатно получите предмет с точно совпавшим BR; он не учитывается в CR и возвращается после аннигиляции.",
    ruleEn:
      "Attack Actions: Choose any one attack action from an ally of cost 6 or less. Tactical Actions: None. Abilities: Choose any one ability from an ally of cost 6 or less. Special: Flip a card, which may not be cheated. Select an equipment upgrade which corresponds to that flip’s value exactly and add it to your arsenal for free. This equipment never counts towards your campaign rating. If this equipment is annihilated, add it back to your arsenal after the game.",
  },
  Generalist: {
    label: "Универсал",
    labelEn: "Generalist",
    tagline: "По одному таланту каждого типа.",
    taglineEn: "Attack Actions: Choose any one attack action from an ally of cost 7 or less.",
    stats: { Df: 5, Wp: 5, Sp: 6, Health: 14 },
    talents: [
      { id: "attack-1", kind: "attack", type: "Атака", typeEn: "Attack", limit: 7 },
      { id: "tactical-1", kind: "tactical", type: "Тактика", typeEn: "Tactical", limit: 7 },
      { id: "ability-1", kind: "ability", type: "Способность", typeEn: "Ability", limit: 7 },
    ],
    rule: "Атака, тактика и способность берутся у союзников стоимостью 7 или меньше.",
    ruleEn:
      "Attack Actions: Choose any one attack action from an ally of cost 7 or less. Tactical Actions: Choose any one tactical action from an ally of cost 7 or less. Abilities: Choose any one ability from an ally of cost 7 or less.",
  },
  "Heavy Hitter": {
    label: "Тяжеловес",
    labelEn: "Heavy Hitter",
    tagline: "Мощная атака с одним выбранным триггером.",
    taglineEn: "Attack Actions: Choose any one attack action from an ally of cost 10 or less.",
    stats: { Df: 6, Wp: 4, Sp: 6, Health: 14 },
    talents: [
      {
        id: "attack-1",
        kind: "attack",
        chooseTrigger: true,
        type: "Атака + триггер",
        typeEn: "Attack + Trigger",
        limit: 10,
      },
      { id: "tactical-1", kind: "tactical", type: "Тактика", typeEn: "Tactical", limit: 5 },
    ],
    rule:
      "Атака берётся у союзника стоимостью 10 или меньше и сохраняет один выбранный триггер. Тактика — у союзника стоимостью 5 или меньше.",
    ruleEn:
      "Attack Actions: Choose any one attack action from an ally of cost 10 or less. Choose one trigger on that attack action and gain that trigger on the chosen action. Tactical Actions: Choose any one tactical action from an ally of cost 5 or less. Abilities: None.",
  },
  Schemer: {
    label: "Интриган",
    labelEn: "Schemer",
    tagline: "Быстрый специалист по тактическим приёмам.",
    taglineEn: "Attack Actions: Choose any one attack action from an ally of cost 5 or less.",
    stats: { Df: 6, Wp: 5, Sp: 7, Health: 13 },
    talents: [
      { id: "attack-1", kind: "attack", type: "Атака", typeEn: "Attack", limit: 5 },
      { id: "tactical-1", kind: "tactical", type: "Тактика I", typeEn: "Tactical I", limit: 8 },
      { id: "tactical-2", kind: "tactical", type: "Тактика II", typeEn: "Tactical II", limit: 8 },
      { id: "ability-1", kind: "ability", type: "Способность", typeEn: "Ability", limit: 8 },
    ],
    rule:
      "Атака берётся у союзника стоимостью 5 или меньше; две тактики и способность — у союзников стоимостью 8 или меньше.",
    ruleEn:
      "Attack Actions: Choose any one attack action from an ally of cost 5 or less. Tactical Actions: Choose any two tactical actions from an ally (or allies) of cost 8 or less. Abilities: Choose any one ability from an ally of cost 8 or less.",
  },
  "Talented Individual": {
    label: "Самородок",
    labelEn: "Talented Individual",
    tagline: "Две способности и гибкий набор действий.",
    taglineEn: "Attack Actions: Choose any one attack action from an ally of cost 6 or less.",
    stats: { Df: 5, Wp: 5, Sp: 5, Health: 13 },
    talents: [
      { id: "attack-1", kind: "attack", type: "Атака", typeEn: "Attack", limit: 6 },
      { id: "tactical-1", kind: "tactical", type: "Тактика", typeEn: "Tactical", limit: 6 },
      { id: "ability-1", kind: "ability", type: "Способность I", typeEn: "Ability I", limit: 8 },
      { id: "ability-2", kind: "ability", type: "Способность II", typeEn: "Ability II", limit: 8 },
    ],
    rule:
      "Атака и тактика берутся у союзников стоимостью 6 или меньше; две способности — у союзников стоимостью 8 или меньше.",
    ruleEn:
      "Attack Actions: Choose any one attack action from an ally of cost 6 or less. Tactical Actions: Choose any one tactical action from an ally of cost 6 or less. Abilities: Choose any two abilities from an ally (or allies) of cost 8 or less.",
  },
};

const crewCards = [
  {
    id: "expert-coordination",
    name: "Expert Coordination",
    text: "При активации модель может drain Soulstone, чтобы пройти до 3″.",
    textEn:
      "Non-peon models in this crew with either of your chosen keywords gain the following ability: Expert Coordination: When this model activates, it may drain a Soulstone to move up to 3\".",
  },
  {
    id: "shape-landscape",
    name: "Shape the Landscape",
    text: "При активации модель может drain Soulstone, чтобы создать выбранный маркер в 1″.",
    textEn:
      "When this crew card effect is selected, choose a marker listed on a crew card belonging to a master with either of this crew’s keywords. Non-peon models in this crew with either of your chosen keywords gain the following ability: Shape the Landscape: When this model activates, it may drain a Soulstone to make the chosen marker within 1\".",
  },
  {
    id: "heavy-blow",
    name: "Heavy Blow",
    text: "После урона врагу действием можно drain Soulstone и нанести +1 урон.",
    textEn:
      "Non-peon models in this crew with either of your chosen keywords gain the following ability: Heavy Blow: When this model deals damage to an enemy with an action, it may drain a Soulstone to deal +1 damage.",
  },
  {
    id: "unusual-specialty",
    name: "Unusual Specialty",
    text: "При активации можно drain Soulstone и получить выбранный разрешённый токен.",
    textEn:
      "When this crew card effect is selected, choose a token listed on a crew card belonging to a master with either of this crew’s keywords. Fast and Aetheric Surge tokens may not be chosen. Non-peon models in this crew with either of your chosen keywords gain the following ability: Unusual Specialty: When this model activates, it may drain a Soulstone to gain the chosen token.",
  },
  {
    id: "the-plan",
    name: "The Plan Comes Together",
    text: "Союзник в 6″ проходит до 3″, затем объявляет Interact по Strategy marker.",
    textEn:
      "Non-peon models in this crew with either of your chosen keywords gain the following action: The Plan Comes Together — Rg 6\"; Skl 0; Rst -; TN 5; Dmg -. Ally only. The target may move up to 3\", and then declare the Interact action targeting a Strategy marker.",
  },
  {
    id: "forbidden-curse",
    name: "Forbidden Curse",
    text: "Атака Wp в 6″: цель получает выбранный разрешённый токен.",
    textEn:
      "When this crew card effect is selected, choose a token listed on a crew card belonging to a master with either of this crew’s keywords. Flicker and Summon tokens may not be chosen. Non-peon models in this crew with either of your chosen keywords gain the following action: Forbidden Curse — Rg 6\"; Skl 5; Rst Wp; TN -; Dmg -. The target gains the chosen token.",
  },
  {
    id: "specialized-tools",
    name: "Specialized Tools",
    text: "Союзник в 6″ прикрепляет upgrade выбранного разрешённого типа.",
    textEn:
      "When this crew card effect is selected, choose an upgrade type listed on a master, crew card associated with a master, or totem (including upgrade types listed on actions and abilities) belonging to either of this crew’s keywords. For example, a player with the Kin keyword could choose the Improvised Enhancement upgrade type listed in Ophelia LaCroix’s Raid Boss ability. Non-peon models in this crew with either of your chosen keywords gain the following action: Specialized Tools — Rg 6\"; Skl 5; Rst Wp; TN 11; Dmg -. This action may target allies. Attach an upgrade of the chosen type to the target.",
  },
  {
    id: "prepared",
    name: "Prepared For Anything",
    text: "При активации модель может drain Soulstone, чтобы объявить Prepare.",
    textEn:
      "Non-peon models in this crew with either of your chosen keywords gain the following ability: Prepared For Anything: When this model activates, it may drain a Soulstone to declare the Prepare action.",
  },
  {
    id: "scavenger",
    name: "Scavenger’s Instinct",
    text: "Убив врага, модель может drain Soulstone: взять карту и исцелить 1.",
    textEn:
      "Non-peon models in this crew with either of your chosen keywords gain the following ability: Scavenger’s Instinct: When this model kills an enemy model, it may drain a Soulstone to draw a card and heal 1.",
  },
  {
    id: "inhuman",
    name: "Inhuman Determination",
    text: "При активации можно drain Soulstone: исцелить 2 и пройти до 1″.",
    textEn:
      "Non-peon models in this crew with either of your chosen keywords gain the following ability: Inhuman Determination: When this model activates, it may drain a Soulstone to heal 2 and move up to 1\".",
  },
  {
    id: "loot-stash",
    name: "Loot Their Stash",
    text: "На половине врага сделайте флип и временно получите предмет с равным BR.",
    textEn:
      "Non-peon models in this crew with either of your chosen keywords gain the following action: Loot Their Stash — Rg -; Skl -; Rst -; TN -; Dmg -. This model must be completely on the enemy table half. Flip a card, which may not be cheated. This model attaches an equipment upgrade with a BR equal to the card’s value. This equipment does not affect your campaign rating. Annihilate this equipment after this game.",
  },
  {
    id: "sadistic",
    name: "Sadistic Blow",
    text: "Ближняя атака; при raise цель получает Injured token.",
    textEn:
      "Non-peon models in this crew with either of your chosen keywords gain the following action: Sadistic Blow — Rg 1\"; Skl 5; Rst Df; TN -; Dmg 2. If this attack receives a raise, the target gains an Injured token.",
  },
];

const equipment = [
  ["Lucky Gremlin Foot", "Всегда", 1, "Предотвращает получение травмы, затем аннигилируется.", "Lucky Gremlin Foot: When this model would attach an injury upgrade, it may annihilate this equipment to not do so."],
  ["Pistol", "Всегда", 1, "Атака Skl 5, ближняя 1″ или дальняя 8″, урон 2.", "Pistol — Rg *; Skl 5; Rst Df; TN -; Dmg 2. When this action is declared, choose if it has a range of 1\" or 8\"."],
  ["Sword", "Всегда", 1, "Ближняя атака 1″, Skl +5, урон 2.", "Sword — Rg 1\"; Skl +5; Rst Df; TN -; Dmg 2."],
  ["Trusty Rifle", "Всегда", 1, "Дальняя атака 14″, Skl 5, урон 2.", "Trusty Rifle — Rg 14\"; Skl 5; Rst Df; TN -; Dmg 2."],
  ["Helmet", "1 R/M", 2, "Hard to Kill.", "Hard to Kill: When this model suffers damage, if it has 2 or more health, it may not be reduced to below 1 health."],
  ["Healing Salve", "1 R/M", 1, "Аннигилировать при активации: исцелить 15.", "Healing Salve: When this model activates, it may annihilate this equipment to heal 15."],
  ["Blackjack", "1 R/M", 2, "Ближняя атака и перемещение цели.", "Blackjack — Rg 1\"; Skl 5; Rst Df; TN -; Dmg 1. Move the target up to 2\". For each raise this action receives, increase the distance moved by up to 2\"."],
  ["Leg Breaker", "1 C/T", 2, "При raise цель немедленно делает injury flip.", "Aim to Maim — Rg 1\"; Skl 6; Rst Sp; TN -; Dmg 1. If this action received a raise, the target immediately flips on the injury table. This flip may not be cheated, ignore any results that would annihilate it."],
  ["Warming Flask", "1 C/T", 2, "Лечит союзника; больше лечения за raises.", "Warming Flask — Rg 6\"; Skl 0; Rst -; TN 5; Dmg -. Friendly only. Target heals 2. For each raise this action receives, the target heals an additional +1."],
  ["Lead-Lined Coat", "1 C/T", 3, "Armor: раз за активацию снизить урон на 1.", "Armor: Once per activation. This model may reduce damage dealt to it by 1."],
  ["Flamethrower", "2 R/M", 2, "Дальняя атака 10″; Burning вокруг цели.", "Flamethrower — Rg 10\"; Skl 6; Rst Sp; TN -; Dmg 2. Enemy models within 1\" of the target gain a Burning token."],
  ["Stage Hook", "2 R/M", 2, "Передвигает другую дружественную модель до 4″.", "Stage Hook — Rg 6\"; Skl 0; Rst -; TN 5; Dmg -. Another friendly model only. Move the target up to 4\"."],
  ["Guardian’s Shield", "2 R/M", 2, "Juggernaut: урон свыше 3 становится равен 3.", "Juggernaut: This model reduces all damage dealt to it to 3 (if more than 3)."],
  ["Death Curse", "2 C/T", 2, "Убивший модель враг делает injury flip.", "Demise (Death Curse): After this model is killed by an enemy, the enemy immediately flips on the injury table. This flip may not be cheated, ignore any results that would annihilate it."],
  ["Twin Katanas", "2 C/T", 3, "Ближняя атака и рывок к врагу за Soulstone.", "Twin Katanas — Rg 1\"; Skl 6; Rst Df; TN -; Dmg 2. This model may drain a Soulstone once per turn. If it does so, place this model in base contact with an enemy model within 3\" of itself. Then, this model may declare a melee action."],
  ["Thieves’ Tools", "2 C/T", 2, "Может похитить снаряжение цели при raise.", "Thieves’ Tools — Rg 1\"; Skl 6; Rst Df; TN -; Dmg 1. Once per turn. If this action receives a raise, this model may annihilate up to one equipment upgrade from the target. If an upgrade is annihilated this way, this model may attach an upgrade with the same name (and add it to this crew’s arsenal)."],
  ["Carrier Pigeon", "3 R/M", 2, "Создаёт Scheme marker рядом с союзником.", "Document Delivery — Rg 8\"; Skl 0; Rst -; TN 5; Dmg -. Ally only. Make a Scheme marker in base contact with the target."],
  ["Vengeful Vow", "3 C/T", 2, "Только лидер: +1 XP за убийство unique после аннигиляции.", "This equipment may only be attached to a leader. Vengeful Vow: After killing an enemy unique model, this model may annihilate this equipment. If it does, it gains +1 experience during aftermath."],
  ["Aetheric Displacer", "3 C/T", 3, "После промаха врага — place в пределах 3″.", "Leap Aside: After an enemy attack targeting this model fails, this model may place itself within 3\"."],
  ["Coffee", "4 R/M", 1, "Аннигилировать при активации: получить Fast.", "When this model activates, it may annihilate this equipment to gain a Fast token."],
  ["Sniper’s Scope", "4 R/M", 1, "Дальние действия игнорируют cover и concealment.", "Sniper’s Scope: This model’s ranged actions ignore cover and concealment."],
  ["Gatling Gun", "4 C/T", 2, "Дальняя атака 12″, получает + без cover.", "Gatling Gun — Rg 12\"; Skl 6; Rst Df; TN -; Dmg 2. If the target does not have cover, this action receives a +."],
  ["Snake Oil", "5 R/M", 1, "Снять любое число токенов и, возможно, infuse Soulstone.", "“Guaranteed to Cure What Ails Ya!”: When this model activates, this model may discard this upgrade to remove any number of tokens from itself. Then infuse a Soulstone if at least one token was removed in this way."],
  ["Assassin’s Blade", "5 C/T", 2, "Цель сбрасывает карту / drain Soulstone, иначе погибает.", "Assassin’s Blade — Rg 1\"; Skl 5; Rst Df; TN -; Dmg 1. The target may either discard a card or drain a Soulstone. If it does neither, it is killed."],
  ["Whiskey", "6 R/M", 1, "Сбросить при активации: + ко всем дуэлям до End Phase.", "Calm Nerves: When this model activates, it may discard this upgrade. If it does so, until the end phase this model receives a + to all duels."],
  ["Escape Coil", "6 R/M", 2, "После урона drain Soulstone: place к союзнику в 6″.", "Escape Coil: After an enemy deals damage to this model, this model may drain a Soulstone. If it does, it may be placed into base contact with a friendly model within 6\"."],
  ["Hag’s Kiss", "6 C/T", 2, "Wp-атака: Stunned и Slow.", "Hag’s Kiss — Rg 2\"; Skl 5; Rst Wp; TN -; Dmg 2. The target gains Stunned and Slow tokens."],
  ["Metal Skull Plate", "7 R/M", 3, "Может Charge по масти верхней карты сброса.", "Confused and Enraged: When this model activates, if the top card of your discard pile is a Ram this model may declare the Charge action, if able."],
  ["Barbed Whip", "7 R/M", 2, "Ближняя атака с дистанцией 4″.", "Barbed Whip — Rg 4\"; Skl 6; Rst Df; TN -; Dmg 2."],
  ["Lasso", "7 R/M", 2, "Подтягивает цель; при raise даёт Slow.", "Lasso — Rg 12\"; Skl 6; Rst Sp; TN -; Dmg -. Move the target up to its Sp toward this model. If this action receives a raise, the target gains a Slow token."],
  ["Trash Can", "7 C/T", 3, "Удаляет маркер.", "Trash Can — Rg 2\"; Skl 0; Rst -; TN 5; Dmg -. Once per activation. Target a marker. Remove the target."],
  [
    "Dark Crystal",
    "13 C/T",
    1,
    "Рискованный сценарный эффект на половине врага.",
    "Ignore the Old Woman’s Advice: When this model resolves the Interact action on the enemy table half, it may annihilate this equipment. If it does so, flip a card which may not be cheated and apply the following: Either Joker: If this model is killed this game, the opponent gains 1 VP. If this model is in play at the end of the game, you gain 1 VP. Ram: Each player makes one Strategy marker within 3\" of this model. Mask: Place this model within 6\" and then make a Scheme marker in base contact with this model. Tome: Make two Scheme markers within 3\" of this model. Crow: Kill this model. Do not flip for injuries on this model during aftermath. Randomly draw a Scheme card, this may leave you with two unrevealed Schemes; you may score both this turn. At the end of the turn discard the randomly drawn Scheme card without selecting a Next Available Scheme from it.",
  ],
  [
    "Hurled Luggage",
    "13 C/T",
    2,
    "Создаёт Scheme marker рядом с целью.",
    "Hurled Luggage — Rg 8\"; Skl 6; Rst Df; TN -; Dmg -. Make a Scheme marker in base contact with the target.",
  ],
  [
    "Dead Man’s Switch",
    "13 C/T",
    1,
    "Demise: 3 irreducible damage врагам в 3″.",
    "Demise (Dead Man’s Switch): When this model is killed, enemy models within 3\" are dealt 3 irreducible damage.",
  ],
];

const injuries = [
  ["Black Joker", "Traitor", "Если не лидер/тотем: модель аннигилируется и может бесплатно перейти противнику.", "If this model is a leader or totem, reflip this result. Annihilate this model. The opposing crew may add a copy of this model to its arsenal spending no scrip; the model gains the keywords of its new crew’s leader. The model retains any injuries and equipment it had this game in its new crew and they are annihilated from its previous crew."],
  ["1 R/M", "Just a Flesh Wound", "Травма не получена.", "No injury is gained."],
  ["2 R/M", "Just a Flesh Wound", "Травма не получена.", "No injury is gained."],
  ["3 R/M", "Severe Amputation", "Максимальное здоровье −2.", "Reduce this model’s maximum health by 2."],
  ["4 R/M", "Pack Mule", "После гибели противник может поставить Scheme marker рядом.", "When this model is killed, the opposing player may place a Scheme marker in base contact with it before removing it."],
  ["5 R/M", "Headstrong", "Стоимость +1; лидер и тотем перебрасывают.", "Increase this model’s soulstone cost by 1. If this model is a master or totem, reflip this result."],
  ["6 R/M", "Permanent Hex", "1 урон себе, чтобы объявлять триггеры.", "This model must deal 1 damage to itself to declare triggers. If this model has no triggers, reflip this result."],
  ["7 R/M", "Senseless", "В начале активации сбросить карту или получить Slow.", "This model must discard a card at the start of its activation or gain a Slow token."],
  ["8 R/M", "Mangled Limb", "−1 Skl ко всем атакам.", "This model suffers -1 Skl to all of its attack actions. If this model has no attack actions, reflip this result."],
  ["9 R/M", "Leadfooted", "−1 Sp.", "This model suffers -1 Sp."],
  ["10 R/M", "Defenseless", "Получает +1 урон каждый раз, когда ей наносят урон.", "When this model is dealt damage, it is dealt an additional +1 damage."],
  ["11 R/M", "Loose Lips", "Враги в 3″ могут объявлять действия с карты модели.", "Enemy models within 3\" may declare actions printed on this model’s card."],
  ["12 R/M", "Blood Debt", "Особое условие снятия; противник может обменять травму на 1 VP.", "If this model ends its activation in the enemy deployment zone, it may drain a Soulstone to annihilate this upgrade. At the end of the game, the enemy crew may annihilate this upgrade to gain 1 VP."],
  ["13 R/M", "Killed Off", "Модель аннигилируется.", "Annihilate this model."],
  ["1 C/T", "Just a Flesh Wound", "Травма не получена.", "No injury is gained."],
  ["2 C/T", "Just a Flesh Wound", "Травма не получена.", "No injury is gained."],
  ["3 C/T", "Distracted by Voices", "−2 Wp.", "This model suffers -2 Wp."],
  ["4 C/T", "Always Wandering", "Выходит в Start Phase второго хода, затем травма аннигилируется.", "When this model is hired, it deploys during the start phase of turn 2, instead of during deployment. After this model is deployed, annihilate this upgrade."],
  ["5 C/T", "Fugitive", "При следующей гибели враг получает 2 скрип; затем травма исчезает.", "The next time this model is killed, the opposing crew gains 2 scrip. Then, annihilate this injury."],
  ["6 C/T", "One Last Job", "После Interact модель погибает.", "After this model resolves the Interact action, it is killed. If this model has the Insignificant ability, reflip this result."],
  ["7 C/T", "Off Balance", "− к Df и Wp дуэлям.", "This model suffers a - to Df and Wp duels."],
  ["8 C/T", "Barely Holding Together", "Нельзя объявлять Charge.", "This model may not declare the Charge action."],
  ["9 C/T", "Dulled Edge", "−1 Df.", "This model suffers -1 Df."],
  ["10 C/T", "Missing Fingers", "Без сброса карты signature-символы пусты до End Phase.", "When this model activates, it may discard a card. If it does not, it treats all signature symbols on its card as blank until the end phase. Reflip this result if this model has no signature symbols."],
  ["11 C/T", "Brittle Bones", "Атакующий получает + при атаке этой модели.", "When this model is targeted by an attack action, the attacking model receives a +."],
  ["12 C/T", "Black Mailed", "Враг может аннигилировать травму и заставить модель объявить действие.", "When this model ends its activation, the enemy player may annihilate this upgrade to have this model declare an action (even if this model is a master), chosen and controlled by the enemy player."],
  ["13 C/T", "Killed Off", "Модель аннигилируется.", "Annihilate this model."],
  ["Red Joker", "Close Call", "При обычном флипе перейдите к Lucky Miss; при cheat травмы нет.", "If the red joker was cheated, this model receives no injury. If the red joker was flipped, flip on the Lucky Miss table."],
];

const xpTiers = [
  1, 1, 2, null, 3, null, 4, null, 1, null, 2, null, 4,
  null, null, null, 1, null, null, 2, 1, null, null, null, 3, null,
  null, null, null, 1, null, null, null, null, 2, null, null, null, 4,
];

const defaultState = {
  version: 2,
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
const cardCatalog = window.BiggerHatCards || null;
let pendingModelCard = null;
let activeTalentSlot = null;
let selectedTalentSource = null;
let activeCardView = null;
let modelSearchRequest = 0;
let talentSearchRequest = 0;
let modelSelectionRequest = 0;
let talentSourceRequest = 0;
let modelDetailController = null;
let talentDetailController = null;
let storageWarningShown = false;
let keywordValidation = [0, 1].map((index) => ({
  status: state.crew.keywords?.[index] ? "pending" : "empty",
  match: null,
}));
let keywordSuggestions = [0, 1].map(() => ({ items: [], activeIndex: -1 }));
let keywordValidationRequest = [0, 0];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeStoredModel(model) {
  const source = model && typeof model === "object" ? model : {};
  const legacyType = String(source.type || "Other");
  const type = ["Minion", "Peon", "Other"].includes(legacyType) ? legacyType : "Other";
  return {
    ...source,
    id: source.id || uid(),
    name: String(source.name || ""),
    cost: Number(source.cost || 0),
    type,
    henchman: Boolean(source.henchman || legacyType === "Henchman"),
    keywords: String(source.keywords || ""),
    versatile: Boolean(source.versatile),
    outOfKeyword: Boolean(source.outOfKeyword),
    injuries: Math.max(0, Number(source.injuries || 0)),
    cardSlug: source.cardSlug || source.cardSnapshot?.slug || null,
    cardSnapshot:
      source.cardSnapshot && typeof source.cardSnapshot === "object"
        ? source.cardSnapshot
        : null,
  };
}

function normalizeStoredTalent(talent, slot, index) {
  const source =
    typeof talent === "string"
      ? { name: talent }
      : talent && typeof talent === "object"
        ? talent
        : {};
  const hasSnapshot = source.snapshot && typeof source.snapshot === "object";
  return {
    ...source,
    slotId: source.slotId || slot?.id || `legacy-${index + 1}`,
    kind: source.kind || slot?.kind || "",
    mode: source.mode || (hasSnapshot ? "biggerhat" : "manual"),
    name: String(source.name || ""),
    source: String(source.source || ""),
    snapshot: hasSnapshot ? source.snapshot : null,
  };
}

function mergeDefaults(saved) {
  const base = clone(defaultState);
  if (!saved || typeof saved !== "object") return base;
  const savedLeader = saved.leader && typeof saved.leader === "object" ? saved.leader : {};
  const savedCrew =
    saved.crew && typeof saved.crew === "object" && !Array.isArray(saved.crew)
      ? saved.crew
      : {};
  const savedKeywords = Array.isArray(savedCrew.keywords)
    ? savedCrew.keywords
    : base.crew.keywords;
  const slots = archetypes[savedLeader.archetype]?.talents || [];
  const savedTalents = Array.isArray(savedLeader.talents) ? savedLeader.talents : [];
  const savedArsenal = saved.arsenal && typeof saved.arsenal === "object" ? saved.arsenal : {};
  return {
    ...base,
    ...saved,
    version: defaultState.version,
    crew: {
      ...base.crew,
      ...savedCrew,
      keywords: [0, 1].map((index) => String(savedKeywords[index] ?? "")),
    },
    campaign: { ...base.campaign, ...(saved.campaign || {}) },
    leader: {
      ...base.leader,
      ...savedLeader,
      talents: savedTalents.map((talent, index) =>
        normalizeStoredTalent(talent, slots[index], index),
      ),
    },
    arsenal: {
      ...base.arsenal,
      ...savedArsenal,
      models: Array.isArray(savedArsenal.models)
        ? savedArsenal.models.map(normalizeStoredModel)
        : [],
      equipment: Array.isArray(savedArsenal.equipment) ? savedArsenal.equipment : [],
    },
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    if (!storageWarningShown) {
      storageWarningShown = true;
      setTimeout(() => toast(message("storageFull")), 0);
    }
    return false;
  }
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

function debounce(callback, wait = 320) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), wait);
  };
}

function canonical(value) {
  return String(value ?? "")
    .toLocaleLowerCase("en")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function exactKeywordKey(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

function resetKeywordValidationState() {
  keywordValidation = [0, 1].map((index) => ({
    status: state.crew.keywords?.[index] ? "pending" : "empty",
    match: null,
  }));
  keywordSuggestions = [0, 1].map(() => ({ items: [], activeIndex: -1 }));
  keywordValidationRequest = keywordValidationRequest.map((request) => request + 1);
}

function keywordField(index) {
  return document.querySelector(`[data-keyword-field="${index}"]`);
}

function keywordInput(index) {
  return document.querySelector(`[data-keyword-index="${index}"]`);
}

function keywordStatusText(index) {
  const validation = keywordValidation[index];
  if (validation.status === "checking" || validation.status === "pending") {
    return message("keywordChecking");
  }
  if (validation.status === "valid") {
    return message("keywordValid", { name: validation.match?.name || state.crew.keywords[index] });
  }
  if (validation.status === "invalid") return message("keywordInvalid");
  if (validation.status === "unavailable") return message("keywordUnavailable");
  return message("keywordHint");
}

function renderKeywordValidation(index) {
  const field = keywordField(index);
  const input = keywordInput(index);
  const status = document.querySelector(`#${input?.id}Status`);
  if (!field || !input || !status) return;
  const validation = keywordValidation[index];
  const stateClass = ["valid", "invalid", "unavailable", "checking"].includes(
    validation.status,
  )
    ? validation.status
    : "";
  field.classList.remove(
    "is-keyword-valid",
    "is-keyword-invalid",
    "is-keyword-unavailable",
    "is-keyword-checking",
  );
  if (stateClass) field.classList.add(`is-keyword-${stateClass}`);
  const mark = field.querySelector(".keyword-validation-mark");
  mark.textContent =
    validation.status === "valid"
      ? "✓"
      : validation.status === "invalid"
        ? "×"
        : validation.status === "unavailable"
          ? "?"
          : validation.status === "checking" || validation.status === "pending"
            ? "…"
            : "";
  status.textContent = keywordStatusText(index);
  input.setAttribute("aria-busy", String(["checking", "pending"].includes(validation.status)));
  input.setAttribute("aria-invalid", String(validation.status === "invalid"));
  input.setCustomValidity(validation.status === "invalid" ? message("keywordInvalid") : "");
}

function closeKeywordSuggestions(index) {
  const input = keywordInput(index);
  const wrap = document.querySelector(`#${input?.getAttribute("aria-controls")}`);
  if (!input || !wrap) return;
  wrap.hidden = true;
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  keywordSuggestions[index].activeIndex = -1;
}

function applyKeywordChoice(index, keyword) {
  const input = keywordInput(index);
  if (!input) return;
  input.value = keyword.name;
  state.crew.keywords[index] = keyword.name;
  keywordValidationRequest[index] += 1;
  keywordValidation[index] = { status: "valid", match: keyword };
  keywordSuggestions[index] = { items: [], activeIndex: -1 };
  saveState();
  renderKeywordValidation(index);
  renderDossier();
  closeKeywordSuggestions(index);
  input.focus();
}

function renderKeywordSuggestions(index) {
  const input = keywordInput(index);
  const wrap = document.querySelector(`#${input?.getAttribute("aria-controls")}`);
  if (!input || !wrap) return;
  const suggestionState = keywordSuggestions[index];
  const hasFocus = document.activeElement === input;
  if (!hasFocus || !suggestionState.items.length) {
    closeKeywordSuggestions(index);
    return;
  }
  wrap.innerHTML = suggestionState.items
    .map(
      (keyword, suggestionIndex) => `
        <button
          id="keyword-option-${index}-${suggestionIndex}"
          class="keyword-suggestion ${suggestionState.activeIndex === suggestionIndex ? "is-active" : ""}"
          type="button"
          role="option"
          tabindex="-1"
          aria-selected="${suggestionState.activeIndex === suggestionIndex}"
          data-keyword-suggestion="${suggestionIndex}"
        >
          <b>${escapeHtml(keyword.name)}</b>
          <small>BiggerHat</small>
        </button>`,
    )
    .join("");
  wrap.hidden = false;
  input.setAttribute("aria-expanded", "true");
  if (suggestionState.activeIndex >= 0) {
    const activeId = `keyword-option-${index}-${suggestionState.activeIndex}`;
    input.setAttribute("aria-activedescendant", activeId);
    document.querySelector(`#${activeId}`)?.scrollIntoView({ block: "nearest" });
  } else {
    input.removeAttribute("aria-activedescendant");
  }
  wrap.querySelectorAll("[data-keyword-suggestion]").forEach((button) => {
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      const keyword = suggestionState.items[Number(button.dataset.keywordSuggestion)];
      if (keyword) applyKeywordChoice(index, keyword);
    });
  });
}

function rankKeywordSuggestions(items, query) {
  const needle = canonical(query);
  if (!needle) return items.slice(0, 10);
  return items
    .map((keyword) => {
      const name = canonical(keyword.name);
      const slug = canonical(keyword.slug);
      const score =
        name === needle || slug === needle
          ? 0
          : name.startsWith(needle) || slug.startsWith(needle)
            ? 1
            : name.includes(needle) || slug.includes(needle)
              ? 2
              : 3;
      return { keyword, score };
    })
    .filter((item) => item.score < 3)
    .sort(
      (a, b) =>
        a.score - b.score ||
        a.keyword.name.localeCompare(b.keyword.name, "en"),
    )
    .slice(0, 10)
    .map((item) => item.keyword);
}

async function validateKeyword(index, options = {}) {
  const input = keywordInput(index);
  if (!input) return;
  const rawValue = input.value.trim();
  const request = ++keywordValidationRequest[index];
  const shouldShowSuggestions = Boolean(options.showSuggestions);

  if (!rawValue && !options.loadForEmpty) {
    keywordValidation[index] = { status: "empty", match: null };
    keywordSuggestions[index] = { items: [], activeIndex: -1 };
    renderKeywordValidation(index);
    closeKeywordSuggestions(index);
    renderDossier();
    return;
  }

  if (rawValue) {
    keywordValidation[index] = { status: "checking", match: null };
    renderKeywordValidation(index);
    renderDossier();
  } else {
    keywordValidation[index] = { status: "checking", match: null };
    renderKeywordValidation(index);
  }

  if (!cardCatalog?.loadKeywords) {
    keywordValidation[index] = {
      status: rawValue ? "unavailable" : "empty",
      match: null,
    };
    renderKeywordValidation(index);
    closeKeywordSuggestions(index);
    renderDossier();
    return;
  }

  try {
    const catalog = await cardCatalog.loadKeywords();
    if (request !== keywordValidationRequest[index]) return;
    const items = Array.isArray(catalog?.items) ? catalog.items : [];
    const exact = rawValue
      ? items.find(
          (keyword) =>
            exactKeywordKey(keyword.name) === exactKeywordKey(rawValue),
        )
      : null;
    keywordValidation[index] = rawValue
      ? { status: exact ? "valid" : "invalid", match: exact || null }
      : { status: "empty", match: null };
    keywordSuggestions[index] = {
      items: rankKeywordSuggestions(items, rawValue),
      activeIndex: -1,
    };
    renderKeywordValidation(index);
    if (shouldShowSuggestions && document.activeElement === input) {
      renderKeywordSuggestions(index);
    } else {
      closeKeywordSuggestions(index);
    }
    renderDossier();
  } catch {
    if (request !== keywordValidationRequest[index]) return;
    keywordSuggestions[index] = { items: [], activeIndex: -1 };
    if (rawValue) {
      keywordValidation[index] = { status: "unavailable", match: null };
    } else {
      keywordValidation[index] = { status: "empty", match: null };
    }
    renderKeywordValidation(index);
    closeKeywordSuggestions(index);
    renderDossier();
  }
}

function keywordCountsAsComplete(index) {
  const value = state.crew.keywords?.[index];
  if (!String(value || "").trim()) return false;
  return ["valid", "unavailable"].includes(keywordValidation[index]?.status);
}

function validateAllKeywords() {
  [0, 1].forEach((index) => {
    if (String(state.crew.keywords?.[index] || "").trim()) {
      validateKeyword(index);
    } else {
      keywordValidation[index] = { status: "empty", match: null };
      renderKeywordValidation(index);
    }
  });
}

function setupKeywordValidation() {
  const schedules = [0, 1].map((index) =>
    debounce(
      () =>
        validateKeyword(index, {
          showSuggestions: true,
          loadForEmpty: document.activeElement === keywordInput(index),
        }),
      180,
    ),
  );
  [0, 1].forEach((index) => {
    const input = keywordInput(index);
    if (!input) return;
    let isComposing = false;
    input.addEventListener("compositionstart", () => {
      isComposing = true;
    });
    input.addEventListener("compositionend", () => {
      isComposing = false;
      schedules[index]();
    });
    input.addEventListener("input", (event) => {
      keywordValidationRequest[index] += 1;
      keywordValidation[index] = {
        status: input.value.trim() ? "pending" : "empty",
        match: null,
      };
      renderKeywordValidation(index);
      renderDossier();
      if (isComposing || event.isComposing) return;
      schedules[index]();
    });
    input.addEventListener("focus", () => {
      [0, 1].filter((otherIndex) => otherIndex !== index).forEach(closeKeywordSuggestions);
      validateKeyword(index, {
        showSuggestions: true,
        loadForEmpty: true,
      });
    });
    input.addEventListener("blur", () => {
      setTimeout(() => closeKeywordSuggestions(index), 120);
    });
    input.addEventListener("keydown", (event) => {
      const suggestionState = keywordSuggestions[index];
      if (event.key === "Escape") {
        closeKeywordSuggestions(index);
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
      if (!suggestionState.items.length) return;
      if (event.key === "Enter" && suggestionState.activeIndex >= 0) {
        event.preventDefault();
        applyKeywordChoice(index, suggestionState.items[suggestionState.activeIndex]);
        return;
      }
      if (event.key === "Enter") return;
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      suggestionState.activeIndex =
        (suggestionState.activeIndex + direction + suggestionState.items.length) %
        suggestionState.items.length;
      renderKeywordSuggestions(index);
    });
    renderKeywordValidation(index);
  });
}

function selectedCrewKeywords() {
  return (state.crew.keywords || [])
    .map((keyword, index) =>
      keywordValidation[index]?.status === "invalid" ? "" : canonical(keyword),
    )
    .filter(Boolean);
}

function characterKeywordNames(character) {
  return (character?.keywords || []).map((keyword) =>
    typeof keyword === "string" ? keyword : keyword?.name,
  ).filter(Boolean);
}

function characterMatchesFaction(character) {
  const selected = canonical(state.crew.faction);
  if (!selected) return false;
  return [
    character?.faction,
    character?.factionLabel,
    character?.secondFaction,
    character?.secondFactionLabel,
  ].some((value) => canonical(value) === selected);
}

function characterMatchesKeyword(character) {
  const selected = selectedCrewKeywords();
  if (!selected.length) return false;
  const modelKeywords = characterKeywordNames(character).map(canonical);
  return selected.some((keyword) => modelKeywords.includes(keyword));
}

function characterIsVersatile(character) {
  return (character?.characteristics || []).some(
    (characteristic) => canonical(characteristic) === "versatile",
  );
}

function characterIsHenchman(character) {
  return (character?.characteristics || []).some(
    (characteristic) => canonical(characteristic) === "henchman",
  );
}

function characterAffinity(character) {
  if (characterMatchesKeyword(character)) {
    return { rank: 0, label: message("affinityKeyword") };
  }
  if (characterMatchesFaction(character) && characterIsVersatile(character)) {
    return { rank: 1, label: message("affinityVersatile") };
  }
  if (characterMatchesFaction(character)) {
    return { rank: 2, label: message("affinityFaction") };
  }
  return { rank: 3, label: message("affinityOther") };
}

function sortCharactersForCrew(characters) {
  return [...characters].sort((a, b) => {
    const affinity = characterAffinity(a).rank - characterAffinity(b).rank;
    if (affinity) return affinity;
    const cost = Number(a.cost ?? 999) - Number(b.cost ?? 999);
    if (cost) return cost;
    return String(a.displayName).localeCompare(String(b.displayName), "en");
  });
}

function isHireableCard(character) {
  return Number.isFinite(Number(character?.cost)) && character?.cost !== null && !character?.isUnhirable;
}

function stationToModelType(character) {
  const station = canonical(character?.stationLabel || character?.station);
  const known = {
    minion: "Minion",
    peon: "Peon",
  };
  if (known[station]) return known[station];
  const characteristics = new Set((character?.characteristics || []).map(canonical));
  if (characteristics.has("minion")) return "Minion";
  if (characteristics.has("peon")) return "Peon";
  return "Other";
}

const CARD_SYMBOLS = {
  stone: ["◆", "Soulstone"],
  pulse: ["◎", "Pulse"],
  aura: ["◌", "Aura"],
  blast: ["◉", "Blast"],
  melee: ["↕", "Melee"],
  magic: ["✦", "Magic"],
  missile: ["⌖", "Missile"],
  missle: ["⌖", "Missile"],
  projectile: ["⌖", "Projectile"],
  ram: ["R", "Ram"],
  mask: ["M", "Mask"],
  crow: ["C", "Crow"],
  tome: ["T", "Tome"],
  fortitude: ["F", "Fortitude"],
  warding: ["W", "Warding"],
  signature: ["S", "Signature"],
  cunning: ["C", "Cunning"],
  "+": ["+", "Positive flip"],
  "-": ["−", "Negative flip"],
};

function cardText(value) {
  return escapeHtml(value)
    .replace(/\{\{\{?([^{}]+)\}\}\}?/g, (match, rawToken) => {
      const token = String(rawToken).trim().toLowerCase();
      const symbol = CARD_SYMBOLS[token];
      if (!symbol) return match;
      return `<span class="card-symbol" title="${symbol[1]}" aria-label="${symbol[1]}">${symbol[0]}</span>`;
    })
    .replaceAll("\n", "<br>");
}

function plainCardText(value) {
  return String(value ?? "").replace(/\{\{\{?([^{}]+)\}\}\}?/g, (match, rawToken) => {
    const symbol = CARD_SYMBOLS[String(rawToken).trim().toLowerCase()];
    return symbol ? symbol[0] : match;
  });
}

function stoneMarker(value) {
  const amount = Number(value || 0);
  if (!amount) return "";
  return amount > 1 ? `◆ ${amount}` : "◆";
}

function abilityMeta(ability) {
  const defensiveType = String(ability.defensiveAbilityType || "")
    .replaceAll("_", " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  return [defensiveType, ability.suits, stoneMarker(ability.stoneCost)]
    .filter(Boolean)
    .join(" · ");
}

function actionMeta(action) {
  const pieces = [action.typeLabel || action.type].filter(Boolean);
  if (action.isSignature) pieces.push("Signature");
  if (action.range) {
    pieces.push(`${action.rangeTypeLabel || action.rangeType || "Rg"} ${action.range}″`);
  }
  if (action.stat) {
    const resist = action.resistedBy ? ` vs ${action.resistedBy}` : "";
    const suits = action.statSuits ? ` ${action.statSuits}` : "";
    const modifier =
      action.statModifier === "positive"
        ? " +"
        : action.statModifier === "negative"
          ? " −"
          : action.statModifier
            ? ` ${action.statModifier}`
            : "";
    pieces.push(`Stat ${action.stat}${suits}${modifier}${resist}`);
  }
  if (action.targetNumber) {
    const suits = action.targetSuits ? ` ${action.targetSuits}` : "";
    pieces.push(`TN ${action.targetNumber}${suits}`);
  }
  if (action.damage) pieces.push(`Dmg ${action.damage}`);
  if (action.stoneCost) pieces.push(stoneMarker(action.stoneCost));
  return pieces.join(" · ");
}

function cardRuleHtml(entry, kind, options = {}) {
  const triggers =
    kind === "action" && Array.isArray(entry.triggers)
      ? entry.triggers
      : options.selectedTrigger
        ? [options.selectedTrigger]
        : [];
  const meta =
    kind === "action"
      ? actionMeta(entry)
      : abilityMeta(entry);
  return `
    <article class="card-rule">
      <div class="card-rule-title">
        <h4>${escapeHtml(entry.name)}</h4>
        <small>${cardText(meta || (kind === "action" ? entry.typeLabel : "Ability"))}</small>
      </div>
      ${entry.description ? `<p>${cardText(entry.description)}</p>` : ""}
      ${triggers
        .map(
          (trigger) => `
            <div class="card-trigger">
              <b>${cardText([trigger.suits, trigger.name].filter(Boolean).join(" · "))}${trigger.stoneCost ? ` · ${stoneMarker(trigger.stoneCost)}` : ""}</b>
              ${trigger.description ? `<p>${cardText(trigger.description)}</p>` : ""}
            </div>`,
        )
        .join("")}
    </article>`;
}

function modelCardHtml(card) {
  const keywords = characterKeywordNames(card).join(", ");
  const characteristics = (card.characteristics || []).join(", ");
  const faction = [card.factionLabel, card.secondFactionLabel].filter(Boolean).join(" / ");
  const actions = Array.isArray(card.actions) ? card.actions : [];
  const abilities = Array.isArray(card.abilities) ? card.abilities : [];
  const stats = [
    ["Df", card.defense],
    ["Wp", card.willpower],
    ["Sp", card.speed],
    ["Health", card.health],
    ["Sz", card.size],
    ["Base", card.baseLabel || (card.base ? `${card.base}mm` : null)],
    ["Cost", card.cost],
  ];
  return `
    <div class="card-record">
      <header class="card-record-head">
        <div>
          <h3>${escapeHtml(card.displayName || card.name)}</h3>
          <p>${escapeHtml(
            [faction, card.stationLabel, keywords, characteristics].filter(Boolean).join(" · "),
          )}</p>
        </div>
        <span class="source-seal">BiggerHat · M4E</span>
      </header>
      <div class="card-stat-strip">
        ${stats
          .map(
            ([label, value]) =>
              `<span><small>${label}</small><b>${escapeHtml(value ?? "—")}</b></span>`,
          )
          .join("")}
      </div>
      <section class="card-rule-section">
        <div class="card-rule-heading">
          <h3>${message("cardActions")}</h3>
          <small>${message("exactEnglish")}</small>
        </div>
        <div class="card-rule-list">
          ${actions.length
            ? actions.map((action) => cardRuleHtml(action, "action")).join("")
            : `<div class="empty-state compact-empty"><div><strong>${message("cardNoActions")}</strong></div></div>`}
        </div>
      </section>
      <section class="card-rule-section">
        <div class="card-rule-heading">
          <h3>${message("cardAbilities")}</h3>
          <small>${message("exactEnglish")}</small>
        </div>
        <div class="card-rule-list">
          ${abilities.length
            ? abilities.map((ability) => cardRuleHtml(ability, "ability")).join("")
            : `<div class="empty-state compact-empty"><div><strong>${message("cardNoAbilities")}</strong></div></div>`}
        </div>
      </section>
    </div>`;
}

function compactTalentSourceCard(card, entry, slot) {
  const snapshot = {
    id: card.id,
    slug: card.slug,
    gameModeType: card.gameModeType,
    name: card.name,
    title: card.title,
    displayName: card.displayName,
    faction: card.faction,
    factionLabel: card.factionLabel,
    secondFaction: card.secondFaction,
    secondFactionLabel: card.secondFactionLabel,
    station: card.station,
    stationLabel: card.stationLabel,
    cost: card.cost,
    health: card.health,
    size: card.size,
    base: card.base,
    baseLabel: card.baseLabel,
    defense: card.defense,
    defenseSuit: card.defenseSuit,
    willpower: card.willpower,
    willpowerSuit: card.willpowerSuit,
    speed: card.speed,
    keywords: clone(card.keywords || []),
    characteristics: clone(card.characteristics || []),
    miniature: card.miniature ? clone(card.miniature) : null,
    fetchedAt: card.fetchedAt,
    source: card.source ? clone(card.source) : null,
    actions: [],
    abilities: [],
  };
  if (slot.kind === "ability") snapshot.abilities = [clone(entry)];
  else snapshot.actions = [clone(entry)];
  return snapshot;
}

function setCatalogStatus(target, text) {
  const element = document.querySelector(target);
  if (element) element.textContent = text;
}

function catalogErrorMessage(error) {
  if (error?.status === 429) {
    return message("catalogRateLimited", { seconds: error.retryAfter || 60 });
  }
  return message("catalogUnavailable");
}

function catalogResultHtml(character) {
  const affinity = characterAffinity(character);
  const keywords = characterKeywordNames(character).join(", ") || message("noKeywords");
  return `
    <button class="catalog-result" type="button" role="option" aria-selected="false" data-catalog-slug="${escapeHtml(character.slug)}">
      <b>${escapeHtml(character.displayName)}</b>
      <em>${character.cost == null ? "—" : escapeHtml(character.cost)}</em>
      <small>${escapeHtml(
        [character.factionLabel, character.stationLabel, keywords, affinity.label]
          .filter(Boolean)
          .join(" · "),
      )}</small>
    </button>`;
}

function talentKindLabel(slot) {
  if (!slot) return "";
  return localized(slot.type, slot.typeEn);
}

function storedTalentInput(talent) {
  if (!talent) return "";
  if (talent.mode === "biggerhat" && talent.source) {
    return [talent.name, talent.source].filter(Boolean).join(" · ");
  }
  return talent.name || "";
}

function selectedTalentDescription(talent) {
  const entry = talent?.snapshot?.entry;
  const trigger = talent?.snapshot?.selectedTrigger;
  if (!entry) return "";
  const description = String(entry.description || "").replace(/\s+/g, " ").trim();
  const triggerName = trigger ? `${message("talentTrigger")}: ${trigger.name}` : "";
  return [description, triggerName].filter(Boolean).join(" · ");
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
    keywordCountsAsComplete(0),
    keywordCountsAsComplete(1),
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
      const previous = new Map(
        state.leader.talents
          .filter((talent) => talent?.slotId)
          .map((talent) => [talent.slotId, talent]),
      );
      state.leader.archetype = button.dataset.archetype;
      const slots = archetypes[state.leader.archetype].talents;
      state.leader.talents = slots.map((slot) => {
        const saved = previous.get(slot.id);
        if (!saved) return normalizeStoredTalent({}, slot, 0);
        if (saved.mode === "biggerhat") {
          const rawSourceCost = saved.snapshot?.sourceCard?.cost;
          const hasSourceCost =
            rawSourceCost !== null &&
            rawSourceCost !== undefined &&
            Number.isFinite(Number(rawSourceCost));
          const sourceCost = hasSourceCost ? Number(rawSourceCost) : null;
          const wrongKind = saved.kind && saved.kind !== slot.kind;
          const tooExpensive = !hasSourceCost || sourceCost > slot.limit;
          const missingTrigger = slot.chooseTrigger && !saved.snapshot?.selectedTrigger;
          if (wrongKind || tooExpensive || missingTrigger) {
            return normalizeStoredTalent({}, slot, 0);
          }
        }
        const compatible = normalizeStoredTalent(saved, slot, 0);
        compatible.slotId = slot.id;
        compatible.kind = slot.kind;
        if (!slot.chooseTrigger && compatible.snapshot?.selectedTrigger) {
          compatible.snapshot = {
            ...compatible.snapshot,
            selectedTrigger: null,
            entry: compatible.snapshot.entry
              ? { ...compatible.snapshot.entry, triggers: [] }
              : compatible.snapshot.entry,
          };
        }
        return compatible;
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
      const saved = state.leader.talents[index] || normalizeStoredTalent({}, talent, index);
      const selectedDescription = selectedTalentDescription(saved);
      return `
        <div class="talent-row">
          <span class="talent-type">${localized(talent.type, talent.typeEn)}</span>
          <div class="field">
            <span>${message("talentSource")}</span>
            <span class="talent-input-line">
              <input data-talent-name="${index}" value="${escapeHtml(storedTalentInput(saved))}" placeholder="Peacebringer · Death Marshal" aria-label="${message("talentSource")}" />
              <button class="talent-pick-button" type="button" data-pick-talent="${index}">
                ${saved.mode === "biggerhat" ? message("changeCard") : message("chooseFromCard")}
              </button>
            </span>
            ${saved.mode === "biggerhat"
              ? `<small class="talent-picked-summary">
                  <span>${cardText(selectedDescription || message("cardAttached"))}</span>
                  <button class="talent-card-button" type="button" data-view-talent-card="${index}">${message("sourceCard")}</button>
                </small>`
              : ""}
          </div>
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
      const slot = data.talents[index];
      state.leader.talents[index] = normalizeStoredTalent(
        {
          slotId: slot.id,
          kind: slot.kind,
          mode: "manual",
          name: input.value,
          source: "",
          snapshot: null,
        },
        slot,
        index,
      );
      saveState();
    });
  });

  wrap.querySelectorAll("[data-pick-talent]").forEach((button) => {
    button.addEventListener("click", () => openTalentPicker(Number(button.dataset.pickTalent)));
  });

  wrap.querySelectorAll("[data-view-talent-card]").forEach((button) => {
    button.addEventListener("click", () => {
      const talent = state.leader.talents[Number(button.dataset.viewTalentCard)];
      const card = talent?.snapshot?.sourceCard;
      if (card) openCardDialog(card);
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
              <small>${escapeHtml(
                [displayModelType(model.type), model.henchman ? "Henchman" : "", model.keywords || message("noKeywords")]
                  .filter(Boolean)
                  .join(" · "),
              )}</small>
              ${model.cardSnapshot || model.cardSlug
                ? `<button class="model-card-link" type="button" data-view-model-card="${model.id}">
                    ${message("openCard")} · ${message("cardCounts", {
                      actions: model.cardSnapshot?.actions?.length || 0,
                      abilities: model.cardSnapshot?.abilities?.length || 0,
                    })}
                  </button>`
                : ""}
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
  list.querySelectorAll("[data-view-model-card]").forEach((button) => {
    button.addEventListener("click", () => {
      const model = state.arsenal.models.find(
        (item) => item.id === button.dataset.viewModelCard,
      );
      if (model) openStoredModelCard(model);
    });
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
    [
      "01",
      localized("Начало недели", "Start of a new week"),
      localized(
        "Начиная со второй недели каждый игрок нанимает минимум одну модель. Первая модель недели стоит на 5 скрип меньше.",
        "The start of each week is the only time players may add new models to their arsenal, and every player must add at least one model. The first model a player adds to their arsenal each week requires 5 fewer scrip.",
      ),
    ],
    [
      "02",
      localized("Подготовка", "Setup"),
      localized(
        "Размер встречи не выше стоимости меньшего арсенала +6. Нанимать можно только из своего арсенала.",
        "During the hire crew step of playing the encounter, you may only hire models in your current arsenal. You do not need to hire every model in your arsenal.",
      ),
    ],
    [
      "03",
      localized("Рейтинг", "Campaign rating"),
      localized(
        "Снаряжение в выбранной команде + продвижения лидера и тотема − травмы выбранных моделей.",
        "A crew’s campaign rating is equal to the total number of its pieces of equipment selected when hiring, +1 for each advancement the crew’s leader and totem have received (pg. 31). Then, subtract the total number of injuries in the crew from this total.",
      ),
    ],
    [
      "04",
      localized("Игра", "Strategic withdrawal"),
      localized(
        "Можно сделать Strategic Withdrawal в Start Phase. Ранний отход лишает VP, Barter, руки и выплаты.",
        "During the start phase of any turn, a crew may make a strategic withdrawal. The crew with initiative has the first chance to withdraw.",
      ),
    ],
    [
      "05",
      "Aftermath",
      localized(
        "Рука → Payday → Barter → развитие лидера → доктор → травмы. Флипы делаются строго по очереди.",
        "Aftermath is a special step added to every campaign game that takes place after a winner has been determined. Aftermath is used to determine what happened to the models during the course of the game. The aftermath step is broken into six phases:",
      ),
    ],
    [
      "06",
      localized("Новая глава", "Campaign end"),
      localized(
        "Сохраняйте арсенал, скрип, травмы и продвижения до конца согласованных 4–12 недель.",
        "At the start of the campaign, the group agreed to an allotted amount of time for the campaign to last (4-12 weeks). When the time is up, the campaign ends.",
      ),
    ],
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
    [localized("Флип", "Flip Value"), localized("Травма", "Injury Name"), localized("Краткий эффект", "Injury Effect")],
    injuries.map(([flip, name, ru, en]) => [displayFlip(flip), name, localized(ru, en)]),
  );
  document.querySelector("#reference-equipment").innerHTML = tableHtml(
    [localized("BR", "Barter Rating (BR)"), localized("Предмет", "CC · Equipment Name"), localized("CC / краткий эффект", "Effect Text")],
    equipment.map(([name, br, cc, ru, en]) => [displayBr(br), `CC ${cc} · ${name}`, localized(ru, en)]),
  );

  const tiers = [
    [
      localized("Тир I", "Tier 1"),
      localized("Модификации", "Advancement Tables"),
      ["Attack Modification Advancement (pg. 38)", "Tactical Modification Advancement (pg. 41)"],
    ],
    [
      localized("Тир II", "Tier 2"),
      localized("Новые таланты", "Advancement Tables"),
      ["Action Advancement (pg. 44)", "Ability Advancement (pg. 50)"],
    ],
    [
      localized("Тир III", "Tier 3"),
      localized("Переломный момент", "Advancement Tables"),
      ["Totem Advancement (pg. 52)", "Summoning Advancement (pg. 54)"],
    ],
    [
      localized("Тир IV", "Tier 4"),
      localized("Наследие команды", "Advancements"),
      ["Crew Card Advancement"],
    ],
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
              <small>${localized("При достижении пронумерованной ячейки можно выбрать таблицу этого тира или ниже.", "Advancement tables are broken into tiers numbered 1-4; the table you choose must have a tier equal to or lower than the number shown in the experience box you just checked off.")}</small>
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

function openCardDialog(card) {
  if (!card) return;
  activeCardView = card;
  const dialog = document.querySelector("#cardDialog");
  document.querySelector("#cardDialogTitle").textContent = card.displayName || card.name || message("openCard");
  document.querySelector("#cardDialogContent").innerHTML = modelCardHtml(card);
  if (!dialog.open) dialog.showModal();
}

async function openStoredModelCard(model) {
  if (model.cardSnapshot) {
    openCardDialog(model.cardSnapshot);
    return;
  }
  if (!model.cardSlug || !cardCatalog) {
    toast(message("cardLoadFailed"));
    return;
  }
  const dialog = document.querySelector("#cardDialog");
  activeCardView = null;
  document.querySelector("#cardDialogTitle").textContent = model.name;
  document.querySelector("#cardDialogContent").innerHTML =
    `<div class="empty-state"><div><strong>${message("catalogSelecting")}</strong></div></div>`;
  if (!dialog.open) dialog.showModal();
  try {
    const card = await cardCatalog.getCharacter(model.cardSlug);
    model.cardSnapshot = card;
    activeCardView = card;
    saveState();
    document.querySelector("#cardDialogTitle").textContent = card.displayName || model.name;
    document.querySelector("#cardDialogContent").innerHTML = modelCardHtml(card);
    renderArsenal();
  } catch {
    document.querySelector("#cardDialogContent").innerHTML =
      `<div class="empty-state"><div><strong>${message("cardLoadFailed")}</strong></div></div>`;
  }
}

function clearPendingModelCard(announce = false) {
  pendingModelCard = null;
  modelSelectionRequest += 1;
  const selection = document.querySelector("#modelCardSelection");
  selection.hidden = true;
  selection.innerHTML = "";
  document
    .querySelectorAll("#modelSearchResults .catalog-result")
    .forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-selected", "false");
    });
  if (announce) {
    setCatalogStatus("#modelCatalogStatus", message("cardDetached"));
  }
}

function resetModelPicker(options = {}) {
  modelSearchRequest += 1;
  modelSelectionRequest += 1;
  modelDetailController?.abort();
  modelDetailController = null;
  pendingModelCard = null;
  const form = document.querySelector("#modelForm");
  if (options.resetForm !== false) form.reset();
  document.querySelector("#modelCardSearch").value = "";
  document.querySelector("#modelSearchResults").innerHTML = "";
  document.querySelector("#modelCardSelection").hidden = true;
  document.querySelector("#modelCardSelection").innerHTML = "";
  setCatalogStatus("#modelCatalogStatus", "");
}

function renderModelCardSelection(card) {
  const selection = document.querySelector("#modelCardSelection");
  selection.hidden = false;
  selection.innerHTML = `
    <b>${escapeHtml(card.displayName)}</b>
    <small>${escapeHtml(
      [
        card.factionLabel,
        card.stationLabel,
        `Cost ${card.cost}`,
        message("cardCounts", {
          actions: card.actions?.length || 0,
          abilities: card.abilities?.length || 0,
        }),
      ]
        .filter(Boolean)
        .join(" · "),
    )}</small>
    <button type="button" data-clear-model-card aria-label="${message("deleteItem")}">×</button>`;
  selection
    .querySelector("[data-clear-model-card]")
    .addEventListener("click", () => clearPendingModelCard(true));
}

function fillModelFormFromCard(card) {
  const form = document.querySelector("#modelForm");
  form.elements.name.value = card.displayName;
  form.elements.cost.value = card.cost;
  form.elements.type.value = stationToModelType(card);
  form.elements.keywords.value = characterKeywordNames(card).join(", ");
  form.elements.henchman.checked = characterIsHenchman(card);
  const versatileInFaction = characterIsVersatile(card) && characterMatchesFaction(card);
  form.elements.versatile.checked = versatileInFaction;
  const hasCrewKeywords = selectedCrewKeywords().length > 0;
  form.elements.outOfKeyword.checked =
    hasCrewKeywords && !characterMatchesKeyword(card) && !versatileInFaction;
}

async function selectModelCatalogCard(slug) {
  if (!cardCatalog) return;
  const request = ++modelSelectionRequest;
  modelDetailController?.abort();
  const controller = new AbortController();
  modelDetailController = controller;
  setCatalogStatus("#modelCatalogStatus", message("catalogSelecting"));
  try {
    const card = await cardCatalog.getCharacter(slug, { signal: controller.signal });
    if (request !== modelSelectionRequest) return;
    if (!isHireableCard(card)) throw new Error("This character cannot be hired");
    pendingModelCard = card;
    fillModelFormFromCard(card);
    renderModelCardSelection(card);
    document
      .querySelectorAll("#modelSearchResults .catalog-result")
      .forEach((button) => {
        const selected = button.dataset.catalogSlug === slug;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-selected", String(selected));
      });
    setCatalogStatus("#modelCatalogStatus", message("catalogSelected"));
  } catch (error) {
    if (request !== modelSelectionRequest) return;
    setCatalogStatus("#modelCatalogStatus", catalogErrorMessage(error));
  } finally {
    if (request === modelSelectionRequest) modelDetailController = null;
  }
}

async function runModelCardSearch(force = false) {
  const resultsWrap = document.querySelector("#modelSearchResults");
  if (!cardCatalog) {
    setCatalogStatus("#modelCatalogStatus", message("catalogUnavailable"));
    return false;
  }
  const request = ++modelSearchRequest;
  const query = document.querySelector("#modelCardSearch").value;
  setCatalogStatus("#modelCatalogStatus", message("catalogLoading"));
  try {
    const found = await cardCatalog.searchCharacters(query, {
      force,
      limit: 1000,
      onProgress: (loaded, total) => {
        if (request !== modelSearchRequest) return;
        setCatalogStatus(
          "#modelCatalogStatus",
          message("catalogProgress", { loaded, total }),
        );
      },
    });
    if (request !== modelSearchRequest) return false;
    const eligible = sortCharactersForCrew(found.filter(isHireableCard));
    const visible = eligible.slice(0, 20);
    resultsWrap.innerHTML = visible.map(catalogResultHtml).join("");
    if (!visible.length) {
      setCatalogStatus("#modelCatalogStatus", message("catalogNoMatches"));
    } else {
      setCatalogStatus(
        "#modelCatalogStatus",
        `${message("catalogReady", { n: found.length })} ${message("modelPickerHint")}`,
      );
    }
    resultsWrap.querySelectorAll("[data-catalog-slug]").forEach((button) => {
      button.addEventListener("click", () =>
        selectModelCatalogCard(button.dataset.catalogSlug),
      );
    });
    return true;
  } catch (error) {
    if (request !== modelSearchRequest) return false;
    resultsWrap.innerHTML = "";
    setCatalogStatus("#modelCatalogStatus", catalogErrorMessage(error));
    return false;
  }
}

function emptyTalentEntryPanel() {
  document.querySelector("#talentEntryPanel").innerHTML = `
    <div class="empty-state compact-empty">
      <div>
        <strong>${message("talentChooseSource")}</strong>
      </div>
    </div>`;
}

function resetTalentPicker() {
  talentSearchRequest += 1;
  talentSourceRequest += 1;
  talentDetailController?.abort();
  talentDetailController = null;
  activeTalentSlot = null;
  selectedTalentSource = null;
  document.querySelector("#talentCardSearch").value = "";
  document.querySelector("#talentSearchResults").innerHTML = "";
  setCatalogStatus("#talentCatalogStatus", "");
  emptyTalentEntryPanel();
}

function openTalentPicker(index) {
  const archetype = archetypes[state.leader.archetype];
  const slot = archetype?.talents?.[index];
  if (!slot) return;
  talentSearchRequest += 1;
  talentSourceRequest += 1;
  activeTalentSlot = { index, slot };
  selectedTalentSource = null;
  document.querySelector("#talentCardSearch").value = "";
  document.querySelector("#talentSearchResults").innerHTML = "";
  document.querySelector("#talentPickerRule").textContent = message("talentPickerRule", {
    kind: talentKindLabel(slot),
    limit: slot.limit,
  });
  emptyTalentEntryPanel();
  const dialog = document.querySelector("#talentDialog");
  if (!dialog.open) dialog.showModal();
  runTalentCardSearch();
  document.querySelector("#talentCardSearch").focus();
}

async function runTalentCardSearch(force = false) {
  const resultsWrap = document.querySelector("#talentSearchResults");
  if (!activeTalentSlot || !cardCatalog) {
    setCatalogStatus("#talentCatalogStatus", message("catalogUnavailable"));
    return false;
  }
  const request = ++talentSearchRequest;
  const query = document.querySelector("#talentCardSearch").value;
  setCatalogStatus("#talentCatalogStatus", message("catalogLoading"));
  try {
    const found = await cardCatalog.searchCharacters(query, {
      force,
      limit: 1000,
      onProgress: (loaded, total) => {
        if (request !== talentSearchRequest) return;
        setCatalogStatus(
          "#talentCatalogStatus",
          message("catalogProgress", { loaded, total }),
        );
      },
    });
    if (request !== talentSearchRequest) return false;
    const arsenalSlugs = new Set(
      state.arsenal.models.map((model) => model.cardSlug).filter(Boolean),
    );
    const eligible = sortCharactersForCrew(
      found.filter(
        (character) =>
          isHireableCard(character) &&
          Number(character.cost) <= activeTalentSlot.slot.limit,
      ),
    ).sort((a, b) => Number(arsenalSlugs.has(b.slug)) - Number(arsenalSlugs.has(a.slug)));
    const visible = eligible.slice(0, 20);
    resultsWrap.innerHTML = visible.map(catalogResultHtml).join("");
    setCatalogStatus(
      "#talentCatalogStatus",
      visible.length
        ? message("catalogReady", { n: eligible.length })
        : message("catalogNoMatches"),
    );
    resultsWrap.querySelectorAll("[data-catalog-slug]").forEach((button) => {
      button.addEventListener("click", () =>
        selectTalentSourceCard(button.dataset.catalogSlug),
      );
    });
    return true;
  } catch (error) {
    if (request !== talentSearchRequest) return false;
    resultsWrap.innerHTML = "";
    setCatalogStatus("#talentCatalogStatus", catalogErrorMessage(error));
    return false;
  }
}

function eligibleTalentEntries(card, slot) {
  if (slot.kind === "ability") return Array.isArray(card.abilities) ? card.abilities : [];
  return (card.actions || []).filter((action) => action.type === slot.kind);
}

function renderTalentEntries(card) {
  const panel = document.querySelector("#talentEntryPanel");
  if (!activeTalentSlot) return;
  const { slot } = activeTalentSlot;
  const entries = eligibleTalentEntries(card, slot);
  if (!entries.length) {
    panel.innerHTML = `
      <div class="empty-state compact-empty">
        <div><strong>${message("talentNoEntries")}</strong></div>
      </div>`;
    return;
  }
  panel.innerHTML = `
    <div class="entry-source-heading">
      <h3>${escapeHtml(card.displayName)}</h3>
      <small>${escapeHtml(
        [card.factionLabel, card.stationLabel, `Cost ${card.cost}`].filter(Boolean).join(" · "),
      )}</small>
    </div>
    <div class="talent-entry-list">
      ${entries
        .map((entry) => {
          const requiresTrigger = Boolean(slot.chooseTrigger);
          const triggers = Array.isArray(entry.triggers) ? entry.triggers : [];
          const unavailable = requiresTrigger && !triggers.length;
          const kindLabel =
            slot.kind === "ability" ? "Ability" : entry.typeLabel || talentKindLabel(slot);
          return `
            <article class="talent-entry-choice">
              <h4>${escapeHtml(entry.name)}</h4>
              <small>${escapeHtml(
                slot.kind === "ability"
                  ? [kindLabel, abilityMeta(entry)]
                      .filter(Boolean)
                      .join(" · ")
                  : actionMeta(entry) || kindLabel,
              )}</small>
              ${entry.description ? `<p>${cardText(entry.description)}</p>` : ""}
              ${requiresTrigger && triggers.length
                ? `<div class="trigger-reference">
                    ${triggers
                      .map(
                        (trigger) => `
                          <div>
                            <b>${cardText(
                              [trigger.suits, trigger.name, stoneMarker(trigger.stoneCost)]
                                .filter(Boolean)
                                .join(" · "),
                            )}</b>
                            <span>${cardText(trigger.description)}</span>
                          </div>`,
                      )
                      .join("")}
                  </div>`
                : ""}
              <div class="entry-choice-actions">
                ${requiresTrigger
                  ? unavailable
                    ? `<span class="talent-trigger-warning">${message("talentNeedsTrigger")}</span>`
                    : `<label>
                        ${message("talentChooseTrigger")}
                        <select data-trigger-choice="${entry.id}">
                          ${triggers
                            .map(
                              (trigger) =>
                                `<option value="${trigger.id}">${escapeHtml(
                                  [
                                    plainCardText(trigger.suits),
                                    trigger.name,
                                    stoneMarker(trigger.stoneCost),
                                  ]
                                    .filter(Boolean)
                                    .join(" · "),
                                )}</option>`,
                            )
                            .join("")}
                        </select>
                      </label>`
                  : ""}
                <button class="entry-select-button" type="button" data-select-talent-entry="${entry.id}" ${unavailable ? "disabled" : ""}>
                  ${message("chooseFromCard")}
                </button>
              </div>
            </article>`;
        })
        .join("")}
    </div>`;
  panel.querySelectorAll("[data-select-talent-entry]").forEach((button) => {
    button.addEventListener("click", () =>
      chooseTalentEntry(String(button.dataset.selectTalentEntry)),
    );
  });
}

async function selectTalentSourceCard(slug) {
  if (!activeTalentSlot || !cardCatalog) return;
  const request = ++talentSourceRequest;
  talentDetailController?.abort();
  const controller = new AbortController();
  talentDetailController = controller;
  setCatalogStatus("#talentCatalogStatus", message("catalogSelecting"));
  try {
    const card = await cardCatalog.getCharacter(slug, { signal: controller.signal });
    if (request !== talentSourceRequest || !activeTalentSlot) return;
    if (
      !isHireableCard(card) ||
      Number(card.cost) > Number(activeTalentSlot.slot.limit)
    ) {
      throw new Error("This source exceeds the slot limit");
    }
    selectedTalentSource = card;
    renderTalentEntries(card);
    document
      .querySelectorAll("#talentSearchResults .catalog-result")
      .forEach((button) => {
        const selected = button.dataset.catalogSlug === slug;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-selected", String(selected));
      });
    setCatalogStatus("#talentCatalogStatus", message("catalogSelected"));
  } catch (error) {
    if (request !== talentSourceRequest) return;
    setCatalogStatus("#talentCatalogStatus", catalogErrorMessage(error));
  } finally {
    if (request === talentSourceRequest) talentDetailController = null;
  }
}

function chooseTalentEntry(entryId) {
  if (!activeTalentSlot || !selectedTalentSource) return;
  const { index, slot } = activeTalentSlot;
  const entries = eligibleTalentEntries(selectedTalentSource, slot);
  const entry = entries.find((item) => String(item.id) === String(entryId));
  if (!entry) return;
  let selectedTrigger = null;
  if (slot.chooseTrigger) {
    const select = document.querySelector(`[data-trigger-choice="${CSS.escape(String(entry.id))}"]`);
    selectedTrigger = entry.triggers?.find(
      (trigger) => String(trigger.id) === String(select?.value),
    );
    if (!selectedTrigger) {
      toast(message("talentNeedsTrigger"));
      return;
    }
  }

  const entrySnapshot = clone(entry);
  if (slot.kind !== "ability") {
    entrySnapshot.triggers = selectedTrigger ? [clone(selectedTrigger)] : [];
  }
  const talentsBefore = clone(state.leader.talents);
  state.leader.talents[index] = {
    slotId: slot.id,
    kind: slot.kind,
    mode: "biggerhat",
    cardId: selectedTalentSource.id,
    cardSlug: selectedTalentSource.slug,
    entryId: entry.id,
    name: entry.name,
    source: selectedTalentSource.displayName,
    snapshot: {
      sourceCard: compactTalentSourceCard(selectedTalentSource, entry, slot),
      entry: entrySnapshot,
      selectedTrigger: selectedTrigger ? clone(selectedTrigger) : null,
    },
  };
  if (!saveState()) {
    state.leader.talents = talentsBefore;
    renderTalents();
    return;
  }
  document.querySelector("#talentDialog").close();
  renderTalents();
  toast(message("talentEntrySelected", { name: entry.name }));
}

async function refreshCardCatalog(button) {
  if (!cardCatalog) {
    toast(message("catalogUnavailable"));
    return;
  }
  button.classList.add("is-loading");
  const dialog = button.closest("dialog");
  const success =
    dialog?.id === "talentDialog"
      ? await runTalentCardSearch(true)
      : await runModelCardSearch(true);
  button.classList.remove("is-loading");
  if (success) {
    cardCatalog.clearDetailCache();
    if (dialog?.id === "talentDialog") {
      selectedTalentSource = null;
      emptyTalentEntryPanel();
    } else if (pendingModelCard) {
      clearPendingModelCard(true);
    }
    toast(message("catalogRefreshed"));
  }
}

function renderAll() {
  renderChrome();
  renderDossier();
  [0, 1].forEach(renderKeywordValidation);
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
  resetModelPicker();
  document.querySelector("#modelDialog").showModal();
  runModelCardSearch();
  document.querySelector("#modelCardSearch").focus();
});

document
  .querySelector("#modelCardSearch")
  .addEventListener("input", debounce(() => runModelCardSearch(), 280));
document
  .querySelector("#talentCardSearch")
  .addEventListener("input", debounce(() => runTalentCardSearch(), 280));
document.querySelector("#modelForm").addEventListener("input", (event) => {
  if (
    pendingModelCard &&
    ["name", "cost", "type", "keywords", "henchman"].includes(event.target.name)
  ) {
    clearPendingModelCard(true);
  }
});
document.querySelectorAll("[data-refresh-catalog]").forEach((button) => {
  button.addEventListener("click", () => refreshCardCatalog(button));
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
    henchman: data.get("henchman") === "on",
    keywords: data.get("keywords").trim(),
    versatile: data.get("versatile") === "on",
    outOfKeyword: data.get("outOfKeyword") === "on",
    injuries: 0,
    cardId: pendingModelCard?.id ?? null,
    cardSlug: pendingModelCard?.slug ?? null,
    cardSnapshot: pendingModelCard ? clone(pendingModelCard) : null,
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
  const arsenalBefore = clone(state.arsenal);
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
  if (!saveState()) {
    state.arsenal = arsenalBefore;
    renderArsenal();
    return;
  }
  document.querySelector("#modelDialog").close();
  resetModelPicker();
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
    ["modelDialog", "talentDialog", "cardDialog"].forEach((id) => {
      const dialog = document.querySelector(`#${id}`);
      if (dialog.open) dialog.close();
    });
    resetModelPicker();
    resetTalentPicker();
    document.querySelectorAll("[data-bind]").forEach((input) => {
      input.value = getAtPath(input.dataset.bind) ?? "";
    });
    document.querySelectorAll("[data-path-choice]").forEach((input) => {
      input.checked = state.leader.path === input.value;
    });
    resetKeywordValidationState();
    renderAll();
    validateAllKeywords();
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
  ["modelDialog", "talentDialog", "cardDialog"].forEach((id) => {
    const dialog = document.querySelector(`#${id}`);
    if (dialog.open) dialog.close();
  });
  resetModelPicker();
  resetTalentPicker();
  document.querySelectorAll("[data-bind]").forEach((input) => {
    input.value = getAtPath(input.dataset.bind) ?? "";
  });
  document.querySelectorAll("[data-path-choice]").forEach((input) => {
    input.checked = state.leader.path === input.value;
  });
  document.querySelector("#gameForm").reset();
  resetKeywordValidationState();
  renderAll();
  validateAllKeywords();
  routeTo("dossier");
  toast(message("dossierReset"));
});
document.querySelectorAll("[data-locale]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextLocale = button.dataset.locale;
    if (!["ru", "en"].includes(nextLocale) || nextLocale === currentLocale) return;
    currentLocale = nextLocale;
    try {
      localStorage.setItem(LOCALE_KEY, currentLocale);
    } catch {
      // The language switch still works for the current session.
    }
    renderAll();
    if (document.querySelector("#modelDialog").open) {
      if (pendingModelCard) renderModelCardSelection(pendingModelCard);
      runModelCardSearch();
    }
    if (document.querySelector("#talentDialog").open && activeTalentSlot) {
      document.querySelector("#talentPickerRule").textContent = message("talentPickerRule", {
        kind: talentKindLabel(activeTalentSlot.slot),
        limit: activeTalentSlot.slot.limit,
      });
      if (selectedTalentSource) renderTalentEntries(selectedTalentSource);
      runTalentCardSearch();
    }
    if (document.querySelector("#cardDialog").open && activeCardView) {
      document.querySelector("#cardDialogTitle").textContent =
        activeCardView.displayName || activeCardView.name || message("openCard");
      document.querySelector("#cardDialogContent").innerHTML = modelCardHtml(activeCardView);
    }
  });
});
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(`#${button.dataset.closeDialog}`).close();
  });
});
document.querySelector("#modelDialog").addEventListener("close", () => resetModelPicker());
document.querySelector("#talentDialog").addEventListener("close", () => resetTalentPicker());
document.querySelector("#cardDialog").addEventListener("close", () => {
  activeCardView = null;
});

bindFields();
setupKeywordValidation();
renderAll();
routeTo(location.hash.slice(1) || "dossier");
validateAllKeywords();
