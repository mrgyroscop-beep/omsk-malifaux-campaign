(() => {
  "use strict";
  const root = document.querySelector("#organizerContent");
  const base = "/api/organizer-campaigns";
  const idPattern = /^[A-Za-z0-9_-]{12,64}$/u;
  const initial = new URL(location.href);
  let selectedId = idPattern.test(initial.searchParams.get("group") || "") ? initial.searchParams.get("group") : "";
  let selectedMember = initial.searchParams.get("participant") || "";
  let invitation = initial.searchParams.get("invite") || "";
  let groups = [], workspace = null, reader = null;
  let userId = null, generation = 0, readGeneration = 0;
  let busy = false, reading = false, loaded = false, error = "", readerError = "", notice = "";
  let tab = "arsenal", query = "";
  const drafts = {};
  const t = (ru, en) => window.MalifauxBuilder.getLocale() === "en" ? en : ru;
  const esc = (value) => String(value ?? "").replace(/[&<>"']/gu, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const request = (path, options) => window.MalifauxAccount.request(base + path, options);
  const date = (value) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString(t("ru-RU", "en-GB"), { dateStyle: "medium", timeStyle: "short" }) : "—";
  const action = (name, label, id = "", cls = "") => `<button type="button" class="button ${cls || "button-ghost"}" data-org-action="${name}" data-id="${esc(id)}">${label}</button>`;
  const empty = (title, description) => `<div class="org-empty"><span class="org-seal" aria-hidden="true">M</span><h2>${title}</h2><p>${description}</p></div>`;
  const value = (form, name, fallback = "") => esc(drafts[form]?.[name] ?? fallback);
  function errorText(code) {
    return ({
      account_required: t("Войдите в аккаунт, чтобы открыть кампании.", "Sign in to open campaigns."),
      authentication_required: t("Сессия завершена. Войдите снова.", "Your session expired. Sign in again."),
      unauthorized: t("Сессия завершена. Войдите снова.", "Your session expired. Sign in again."),
      not_found: t("Кампания недоступна или вы больше не участвуете в ней.", "This campaign is unavailable or you are no longer a participant."),
      organizer_required: t("Это действие доступно организатору кампании.", "This action requires the campaign organizer."),
      invite_invalid: t("Приглашение недействительно. Попросите организатора прислать новое.", "This invitation is invalid. Ask the organizer for a new one."),
      arsenal_required: t("Сначала сохраните свой арсенал в аккаунте.", "Save your arsenal to your account first."),
      sync_required: t("Завершите синхронизацию арсенала в окне аккаунта, затем повторите подключение.", "Finish syncing your arsenal in the account window, then try joining again."),
      already_joined: t("Этот арсенал уже подключён к кампании.", "This arsenal is already attached to the campaign."),
      arsenal_unavailable: t("Арсенал недоступен. Для приватного арсенала отправьте игроку приглашение.", "Arsenal unavailable. Send an invitation to the player for a private arsenal."),
      revision_conflict: t("Настройки изменились на другом устройстве. Обновите кампанию и внесите изменения повторно.", "Settings changed on another device. Refresh the campaign and apply your changes again."),
      import_denied: t("Проверьте ссылку и ключ организатора старой кампании.", "Check the legacy campaign link and organizer key."),
      invalid_link: t("Вставьте ссылку на облачное досье или его ID.", "Enter a cloud dossier link or ID."),
      invalid_data: t("Проверьте заполненные поля.", "Check the form fields."),
      rate_limited: t("Слишком много запросов. Повторите чуть позже.", "Too many requests. Try again shortly."),
    })[code] || t("Не удалось загрузить или сохранить данные. Проверьте соединение и повторите.", "Could not load or save data. Check your connection and try again.");
  }
  function locationState() {
    const url = new URL(location.href);
    for (const key of ["group", "participant", "invite"]) url.searchParams.delete(key);
    if (selectedId) url.searchParams.set("group", selectedId);
    if (selectedMember) url.searchParams.set("participant", selectedMember);
    if (invitation) url.searchParams.set("invite", invitation);
    history.replaceState(history.state, "", url);
  }
  function inviteUrl() {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("group", workspace.campaign.id);
    url.searchParams.set("invite", workspace.inviteToken);
    url.hash = "organizer";
    return url.href;
  }
  function parseArsenal(raw) {
    const value = String(raw || "").trim();
    if (idPattern.test(value)) return value;
    try {
      const url = new URL(value);
      const id = url.searchParams.get("campaign");
      if (["https:", "http:"].includes(url.protocol) && idPattern.test(id || "")) return id;
    } catch { /* Show the validation message below. */ }
    throw { code: "invalid_link" };
  }
  function listHtml() {
    const owned = groups.filter((g) => g.organizer), joined = groups.filter((g) => !g.organizer);
    const cards = (items) => `<div class="org-campaign-grid">${items.map((g) => `<button type="button" class="org-campaign-card" data-org-action="open" data-id="${esc(g.id)}">
      <span class="org-kicker">${g.organizer ? t("Организатор", "Organizer") : t("Участник", "Participant")}</span>
      <strong>${esc(g.name)}</strong><span>${t("Неделя", "Week")} ${g.week} / ${g.duration}</span><small>${t("Обновлено", "Updated")} ${date(g.updatedAt)}</small><b aria-hidden="true">↗</b></button>`).join("")}</div>`;
    return `<div class="org-heading"><div><p class="org-kicker">${t("Организаторский реестр", "Organizer's ledger")}</p><h1>${t("Мои кампании", "My campaigns")}</h1><p>${t("Соберите участников. Ведите общую историю. Каждый играет своим арсеналом.", "Gather participants and keep a shared history. Everyone plays with their own arsenal.")}</p></div><span class="org-heading-number" aria-hidden="true">${String(groups.length).padStart(2, "0")}</span></div>
      ${invitation && selectedId ? invitationHtml() : ""}
      ${owned.length ? cards(owned) : empty(t("Первая кампания начинается здесь", "Your first campaign starts here"), t("Организатору не нужен собственный арсенал. Создайте кампанию и пригласите игроков.", "An organizer does not need an arsenal. Create a campaign and invite players."))}
      ${joined.length ? `<h2>${t("Я участвую", "My participation")}</h2>${cards(joined)}` : ""}
      <div class="org-panel"><h2>${t("Создать кампанию", "Create campaign")}</h2><form data-org-form="create" class="org-form"><label>${t("Название", "Name")}<input name="name" maxlength="120" required value="${value("create", "name")}" placeholder="${t("Например, Тени Малифо", "For example, Shadows of Malifaux")}"></label><label>${t("Длительность, недель", "Duration, weeks")}<input name="duration" type="number" min="1" max="99" required value="${value("create", "duration", 8)}"></label><button class="button button-red">${t("Создать кампанию", "Create campaign")}</button></form></div>
      <details class="org-panel"><summary>${t("Перенести старую облачную кампанию", "Import a legacy cloud campaign")}</summary><p>${t("Скопируем участников и общую хронику. Исходное досье и старая ссылка сохранятся. Арсеналы подключаются отдельно.", "Copy participants and the shared chronicle. The original dossier and link remain available. Attach arsenals separately.")}</p><form data-org-form="import" class="org-form"><label>${t("Ссылка на старую кампанию", "Legacy campaign link")}<input name="link" required value="${value("import", "link")}"></label><label>${t("Ключ организатора", "Organizer key")}<input name="organizerToken" type="password" autocomplete="off" required></label><button class="button button-ink">${t("Перенести", "Import")}</button></form></details>`;
  }
  function invitationHtml() {
    return `<div class="org-panel org-invitation"><p class="org-kicker">${t("Приглашение в кампанию", "Campaign invitation")}</p><h2>${t("Подключить мой арсенал", "Attach my arsenal")}</h2><p>${t("Организатор сможет просматривать ваше облачное досье и его последующие обновления. Редактирование остаётся у вас. Вы сможете выйти из кампании.", "The organizer will be able to read your cloud dossier and future updates. You keep editing control and can leave the campaign.")}</p>${action("join", t("Подключить мой арсенал", "Attach my arsenal"), "", "button-red")}${action("dismiss-invite", t("Отмена", "Cancel"))}</div>`;
  }
  function workspaceHtml() {
    const { campaign: g, organizer, members, events } = workspace;
    const own = members.find((m) => m.isOwn);
    const filtered = members.filter((m) => `${m.playerName} ${m.crewName}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    return `<div class="org-breadcrumb">${action("list", t("← Все кампании", "← All campaigns"))}<span>${organizer ? t("Организатор", "Organizer") : t("Участник", "Participant")}</span></div>
      <div class="org-heading"><div><p class="org-kicker">${t("Общая кампания", "Shared campaign")}</p><h1>${esc(g.name)}</h1><p>${t("Неделя", "Week")} ${g.week} / ${g.duration} · ${t("Участников", "Participants")}: ${members.length}</p></div>${action("refresh", t("Обновить", "Refresh"))}</div>
      ${g.notes ? `<p class="org-notes">${esc(g.notes)}</p>` : ""}
      <div class="org-toolbar">${!own && organizer ? action("join", t("Подключить мой арсенал", "Attach my arsenal"), "", "button-red") : ""}${own ? `<span class="org-own-stamp">${t("Ваш арсенал подключён", "Your arsenal is attached")}</span>${action("leave", t("Выйти из кампании", "Leave campaign"), own.id)}` : ""}${organizer ? action("copy-invite", t("Скопировать приглашение", "Copy invitation")) : ""}</div>
      ${organizer ? `<details class="org-panel"><summary>${t("Участники и настройки кампании", "Participants & campaign settings")}</summary>
        <p>${t("Для приватного арсенала отправьте игроку приглашение. Публичное досье можно добавить по ссылке.", "Send an invitation for a private arsenal. Public dossiers can be attached by link.")}</p>
        <form data-org-form="attach" class="org-form"><label>${t("Имя игрока", "Player name")}<input name="playerName" required maxlength="80" value="${value("attach", "playerName")}"></label><label>${t("Ссылка на публичное досье", "Public dossier link")}<input name="link" required value="${value("attach", "link")}"></label><button class="button button-ink">${t("Добавить участника", "Add participant")}</button></form>
        <form data-org-form="settings" class="org-form org-settings"><label>${t("Название", "Name")}<input name="name" required maxlength="120" value="${value("settings", "name", g.name)}"></label><label>${t("Текущая неделя", "Current week")}<input name="week" type="number" min="1" max="99" required value="${value("settings", "week", g.week)}"></label><label>${t("Длительность, недель", "Duration, weeks")}<input name="duration" type="number" min="1" max="99" required value="${value("settings", "duration", g.duration)}"></label><label class="org-wide">${t("Договорённости группы", "Group agreement")}<textarea name="notes" maxlength="2000">${value("settings", "notes", g.notes)}</textarea></label><button class="button button-ink">${t("Сохранить настройки", "Save settings")}</button></form>
        <p class="org-hint">${t("Общая неделя задаётся здесь. Личные записи и незавершённые игры участников автоматически не меняются.", "Set the shared week here. Personal records and unfinished games are not changed automatically.")}</p>
        <label class="org-link-label">${t("Приглашение", "Invitation")}<input readonly value="${esc(inviteUrl())}" aria-label="${t("Ссылка приглашения", "Invitation link")}"></label>
        <div class="org-toolbar">${action("rotate-invite", t("Заменить приглашение", "Replace invitation"))}${action("delete-group", t("Удалить кампанию", "Delete campaign"), "", "org-danger")}</div></details>` : ""}
      <div class="org-desk"><aside class="org-participants"><div class="org-section-label"><h2>${t("Участники", "Participants")}</h2><span>${members.length}</span></div>
        <label class="org-search">${t("Поиск игрока или команды", "Search player or crew")}<input id="orgSearch" type="search" value="${esc(query)}" autocomplete="off"></label>
        <div id="orgParticipantList">${participantList(filtered)}</div>
      </aside><section class="org-viewer" aria-label="${t("Досье участника", "Participant dossier")}">
        ${viewerHtml()}
      </section></div>
      <section class="org-panel org-shared-history"><div class="org-section-label"><h2>${t("Общая хроника", "Shared chronicle")}</h2><span>${events.length}</span></div>
        ${organizer ? `<form data-org-form="event" class="org-form"><label>${t("Неделя", "Week")}<input name="week" type="number" min="1" max="99" required value="${value("event", "week", g.week)}"></label><label>${t("Событие", "Event")}<input name="title" required maxlength="140" value="${value("event", "title")}"></label><label class="org-wide">${t("Подробности", "Details")}<textarea name="details" maxlength="2000">${value("event", "details")}</textarea></label><button class="button button-ink">${t("Добавить запись", "Add entry")}</button></form>` : ""}
        ${events.length ? `<ol class="org-events">${events.map((e) => `<li><span class="org-week">${t("Неделя", "Week")} ${e.week}</span><div><h3>${esc(e.title)}</h3><p>${esc(e.details)}</p><small>${date(e.createdAt)}</small></div>${organizer ? action("delete-event", t("Удалить", "Delete"), e.id) : ""}</li>`).join("")}</ol>` : `<p class="org-hint">${t("Пока нет записей. Здесь появится общая история кампании.", "No entries yet. The shared campaign story will appear here.")}</p>`}</section>`;
  }
  function participantList(members) {
    return members.length ? members.map((m) => `<div class="org-member ${selectedMember === m.id ? "is-selected" : ""}"><button type="button" data-org-action="member" data-id="${esc(m.id)}" aria-pressed="${selectedMember === m.id}"><strong>${esc(m.playerName)}</strong><span>${esc(m.crewName || t("Арсенал не подключён", "No arsenal attached"))}</span><small>${esc(m.faction)}${m.isOwn ? ` · ${t("Вы", "You")}` : ""}</small></button>
      <span class="org-member-stat">${t("Игр", "Games")}: ${m.gamesPlayed} · ${t("Побед", "Wins")}: ${m.wins}</span></div>`).join("") : `<p class="org-hint">${query ? t("Никого не найдено.", "No matches.") : t("Пригласите игроков или подключите свой арсенал.", "Invite players or attach your own arsenal.")}</p>`;
  }
  function viewerHtml() {
    const m = workspace.members.find((m) => m.id === selectedMember);
    if (!m) return empty(t("Арсеналы рядом", "Arsenals at hand"), t("Выберите участника слева. Его досье откроется здесь, а ваш арсенал останется на месте.", "Choose a participant. Their dossier opens here while your arsenal stays in place."));
    return `<header class="org-viewer-head"><div><p class="org-kicker">${t("Просмотр досье", "Dossier preview")}</p><h2>${esc(m.playerName)}</h2><span class="org-readonly">${t("Только чтение", "Read only")}</span></div>${m.canRead ? action("refresh-member", t("Обновить досье", "Refresh dossier")) : ""}</header>
      ${workspace.organizer ? `<details class="org-member-tools"><summary>${t("Управление участником", "Manage participant")}</summary><form data-org-form="relink" class="org-form"><label>${t("Имя игрока", "Player name")}<input name="playerName" required maxlength="80" value="${value("relink", "playerName", m.playerName)}"></label><label>${t("Публичная ссылка или ID арсенала", "Public link or arsenal ID")}<input name="link" value="${value("relink", "link", m.arsenalId || "")}" placeholder="${t("Пусто — отвязать арсенал", "Leave empty to detach arsenal")}"></label><button class="button button-ink">${t("Сохранить привязку", "Save attachment")}</button></form>${action("remove-member", t("Удалить участника из кампании", "Remove participant from campaign"), m.id)}</details>` : ""}
      ${!m.canRead ? `<p class="org-hint">${!m.arsenalId ? t("Арсенал не подключён. Добавьте публичную ссылку или попросите игрока войти по приглашению.", "No arsenal attached. Add a public link or ask the player to join by invitation.") : t("Просмотр этого арсенала доступен его владельцу и организатору.", "This arsenal can be viewed by its owner and the organizer.")}</p>` : `
      <div class="org-reader-tabs" role="group" aria-label="${t("Раздел досье", "Dossier section")}">${[["all", t("Досье", "Dossier")], ["leader", t("Лидер", "Leader")], ["arsenal", t("Арсенал", "Arsenal")]].map(([key, label]) => `<button type="button" data-org-action="tab" data-id="${key}" aria-pressed="${tab === key}">${label}</button>`).join("")}</div>
      ${reading ? `<p class="org-hint" role="status">${t("Загружаю досье…", "Loading dossier…")}</p>` : readerError ? `<div class="org-error" role="alert">${readerError}${action("refresh-member", t("Повторить", "Retry"))}</div>` : reader ? `<p class="org-updated">${t("Облачная версия от", "Cloud version from")} ${date(reader.updatedAt)}</p><div class="org-reader" id="orgReader" data-reader-tab="${tab}"></div>` : ""}`}`;
  }
  function render() {
    if (!root) return;
    const focused = root.contains(document.activeElement) ? document.activeElement : null;
    const focusSelector = focused?.id ? `#${CSS.escape(focused.id)}` : focused?.dataset.orgAction
      ? `[data-org-action="${CSS.escape(focused.dataset.orgAction)}"][data-id="${CSS.escape(focused.dataset.id || "")}"]` : null;
    const openDetails = [...root.querySelectorAll("details")].map((el) => el.open);
    const user = window.MalifauxAccount?.getUser();
    root.innerHTML = `${error ? `<div class="org-error" role="alert">${esc(error)}${action("refresh", t("Повторить", "Retry"))}</div>` : ""}${notice ? `<p class="org-notice" role="status">${esc(notice)}</p>` : ""}
      ${!user ? `<div class="org-heading"><div><p class="org-kicker">${t("Отдельное пространство кампании", "A separate campaign workspace")}</p><h1>${t("Кампании организатора", "Organizer campaigns")}</h1><p>${t("Участники, арсеналы и общая хроника — в одной папке.", "Participants, arsenals and the shared chronicle in one folder.")}</p></div>${empty(t("Войдите, чтобы продолжить", "Sign in to continue"), invitation ? t("После входа вы сможете подключить свой арсенал по приглашению.", "After signing in, you can attach your arsenal using the invitation.") : t("Ваши кампании будут доступны на других устройствах. Личный арсенал ведётся отдельно.", "Your campaigns will be available on other devices. Your personal arsenal stays separate."))}${action("login", t("Войти в аккаунт", "Sign in"), "", "button-red")}` : workspace ? workspaceHtml() : listHtml()}`;
    root.setAttribute("aria-busy", String(busy));
    root.querySelectorAll("details").forEach((el, index) => { el.open = Boolean(openDetails[index]); });
    root.querySelectorAll("button, input, textarea").forEach((el) => { if (busy) el.disabled = true; });
    const readerRoot = root.querySelector("#orgReader");
    if (readerRoot && reader) {
      try { readerRoot.append(window.createReadOnlyDossier(reader.dossier)); }
      catch { readerRoot.innerHTML = `<p class="org-error">${t("Не удалось отобразить досье. Обновите страницу или попросите игрока пересохранить арсенал.", "Could not display this dossier. Refresh or ask the player to save it again.")}</p>`; }
    }
    if (focusSelector) root.querySelector(focusSelector)?.focus({ preventScroll: true });
  }
  async function loadReader(id) {
    const sequence = ++readGeneration, accountGeneration = generation;
    reader = null; readerError = "";
    const member = workspace?.members.find((m) => m.id === id);
    if (!member?.canRead) { reading = false; render(); return; }
    reading = true; render();
    try {
      const result = await request(`/${selectedId}/members/${id}/arsenal`);
      if (sequence !== readGeneration || accountGeneration !== generation) return;
      reader = result.arsenal;
    } catch (e) {
      if (sequence !== readGeneration || accountGeneration !== generation) return;
      readerError = errorText(e.code);
    } finally {
      if (sequence === readGeneration && accountGeneration === generation) { reading = false; render(); }
    }
  }
  async function run(task) {
    if (busy) return;
    const current = generation;
    busy = true; error = ""; notice = ""; render();
    try { await task(current); }
    catch (e) { if (current === generation) error = errorText(e.code); }
    finally { if (current === generation) { busy = false; render(); } }
  }
  function accept(result) {
    if (workspace?.campaign.id !== result.campaign.id) {
      for (const key of ["settings", "attach", "event", "relink"]) delete drafts[key];
    }
    workspace = result; selectedId = result.campaign.id; invitation = "";
    if (!result.members.some((m) => m.id === selectedMember)) { selectedMember = ""; reader = null; ++readGeneration; }
    locationState();
  }
  async function load() {
    if (!window.MalifauxAccount.getUser()) { render(); return; }
    await run(async (current) => {
      const result = await request("");
      if (current !== generation) return;
      groups = result.campaigns; loaded = true;
      if (selectedId && (!invitation || groups.some((g) => g.id === selectedId))) {
        const detail = await request(`/${selectedId}`);
        if (current !== generation) return;
        accept(detail);
      }
    });
    if (workspace && selectedMember) void loadReader(selectedMember);
  }
  root.addEventListener("input", (event) => {
    if (event.target.id === "orgSearch") {
      query = event.target.value;
      root.querySelector("#orgParticipantList").innerHTML = participantList(workspace.members.filter((m) => `${m.playerName} ${m.crewName}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
      return;
    }
    const form = event.target.closest("[data-org-form]");
    if (form && event.target.name) {
      // Secret keys stay in the visible input, never in drafts or persistent storage.
      if (event.target.name === "organizerToken") return;
      (drafts[form.dataset.orgForm] ||= {})[event.target.name] = event.target.value;
    }
  });
  root.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-org-form]");
    if (!form) return;
    event.preventDefault();
    const type = form.dataset.orgForm, body = Object.fromEntries(new FormData(form));
    void run(async (current) => {
      let path = "", method = "POST", payload = body;
      if (type === "settings") { path = `/${selectedId}`; method = "PATCH"; payload.revision = workspace.campaign.revision; }
      if (type === "attach" || type === "relink") {
        path = `/${selectedId}/members${type === "relink" ? `/${selectedMember}` : ""}`;
        method = type === "relink" ? "PATCH" : "POST";
        payload = { playerName: body.playerName, arsenalId: body.link.trim() ? parseArsenal(body.link) : null };
      }
      if (type === "event") path = `/${selectedId}/events`;
      if (type === "import") { path = "/import"; payload = { campaignId: parseArsenal(body.link), organizerToken: body.organizerToken }; }
      const result = await request(path, { method, body: payload });
      if (current !== generation) return;
      delete drafts[type]; accept(result);
      notice = t("Сохранено.", "Saved.");
      if (type === "relink" && selectedMember) void loadReader(selectedMember);
    });
  });
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-org-action]");
    if (!button || busy) return;
    const name = button.dataset.orgAction, id = button.dataset.id;
    if (name === "login") return document.querySelector("#openAccountButton").click();
    if (name === "tab") { tab = id; render(); return; }
    if (name === "member") { selectedMember = id; delete drafts.relink; locationState(); void loadReader(id); return; }
    if (name === "refresh-member") { void loadReader(selectedMember); return; }
    if (name === "dismiss-invite") { invitation = ""; selectedId = ""; locationState(); render(); return; }
    if (name === "list") { selectedId = ""; selectedMember = ""; workspace = null; reader = null; ++readGeneration; query = ""; locationState(); void load(); return; }
    if (name === "open") { selectedId = id; selectedMember = ""; workspace = null; reader = null; ++readGeneration; query = ""; delete drafts.settings; locationState(); void load(); return; }
    if (name === "refresh") { delete drafts.settings; void load(); return; }
    void run(async (current) => {
      if (name === "copy-invite") {
        const link = inviteUrl();
        try { await navigator.clipboard.writeText(link); notice = t("Приглашение скопировано.", "Invitation copied."); }
        catch { notice = t("Скопируйте приглашение из поля в настройках кампании.", "Copy the invitation from the field in campaign settings."); }
        return;
      }
      if (name === "join") {
        await window.MalifauxAccount.sync();
        if (current !== generation) return;
        if (window.MalifauxAccount.getSyncStatus() !== "synced") throw { code: "sync_required" };
        const result = await request(`/${selectedId}/join`, { method: "POST", body: { inviteToken: invitation } });
        if (current !== generation) return;
        accept(result); notice = t("Ваш арсенал подключён.", "Your arsenal is attached."); return;
      }
      if (name === "delete-group") {
        if (!confirm(t("Удалить кампанию, список участников и общую хронику? Арсеналы игроков сохранятся.", "Delete the campaign, participants and shared chronicle? Player arsenals will remain."))) return;
        await request(`/${selectedId}`, { method: "DELETE" });
        if (current !== generation) return;
        workspace = null; selectedId = ""; selectedMember = ""; reader = null; ++readGeneration; locationState();
        const result = await request("");
        if (current === generation) groups = result.campaigns;
        return;
      }
      if (name === "remove-member" || name === "leave") {
        if (!confirm(t("Отключить участника от кампании? Его арсенал сохранится.", "Detach this participant? Their arsenal will remain."))) return;
        await request(`/${selectedId}/members/${id}`, { method: "DELETE" });
        if (current !== generation) return;
        if (name === "leave" && !workspace.organizer) {
          workspace = null; selectedId = ""; selectedMember = ""; reader = null; ++readGeneration; locationState();
          const result = await request("");
          if (current === generation) groups = result.campaigns;
        } else {
          const result = await request(`/${selectedId}`);
          if (current === generation) accept(result);
        }
        return;
      }
      if (name === "delete-event") {
        if (!confirm(t("Удалить запись общей хроники?", "Delete this shared chronicle entry?"))) return;
        const result = await request(`/${selectedId}/events/${id}`, { method: "DELETE" });
        if (current === generation) accept(result); return;
      }
      if (name === "rotate-invite") {
        if (!confirm(t("Заменить приглашение? Старая ссылка перестанет подключать новых участников.", "Replace the invitation? The old link will no longer allow new participants to join."))) return;
        const result = await request(`/${selectedId}/invite`, { method: "POST", body: {} });
        if (current === generation) accept(result);
      }
    });
  });
  function onRoute() {
    if (location.hash !== "#organizer") return;
    if (!loaded) void load();
    else render();
  }
  window.addEventListener("malifaux-account-change", (event) => {
    const id = event.detail.user?.id || null;
    if (id === userId) return;
    userId = id; ++generation; ++readGeneration;
    workspace = null; groups = []; reader = null; busy = false; reading = false; error = ""; notice = ""; loaded = false;
    for (const key of Object.keys(drafts)) delete drafts[key];
    render(); onRoute();
  });
  window.addEventListener("hashchange", onRoute);
  window.addEventListener("malifaux-route-change", onRoute);
  window.addEventListener("malifaux-locale-change", render);
  userId = window.MalifauxAccount?.getUser()?.id || null;
  render();
  if (selectedId && location.hash !== "#organizer") location.hash = "organizer";
  else onRoute();
})();
