(() => {
  "use strict";

  const CONNECTION_KEY = "m4e-cloud-campaign-v1";
  const ORGANIZER_KEYS_KEY = "m4e-cloud-organizer-keys-v1";
  const SESSION_KEY = "m4e-cloud-session-v1";
  const API_ROOT =
    document.querySelector('meta[name="app-api-url"]')?.content.trim().replace(/\/+$/u, "") ||
    "";
  const TURNSTILE_SITEKEY =
    document.querySelector('meta[name="turnstile-sitekey"]')?.content.trim() || "";

  const cloudDialog = document.querySelector("#cloudDialog");
  const cloudContent = document.querySelector("#cloudDialogContent");
  const securityDialog = document.querySelector("#securityDialog");
  const securityClose = document.querySelector("#securityDialogClose");
  const securityStatus = document.querySelector("#securityStatus");
  const turnstileWidget = document.querySelector("#turnstileWidget");

  let organizerKeys = loadOrganizerKeys();
  let connection = loadConnection();
  let cloudData = null;
  let cloudBusy = false;
  let cloudError = "";
  let editingPlayerId = null;
  let editingEventId = null;
  let challengePromise = null;
  let challengeResolve = null;
  let challengeReject = null;
  let challengeTimeoutId = null;
  let turnstileWidgetId = null;

  function locale() {
    return window.MalifauxBuilder?.getLocale?.() === "en" ? "en" : "ru";
  }

  function text(ru, en) {
    return locale() === "en" ? en : ru;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function notify(ru, en = ru) {
    window.MalifauxBuilder?.notify?.(text(ru, en));
  }

  function loadOrganizerKeys() {
    try {
      const stored = JSON.parse(localStorage.getItem(ORGANIZER_KEYS_KEY) || "{}");
      if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
      return Object.fromEntries(
        Object.entries(stored)
          .slice(0, 50)
          .filter(
            ([campaignId, token]) =>
              /^[A-Za-z0-9_-]{12,64}$/u.test(campaignId) &&
              typeof token === "string" &&
              /^[A-Za-z0-9_-]{32,128}$/u.test(token),
          ),
      );
    } catch {
      return {};
    }
  }

  function saveOrganizerKeys() {
    try {
      localStorage.setItem(ORGANIZER_KEYS_KEY, JSON.stringify(organizerKeys));
    } catch {
      // The in-memory organizer key remains usable in the open tab.
    }
  }

  function loadConnection() {
    try {
      const stored = JSON.parse(localStorage.getItem(CONNECTION_KEY) || "null");
      if (
        !stored ||
        typeof stored.campaignId !== "string" ||
        !/^[A-Za-z0-9_-]{12,64}$/u.test(stored.campaignId)
      ) {
        return null;
      }
      const legacyToken =
        typeof stored.organizerToken === "string" &&
        /^[A-Za-z0-9_-]{32,128}$/u.test(stored.organizerToken)
          ? stored.organizerToken
          : "";
      if (legacyToken && !organizerKeys[stored.campaignId]) {
        organizerKeys[stored.campaignId] = legacyToken;
        saveOrganizerKeys();
      }
      return {
        campaignId: stored.campaignId,
        organizerToken: organizerKeys[stored.campaignId] || legacyToken,
      };
    } catch {
      return null;
    }
  }

  function saveConnection(value) {
    if (value) {
      const campaignId = String(value.campaignId || "");
      const suppliedToken = String(value.organizerToken || "");
      if (
        /^[A-Za-z0-9_-]{12,64}$/u.test(campaignId) &&
        /^[A-Za-z0-9_-]{32,128}$/u.test(suppliedToken)
      ) {
        organizerKeys[campaignId] = suppliedToken;
        saveOrganizerKeys();
      }
      connection = {
        campaignId,
        organizerToken: organizerKeys[campaignId] || "",
      };
    } else {
      connection = null;
    }
    try {
      if (connection) {
        localStorage.setItem(
          CONNECTION_KEY,
          JSON.stringify({ campaignId: connection.campaignId }),
        );
      }
      else localStorage.removeItem(CONNECTION_KEY);
    } catch {
      // The open page still keeps the connection in memory.
    }
  }

  function forgetOrganizerKey(campaignId) {
    if (!campaignId || !organizerKeys[campaignId]) return;
    delete organizerKeys[campaignId];
    saveOrganizerKeys();
    if (connection?.campaignId === campaignId) connection.organizerToken = "";
  }

  function loadSession() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (
        stored &&
        typeof stored.token === "string" &&
        Number(stored.expiresAt) > Date.now() + 60_000
      ) {
        return stored;
      }
    } catch {
      // A new Turnstile challenge will be requested.
    }
    return null;
  }

  function saveSession(token, expiresIn) {
    const value = {
      token,
      expiresAt: Date.now() + Math.max(60, Number(expiresIn || 7200)) * 1000,
    };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
    } catch {
      // The token remains usable for this request.
    }
    return value;
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing else to clear.
    }
  }

  function waitForTurnstile() {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const check = () => {
        if (window.turnstile?.render) {
          resolve(window.turnstile);
          return;
        }
        if (Date.now() - startedAt > 12_000) {
          reject(new Error("turnstile_unavailable"));
          return;
        }
        window.setTimeout(check, 100);
      };
      check();
    });
  }

  function finishChallenge(error, token) {
    const resolve = challengeResolve;
    const reject = challengeReject;
    challengeResolve = null;
    challengeReject = null;
    if (challengeTimeoutId !== null) {
      window.clearTimeout(challengeTimeoutId);
      challengeTimeoutId = null;
    }
    if (securityDialog.open) securityDialog.close();
    if (error) reject?.(error);
    else resolve?.(token);
  }

  function rejectChallengeSoon(code) {
    window.setTimeout(() => {
      if (challengeReject) finishChallenge(new Error(code));
    }, 900);
  }

  async function exchangeTurnstileToken(turnstileToken) {
    securityStatus.textContent = text(
      "Ставлю защищённый штамп…",
      "Applying the secure stamp…",
    );
    try {
      const response = await fetch(`${API_ROOT}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.token !== "string") {
        throw new Error(payload.error || "session_failed");
      }
      const session = saveSession(payload.token, payload.expiresIn);
      securityStatus.textContent = text("Готово.", "Done.");
      finishChallenge(null, session.token);
    } catch {
      securityStatus.textContent = text(
        "Штамп не принят. Обновите проверку и попробуйте ещё раз.",
        "The stamp was not accepted. Refresh the check and try again.",
      );
      if (turnstileWidgetId !== null) window.turnstile?.reset(turnstileWidgetId);
    }
  }

  async function renderTurnstile() {
    if (!API_ROOT || !TURNSTILE_SITEKEY) throw new Error("turnstile_not_configured");
    const turnstile = await waitForTurnstile();
    if (turnstileWidgetId !== null) {
      turnstile.reset(turnstileWidgetId);
      return;
    }
    turnstileWidgetId = turnstile.render(turnstileWidget, {
      sitekey: TURNSTILE_SITEKEY,
      action: "api_session",
      theme: "light",
      size: "flexible",
      callback: exchangeTurnstileToken,
      "expired-callback": () => {
        securityStatus.textContent = text(
          "Срок проверки истёк — повторите её.",
          "The check expired. Please complete it again.",
        );
      },
      "error-callback": () => {
        securityStatus.textContent = text(
          "Cloudflare не удалось загрузить проверку.",
          "Cloudflare could not load the check.",
        );
        rejectChallengeSoon("turnstile_unavailable");
      },
    });
  }

  async function ensureSession() {
    const current = loadSession();
    if (current) return current.token;
    if (challengePromise) return challengePromise;

    challengePromise = new Promise((resolve, reject) => {
      challengeResolve = resolve;
      challengeReject = reject;
    }).finally(() => {
      challengePromise = null;
    });
    challengeTimeoutId = window.setTimeout(() => {
      securityStatus.textContent = text(
        "Проверка не завершилась вовремя. Запустите действие ещё раз.",
        "The check timed out. Start the action again.",
      );
      rejectChallengeSoon("turnstile_timeout");
    }, 90_000);

    securityStatus.textContent = text(
      "Подготавливаю проверку…",
      "Preparing the check…",
    );
    if (!securityDialog.open) securityDialog.showModal();
    renderTurnstile().catch(() => {
      securityStatus.textContent = text(
        "Проверка недоступна. Проверьте соединение и повторите.",
        "The check is unavailable. Check your connection and try again.",
      );
      rejectChallengeSoon("turnstile_unavailable");
    });
    return challengePromise;
  }

  class ApiError extends Error {
    constructor(status, code, payload) {
      super(code);
      this.status = status;
      this.code = code;
      this.payload = payload;
    }
  }

  async function api(path, options = {}, retry = true) {
    if (!API_ROOT || location.protocol === "file:") {
      throw new ApiError(0, "api_unavailable", {});
    }
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (options.protected) {
      headers.Authorization = `Bearer ${await ensureSession()}`;
    }
    if (options.organizer && connection?.organizerToken) {
      headers["X-Organizer-Token"] = connection.organizerToken;
    }

    const response = await fetch(`${API_ROOT}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 && options.protected && retry) {
      clearSession();
      return api(path, options, false);
    }
    if (!response.ok) {
      throw new ApiError(response.status, payload.error || "request_failed", payload);
    }
    return payload;
  }

  function parseCampaignId(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const candidate = new URL(raw, location.href).searchParams.get("campaign");
      if (candidate) return candidate;
    } catch {
      // Treat the value as a bare campaign ID.
    }
    return /^[A-Za-z0-9_-]{12,64}$/u.test(raw) ? raw : "";
  }

  function publicShareUrl(campaignId = connection?.campaignId) {
    const configured =
      document.querySelector('meta[name="public-site-url"]')?.content.trim() ||
      location.href;
    const url = new URL(configured, location.href);
    url.searchParams.set("campaign", campaignId);
    url.hash = "chronicle";
    return url.toString();
  }

  function updateLocation(campaignId) {
    const url = new URL(location.href);
    if (campaignId) url.searchParams.set("campaign", campaignId);
    else url.searchParams.delete("campaign");
    history.replaceState(history.state || {}, "", url);
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(locale() === "en" ? "en-GB" : "ru-RU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  function setBusy(value) {
    cloudBusy = value;
    renderCloud();
  }

  function errorText(code) {
    const messages = {
      api_unavailable: text(
        "Облако доступно в опубликованной версии или через localhost.",
        "Cloud features are available on the published site or through localhost.",
      ),
      organizer_required: text(
        "Ключ организатора не подошёл. Публичный просмотр продолжает работать.",
        "The organizer key was not accepted. Public read-only access still works.",
      ),
      revision_conflict: text(
        "Облачное досье изменилось в другом окне. Я загрузил свежую версию; проверьте её перед повторным сохранением.",
        "The cloud dossier changed elsewhere. The latest version was loaded; review it before saving again.",
      ),
      rate_limited: text(
        "Слишком много изменений подряд. Подождите минуту.",
        "Too many changes in a short time. Wait a minute.",
      ),
      not_found: text("Кампания не найдена.", "Campaign not found."),
      database_not_configured: text(
        "Облачная база пока не настроена.",
        "The cloud database is not configured yet.",
      ),
    };
    return messages[code] || text(
      "Не удалось связаться с облачным архивом.",
      "Could not reach the cloud archive.",
    );
  }

  function onboardingHtml() {
    return `
      <section class="cloud-onboarding">
        <div class="cloud-onboarding-copy">
          <span class="cloud-file-code">CLOUD FILE / 00</span>
          <h3>${text("Одна кампания — одна общая папка", "One campaign, one shared file")}</h3>
          <p>${text(
            "Досье остаётся в браузере и работает без сети. Облако добавляет резервную копию, общую хронику и таблицу игроков.",
            "Your dossier stays in the browser and works offline. The cloud adds a backup, a shared chronicle, and a player table.",
          )}</p>
          <div class="cloud-privacy-note">
            <b>${text("Без аккаунтов", "No accounts")}</b>
            <span>${text(
              "Ссылка даёт просмотр. Отдельный длинный ключ даёт права организатора — не отправляйте его игрокам.",
              "The link grants read access. A separate long key grants organizer access—do not send it to players.",
            )}</span>
          </div>
        </div>
        <div class="cloud-onboarding-forms">
          <form id="cloudCreateForm" class="cloud-sheet-form">
            <span class="kicker">${text("Новая папка", "New file")}</span>
            <h4>${text("Создать облачную кампанию", "Create a cloud campaign")}</h4>
            <label>
              <span>${text("Название", "Name")}</span>
              <input
                name="name"
                maxlength="120"
                value="${escapeHtml(window.MalifauxBuilder?.getState?.().crew?.name || "")}"
                placeholder="${text("Например, Омский реестр", "For example, The Omsk Index")}"
                required
              />
            </label>
            <button class="button button-red" type="submit" ${cloudBusy ? "disabled" : ""}>
              ${text("Создать и сохранить досье", "Create and save dossier")}
            </button>
          </form>
          <div class="cloud-or"><span>${text("или", "or")}</span></div>
          <form id="cloudConnectForm" class="cloud-sheet-form">
            <span class="kicker">${text("Готовая папка", "Existing file")}</span>
            <h4>${text("Открыть по ссылке", "Open from a link")}</h4>
            <label>
              <span>${text("Ссылка или ID кампании", "Campaign link or ID")}</span>
              <input name="reference" autocomplete="off" required />
            </label>
            <label>
              <span>${text("Ключ организатора · необязательно", "Organizer key · optional")}</span>
              <input name="organizerToken" type="password" autocomplete="off" />
            </label>
            <button class="button button-ink" type="submit" ${cloudBusy ? "disabled" : ""}>
              ${text("Открыть папку", "Open file")}
            </button>
          </form>
        </div>
      </section>`;
  }

  function playerFormHtml() {
    if (!connection?.organizerToken) return "";
    const player = editingPlayerId
      ? cloudData.players.find((item) => item.id === editingPlayerId)
      : null;
    return `
      <details class="cloud-entry-details" ${player ? "open" : ""}>
        <summary>${player
          ? text("Исправить строку игрока", "Edit player row")
          : text("+ Добавить игрока", "+ Add player")}</summary>
        <form id="cloudPlayerForm" class="cloud-entry-form">
          <input type="hidden" name="id" value="${escapeHtml(player?.id || "")}" />
          <label><span>${text("Игрок", "Player")}</span>
            <input name="playerName" maxlength="80" value="${escapeHtml(player?.playerName || "")}" required />
          </label>
          <label><span>${text("Команда", "Crew")}</span>
            <input name="crewName" maxlength="120" value="${escapeHtml(player?.crewName || "")}" />
          </label>
          <label><span>${text("Фракция", "Faction")}</span>
            <input name="faction" maxlength="40" value="${escapeHtml(player?.faction || "")}" />
          </label>
          <label><span>CR</span>
            <input name="campaignRating" type="number" min="-999" max="9999" value="${Number(player?.campaignRating || 0)}" />
          </label>
          <label><span>${text("Игр", "Games")}</span>
            <input name="gamesPlayed" type="number" min="0" max="9999" value="${Number(player?.gamesPlayed || 0)}" />
          </label>
          <label><span>${text("Побед", "Wins")}</span>
            <input name="wins" type="number" min="0" max="9999" value="${Number(player?.wins || 0)}" />
          </label>
          <label class="cloud-form-wide"><span>${text("Заметка", "Note")}</span>
            <input name="notes" maxlength="500" value="${escapeHtml(player?.notes || "")}" />
          </label>
          <div class="cloud-form-actions cloud-form-wide">
            ${player ? `<button class="button button-ghost" type="button" data-cloud-action="cancel-player">${text("Отмена", "Cancel")}</button>` : ""}
            <button class="button button-red" type="submit">${text("Сохранить строку", "Save row")}</button>
          </div>
        </form>
      </details>`;
  }

  function playersHtml() {
    const rows = cloudData.players.length
      ? cloudData.players
          .map(
            (player) => `
              <tr>
                <td><b>${escapeHtml(player.playerName)}</b><small>${escapeHtml(player.notes)}</small></td>
                <td>${escapeHtml(player.crewName || "—")}</td>
                <td>${escapeHtml(player.faction || "—")}</td>
                <td class="cloud-number">${Number(player.campaignRating || 0)}</td>
                <td class="cloud-number">${Number(player.gamesPlayed || 0)}</td>
                <td class="cloud-number">${Number(player.wins || 0)}</td>
                ${connection.organizerToken ? `
                  <td class="cloud-row-actions">
                    <button type="button" data-cloud-action="edit-player" data-id="${escapeHtml(player.id)}" aria-label="${text("Изменить игрока", "Edit player")}">✎</button>
                    <button type="button" data-cloud-action="delete-player" data-id="${escapeHtml(player.id)}" aria-label="${text("Удалить игрока", "Delete player")}">×</button>
                  </td>` : ""}
              </tr>`,
          )
          .join("")
      : `<tr><td colspan="${connection.organizerToken ? 7 : 6}" class="cloud-table-empty">${text(
          "Таблица пока чистая.",
          "The table is empty.",
        )}</td></tr>`;
    return `
      <section class="cloud-ledger cloud-players">
        <div class="cloud-section-title">
          <div><span class="kicker">${text("Сводка", "Roster")}</span>
            <h3>${text("Таблица игроков", "Player table")}</h3>
          </div>
          <span class="counter-stamp">${cloudData.players.length}</span>
        </div>
        <div class="cloud-table-wrap">
          <table>
            <thead><tr>
              <th>${text("Игрок", "Player")}</th>
              <th>${text("Команда", "Crew")}</th>
              <th>${text("Фракция", "Faction")}</th>
              <th>CR</th>
              <th>${text("Игр", "Games")}</th>
              <th>${text("Побед", "Wins")}</th>
              ${connection.organizerToken ? "<th></th>" : ""}
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${playerFormHtml()}
      </section>`;
  }

  function eventFormHtml() {
    if (!connection?.organizerToken) return "";
    const item = editingEventId
      ? cloudData.events.find((event) => event.id === editingEventId)
      : null;
    return `
      <details class="cloud-entry-details" ${item ? "open" : ""}>
        <summary>${item
          ? text("Исправить запись", "Edit entry")
          : text("+ Новая запись", "+ New entry")}</summary>
        <form id="cloudEventForm" class="cloud-entry-form cloud-event-form">
          <input type="hidden" name="id" value="${escapeHtml(item?.id || "")}" />
          <label><span>${text("Неделя", "Week")}</span>
            <input name="week" type="number" min="1" max="99" value="${Number(item?.week || window.MalifauxBuilder?.getState?.().campaign?.week || 1)}" required />
          </label>
          <label><span>${text("Тип", "Type")}</span>
            <select name="type">
              <option value="game" ${item?.type === "game" ? "selected" : ""}>${text("Игра", "Game")}</option>
              <option value="note" ${!item || item.type === "note" ? "selected" : ""}>${text("Заметка", "Note")}</option>
              <option value="milestone" ${item?.type === "milestone" ? "selected" : ""}>${text("Веха", "Milestone")}</option>
            </select>
          </label>
          <label class="cloud-form-wide"><span>${text("Заголовок", "Title")}</span>
            <input name="title" maxlength="140" value="${escapeHtml(item?.title || "")}" required />
          </label>
          <label class="cloud-form-wide"><span>${text("Подробности", "Details")}</span>
            <textarea name="details" maxlength="2000" rows="3">${escapeHtml(item?.details || "")}</textarea>
          </label>
          <div class="cloud-form-actions cloud-form-wide">
            ${item ? `<button class="button button-ghost" type="button" data-cloud-action="cancel-event">${text("Отмена", "Cancel")}</button>` : ""}
            <button class="button button-red" type="submit">${text("Внести в хронику", "Add to chronicle")}</button>
          </div>
        </form>
      </details>`;
  }

  function eventsHtml() {
    const entries = cloudData.events.length
      ? cloudData.events
          .map(
            (item) => `
              <article class="cloud-event is-${escapeHtml(item.type)}">
                <span class="cloud-event-week">${text("Нед.", "Wk")} ${Number(item.week)}</span>
                <div><b>${escapeHtml(item.title)}</b>
                  ${item.details ? `<p>${escapeHtml(item.details)}</p>` : ""}
                  <small>${formatDate(item.updatedAt)}</small>
                </div>
                ${connection.organizerToken ? `
                  <div class="cloud-row-actions">
                    <button type="button" data-cloud-action="edit-event" data-id="${escapeHtml(item.id)}" aria-label="${text("Изменить запись", "Edit entry")}">✎</button>
                    <button type="button" data-cloud-action="delete-event" data-id="${escapeHtml(item.id)}" aria-label="${text("Удалить запись", "Delete entry")}">×</button>
                  </div>` : ""}
              </article>`,
          )
          .join("")
      : `<div class="cloud-empty">${text(
          "Общая история ещё не началась.",
          "The shared story has not begun.",
        )}</div>`;
    return `
      <section class="cloud-ledger cloud-chronicle">
        <div class="cloud-section-title">
          <div><span class="kicker">${text("Журнал группы", "Group journal")}</span>
            <h3>${text("Общая хроника", "Shared chronicle")}</h3>
          </div>
          <span class="counter-stamp">${cloudData.events.length}</span>
        </div>
        <div class="cloud-event-list">${entries}</div>
        ${eventFormHtml()}
      </section>`;
  }

  function workspaceHtml() {
    const campaign = cloudData.campaign;
    const organizer = Boolean(connection.organizerToken);
    const dossier = campaign.dossier || {};
    const remoteCrew = dossier.crew?.name || text("Без названия команды", "Unnamed crew");
    return `
      <section class="cloud-workspace">
        <header class="cloud-file-head">
          <div>
            <span class="cloud-file-code">CLOUD FILE / ${escapeHtml(campaign.id.slice(0, 6).toUpperCase())}</span>
            <h3>${escapeHtml(campaign.name)}</h3>
            <p>${text("Обновлено", "Updated")} ${formatDate(campaign.updatedAt)} · rev. ${Number(campaign.revision)}</p>
          </div>
          <span class="cloud-access-stamp ${organizer ? "is-organizer" : "is-reader"}">
            ${organizer ? text("Организатор", "Organizer") : text("Только чтение", "Read only")}
          </span>
        </header>

        ${cloudError ? `<div class="cloud-error">${escapeHtml(cloudError)}</div>` : ""}

        <div class="cloud-toolbar">
          <button class="button button-ghost" type="button" data-cloud-action="copy-share">${text("Скопировать ссылку", "Copy share link")}</button>
          <button class="button button-ghost" type="button" data-cloud-action="refresh">${text("Обновить", "Refresh")}</button>
          ${organizer ? `<button class="button button-red" type="button" data-cloud-action="sync">${text("Сохранить досье в облако", "Save dossier to cloud")}</button>` : ""}
          <button class="button button-ghost" type="button" data-cloud-action="load-dossier">${text("Загрузить облачную копию", "Load cloud copy")}</button>
          <button class="cloud-detach" type="button" data-cloud-action="detach">${text("Отсоединить", "Disconnect")}</button>
        </div>

        <div class="cloud-sync-strip">
          <span><b>${text("Облачное досье", "Cloud dossier")}</b>${escapeHtml(remoteCrew)}</span>
          <span><b>${text("Публичная ссылка", "Public link")}</b>${escapeHtml(publicShareUrl())}</span>
        </div>

        ${organizer ? `
          <details class="cloud-organizer-key">
            <summary>${text("Ключ организатора и перенос на другое устройство", "Organizer key and moving to another device")}</summary>
            <div>
              <code>${escapeHtml(connection.organizerToken)}</code>
              <button type="button" data-cloud-action="copy-key">${text("Копировать ключ", "Copy key")}</button>
            </div>
            <p>${text(
              "Cloudflare хранит только хэш. Если потерять этот ключ, восстановить права организатора без аккаунта нельзя.",
              "Cloudflare stores only a hash. Without accounts, a lost organizer key cannot be recovered.",
            )}</p>
            <button class="cloud-delete-campaign" type="button" data-cloud-action="delete-campaign">
              ${text("Удалить облачную кампанию", "Delete cloud campaign")}
            </button>
          </details>` : `
          <p class="cloud-reader-note">${text(
            "Вы открыли публичную ссылку. Можно читать хронику и скачать копию досье, но нельзя менять общие записи.",
            "You opened a public link. You can read the chronicle and load a dossier copy, but cannot change shared records.",
          )}</p>`}

        <div class="cloud-ledger-grid">
          ${playersHtml()}
          ${eventsHtml()}
        </div>
      </section>`;
  }

  function renderCloud() {
    if (!cloudContent) return;
    cloudDialog.classList.toggle("is-busy", cloudBusy);
    if (cloudBusy && !cloudData) {
      cloudContent.innerHTML = `
        <div class="cloud-loading"><i></i><i></i><i></i>
          <span>${text("Открываю архив…", "Opening the archive…")}</span>
        </div>`;
      return;
    }
    cloudContent.innerHTML = connection && cloudData ? workspaceHtml() : onboardingHtml();
  }

  async function loadCampaign(options = {}) {
    if (!connection?.campaignId) return;
    cloudBusy = true;
    cloudError = "";
    renderCloud();
    try {
      cloudData = await api(
        `/api/campaigns/${encodeURIComponent(connection.campaignId)}`,
      );
    } catch (error) {
      cloudData = null;
      cloudError = errorText(error.code);
      if (!options.silent) notify(cloudError);
    } finally {
      cloudBusy = false;
      renderCloud();
    }
  }

  async function createCampaign(form) {
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    setBusy(true);
    try {
      const payload = await api("/api/campaigns", {
        method: "POST",
        protected: true,
        body: {
          name,
          dossier: window.MalifauxBuilder.getState(),
        },
      });
      saveConnection({
        campaignId: payload.campaign.id,
        organizerToken: payload.organizerToken,
      });
      cloudData = payload;
      cloudError = "";
      updateLocation(connection.campaignId);
      notify(
        "Облачная папка создана. Сохраните ключ организатора.",
        "Cloud file created. Save the organizer key.",
      );
    } catch (error) {
      cloudError = errorText(error.code);
      notify(cloudError);
    } finally {
      cloudBusy = false;
      renderCloud();
    }
  }

  async function connectCampaign(form) {
    const data = new FormData(form);
    const campaignId = parseCampaignId(data.get("reference"));
    if (!campaignId) {
      notify("Не удалось распознать ссылку или ID.", "Could not recognize the link or ID.");
      return;
    }
    const suppliedToken = String(data.get("organizerToken") || "").trim();
    const storedToken = organizerKeys[campaignId] || "";
    const organizerToken = suppliedToken || storedToken;
    setBusy(true);
    try {
      cloudError = "";
      const payload = await api(`/api/campaigns/${encodeURIComponent(campaignId)}`);
      let verifiedToken = "";
      if (organizerToken) {
        try {
          await api(`/api/campaigns/${encodeURIComponent(campaignId)}/organizer`, {
            method: "POST",
            protected: true,
            headers: { "X-Organizer-Token": organizerToken },
            body: {},
          });
          verifiedToken = organizerToken;
        } catch (error) {
          if (
            error.code === "organizer_required" &&
            suppliedToken &&
            storedToken &&
            suppliedToken !== storedToken
          ) {
            try {
              await api(`/api/campaigns/${encodeURIComponent(campaignId)}/organizer`, {
                method: "POST",
                protected: true,
                headers: { "X-Organizer-Token": storedToken },
                body: {},
              });
              verifiedToken = storedToken;
            } catch (storedError) {
              if (storedError.code !== "organizer_required") throw storedError;
              forgetOrganizerKey(campaignId);
              cloudError = errorText(storedError.code);
            }
          } else if (error.code === "organizer_required") {
            if (organizerToken === storedToken) forgetOrganizerKey(campaignId);
            cloudError = errorText(error.code);
          } else {
            throw error;
          }
        }
      }
      saveConnection({ campaignId, organizerToken: verifiedToken });
      cloudData = payload;
      if (cloudError) notify(cloudError);
      updateLocation(campaignId);
    } catch (error) {
      cloudError = errorText(error.code);
      notify(cloudError);
    } finally {
      cloudBusy = false;
      renderCloud();
    }
  }

  async function syncDossier() {
    if (!cloudData || !connection?.organizerToken) return;
    setBusy(true);
    try {
      cloudData = await api(
        `/api/campaigns/${encodeURIComponent(connection.campaignId)}`,
        {
          method: "PUT",
          protected: true,
          organizer: true,
          body: {
            revision: cloudData.campaign.revision,
            name: cloudData.campaign.name,
            dossier: window.MalifauxBuilder.getState(),
          },
        },
      );
      cloudError = "";
      notify("Досье сохранено в облаке.", "Dossier saved to the cloud.");
    } catch (error) {
      const message = errorText(error.code);
      if (error.code === "revision_conflict") await loadCampaign({ silent: true });
      cloudError = message;
      notify(message);
    } finally {
      cloudBusy = false;
      renderCloud();
    }
  }

  function loadRemoteDossier() {
    if (!cloudData?.campaign?.dossier) return;
    const accepted = window.confirm(
      text(
        "Заменить текущее локальное досье облачной копией? Перед этим можно сделать экспорт.",
        "Replace the current local dossier with the cloud copy? You can export a backup first.",
      ),
    );
    if (!accepted) return;
    window.MalifauxBuilder.replaceState(cloudData.campaign.dossier);
    notify("Облачная копия загружена в билдер.", "Cloud copy loaded into the builder.");
  }

  async function deleteCampaign() {
    if (!connection?.campaignId || !connection.organizerToken) return;
    const accepted = window.confirm(
      text(
        "Удалить облачное досье, таблицу игроков и общую хронику без возможности восстановления?",
        "Permanently delete the cloud dossier, player table, and shared chronicle?",
      ),
    );
    if (!accepted) return;
    const campaignId = connection.campaignId;
    setBusy(true);
    try {
      await api(`/api/campaigns/${encodeURIComponent(campaignId)}`, {
        method: "DELETE",
        protected: true,
        organizer: true,
      });
      forgetOrganizerKey(campaignId);
      saveConnection(null);
      cloudData = null;
      cloudError = "";
      updateLocation("");
      notify("Облачная кампания удалена.", "Cloud campaign deleted.");
    } catch (error) {
      cloudError = errorText(error.code);
      notify(cloudError);
    } finally {
      cloudBusy = false;
      renderCloud();
    }
  }

  async function savePlayer(form) {
    const data = new FormData(form);
    const id = String(data.get("id") || "");
    const body = {
      playerName: data.get("playerName"),
      crewName: data.get("crewName"),
      faction: data.get("faction"),
      campaignRating: Number(data.get("campaignRating") || 0),
      gamesPlayed: Number(data.get("gamesPlayed") || 0),
      wins: Number(data.get("wins") || 0),
      notes: data.get("notes"),
    };
    setBusy(true);
    try {
      const suffix = id ? `/players/${encodeURIComponent(id)}` : "/players";
      cloudData = await api(
        `/api/campaigns/${encodeURIComponent(connection.campaignId)}${suffix}`,
        {
          method: id ? "PATCH" : "POST",
          protected: true,
          organizer: true,
          body,
        },
      );
      editingPlayerId = null;
      notify("Таблица игроков обновлена.", "Player table updated.");
    } catch (error) {
      cloudError = errorText(error.code);
      notify(cloudError);
    } finally {
      cloudBusy = false;
      renderCloud();
    }
  }

  async function saveEvent(form) {
    const data = new FormData(form);
    const id = String(data.get("id") || "");
    const body = {
      week: Number(data.get("week") || 1),
      type: data.get("type"),
      title: data.get("title"),
      details: data.get("details"),
    };
    setBusy(true);
    try {
      const suffix = id ? `/events/${encodeURIComponent(id)}` : "/events";
      cloudData = await api(
        `/api/campaigns/${encodeURIComponent(connection.campaignId)}${suffix}`,
        {
          method: id ? "PATCH" : "POST",
          protected: true,
          organizer: true,
          body,
        },
      );
      editingEventId = null;
      notify("Общая хроника обновлена.", "Shared chronicle updated.");
    } catch (error) {
      cloudError = errorText(error.code);
      notify(cloudError);
    } finally {
      cloudBusy = false;
      renderCloud();
    }
  }

  async function deleteEntry(kind, id) {
    const accepted = window.confirm(
      kind === "players"
        ? text("Удалить игрока из общей таблицы?", "Remove this player from the shared table?")
        : text("Удалить запись из общей хроники?", "Remove this entry from the shared chronicle?"),
    );
    if (!accepted) return;
    setBusy(true);
    try {
      cloudData = await api(
        `/api/campaigns/${encodeURIComponent(connection.campaignId)}/${kind}/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          protected: true,
          organizer: true,
        },
      );
      notify("Запись удалена.", "Entry removed.");
    } catch (error) {
      cloudError = errorText(error.code);
      notify(cloudError);
    } finally {
      cloudBusy = false;
      renderCloud();
    }
  }

  cloudContent.addEventListener("submit", (event) => {
    event.preventDefault();
    if (cloudBusy) return;
    if (event.target.id === "cloudCreateForm") void createCampaign(event.target);
    if (event.target.id === "cloudConnectForm") void connectCampaign(event.target);
    if (event.target.id === "cloudPlayerForm") void savePlayer(event.target);
    if (event.target.id === "cloudEventForm") void saveEvent(event.target);
  });

  cloudContent.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cloud-action]");
    if (!button || cloudBusy) return;
    const action = button.dataset.cloudAction;
    const id = button.dataset.id;

    if (action === "copy-share") {
      void copyText(publicShareUrl()).then(() =>
        notify("Публичная ссылка скопирована.", "Public link copied."),
      );
    } else if (action === "copy-key") {
      void copyText(connection.organizerToken).then(() =>
        notify("Ключ организатора скопирован.", "Organizer key copied."),
      );
    } else if (action === "refresh") {
      void loadCampaign();
    } else if (action === "sync") {
      void syncDossier();
    } else if (action === "load-dossier") {
      loadRemoteDossier();
    } else if (action === "delete-campaign") {
      void deleteCampaign();
    } else if (action === "detach") {
      saveConnection(null);
      cloudData = null;
      cloudError = "";
      editingPlayerId = null;
      editingEventId = null;
      updateLocation("");
      renderCloud();
    } else if (action === "edit-player") {
      editingPlayerId = id;
      renderCloud();
      requestAnimationFrame(() => cloudContent.querySelector("#cloudPlayerForm input")?.focus());
    } else if (action === "cancel-player") {
      editingPlayerId = null;
      renderCloud();
    } else if (action === "delete-player") {
      void deleteEntry("players", id);
    } else if (action === "edit-event") {
      editingEventId = id;
      renderCloud();
      requestAnimationFrame(() => cloudContent.querySelector("#cloudEventForm input")?.focus());
    } else if (action === "cancel-event") {
      editingEventId = null;
      renderCloud();
    } else if (action === "delete-event") {
      void deleteEntry("events", id);
    }
  });

  document.querySelector("#openCloudButton").addEventListener("click", () => {
    renderCloud();
    if (!cloudDialog.open) cloudDialog.showModal();
    if (connection && !cloudData && !cloudBusy) void loadCampaign();
  });

  securityClose.addEventListener("click", () => {
    finishChallenge(new DOMException("Challenge cancelled", "AbortError"));
  });
  securityDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    finishChallenge(new DOMException("Challenge cancelled", "AbortError"));
  });

  window.addEventListener("malifaux-locale-change", renderCloud);
  window.addEventListener("malifaux-state-replaced", renderCloud);

  window.CloudCampaignApi = Object.freeze({
    ensureSession,
    clearSession,
  });

  const sharedCampaignId = new URL(location.href).searchParams.get("campaign");
  if (sharedCampaignId && /^[A-Za-z0-9_-]{12,64}$/u.test(sharedCampaignId)) {
    if (connection?.campaignId !== sharedCampaignId) {
      saveConnection({ campaignId: sharedCampaignId, organizerToken: "" });
    }
    renderCloud();
    cloudDialog.showModal();
    void loadCampaign();
  } else {
    renderCloud();
  }
})();
