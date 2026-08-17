(() => {
  "use strict";

  const SESSION_KEY = "m4e-account-session-v1";
  const SYNC_KEY = "m4e-account-sync-v1";
  const CONFLICT_BACKUP_KEY = "m4e-account-conflict-backup-v1";
  const LEGACY_CONNECTION_KEY = "m4e-cloud-campaign-v1";
  const LEGACY_ORGANIZER_KEYS_KEY = "m4e-cloud-organizer-keys-v1";
  const SYNC_RETRY_DELAYS = Object.freeze([2_000, 5_000, 15_000]);
  const API_ROOT =
    document.querySelector('meta[name="app-api-url"]')?.content.trim().replace(/\/+$/u, "") ||
    "";
  const dialog = document.querySelector("#accountDialog");
  const content = document.querySelector("#accountDialogContent");
  const openButton = document.querySelector("#openAccountButton");
  const closeButton = document.querySelector("#accountDialogClose");
  const chipLabel = document.querySelector("#accountChipLabel");

  let resetToken = resetTokenFromLocation();
  let session = loadSession();
  if (resetToken) saveSession(null);
  let user = null;
  let loading = Boolean(session) && !resetToken;
  let busy = false;
  let mode = resetToken ? "reset" : "login";
  let error = "";
  let notice = "";
  let syncStatus = "guest";
  let conflict = null;
  let syncTimer = null;
  let syncRetryTimer = null;
  let syncRetryAttempt = 0;
  let syncPromise = null;
  let syncQueued = false;
  let linkedCampaignId = null;
  let ignoredClaimId = null;

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

  function resetTokenFromLocation() {
    try {
      const raw = decodeURIComponent(location.hash.slice(1));
      const match = raw.match(/^reset\/([A-Za-z0-9_-]{43})$/u);
      if (!match) return "";
      history.replaceState(
        { ...(history.state || {}), route: "dossier" },
        "",
        "#dossier",
      );
      return match[1];
    } catch {
      return "";
    }
  }

  function loadSession() {
    try {
      const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (
        value &&
        typeof value.token === "string" &&
        /^[A-Za-z0-9_-]{43}$/u.test(value.token) &&
        Date.parse(value.expiresAt) > Date.now()
      ) {
        return value;
      }
    } catch {
      // Invalid or unavailable session storage means guest mode.
    }
    return null;
  }

  function saveSession(value) {
    session = value;
    try {
      if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // The active tab can continue with the in-memory token.
    }
  }

  function clearAccount() {
    if (syncTimer !== null) window.clearTimeout(syncTimer);
    if (syncRetryTimer !== null) window.clearTimeout(syncRetryTimer);
    syncTimer = null;
    syncRetryTimer = null;
    syncRetryAttempt = 0;
    syncQueued = false;
    saveSession(null);
    user = null;
    conflict = null;
    linkedCampaignId = null;
    ignoredClaimId = null;
    syncStatus = "guest";
  }

  class ApiError extends Error {
    constructor(status, code, payload = {}) {
      super(code);
      this.status = status;
      this.code = code;
      this.payload = payload;
    }
  }

  async function api(path, options = {}) {
    if (!API_ROOT || location.protocol === "file:") {
      throw new ApiError(0, "api_unavailable");
    }
    const headers = {
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    };
    if (options.auth !== false && session?.token) {
      headers["X-Account-Session"] = session.token;
    }
    const response = await fetch(`${API_ROOT}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && options.auth !== false) clearAccount();
      throw new ApiError(response.status, payload.error || "request_failed", payload);
    }
    return payload;
  }

  function errorText(code) {
    const messages = {
      invalid_credentials: text(
        "Не удалось войти. Проверьте данные и повторите попытку.",
        "Sign-in failed. Check the details and try again.",
      ),
      registration_unavailable: text(
        "Не удалось создать аккаунт с этими данными.",
        "An account could not be created with these details.",
      ),
      rate_limited: text(
        "Слишком много попыток. Подождите 15 минут и попробуйте снова.",
        "Too many attempts. Wait 15 minutes and try again.",
      ),
      api_unavailable: text(
        "Аккаунты доступны в опубликованной версии приложения.",
        "Accounts are available in the published application.",
      ),
      revision_conflict: text(
        "Облачное досье изменилось на другом устройстве. Выберите нужную копию.",
        "The cloud dossier changed on another device. Choose which copy to keep.",
      ),
      claim_denied: text(
        "Не удалось подтвердить ключ организатора этой кампании.",
        "The organizer key for this campaign could not be verified.",
      ),
      account_campaign_exists: text(
        "К аккаунту уже привязано другое досье. Сначала разрешите текущий конфликт синхронизации.",
        "Another dossier is already linked to this account. Resolve its synchronization first.",
      ),
      password_reset_unavailable: text(
        "Отправка писем восстановления пока не настроена.",
        "Password reset email is not configured yet.",
      ),
      reset_invalid_or_expired: text(
        "Ссылка недействительна или уже истекла. Запросите новую.",
        "This link is invalid or expired. Request a new one.",
      ),
      password_mismatch: text(
        "Пароли не совпадают.",
        "The passwords do not match.",
      ),
    };
    return messages[code] || text(
      "Не удалось связаться с личным архивом.",
      "Could not reach the personal archive.",
    );
  }

  async function hashState(value) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(value)),
    );
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  function meaningful(state) {
    return Boolean(
      state?.crew?.name ||
      state?.crew?.player ||
      state?.crew?.faction ||
      state?.leader?.name ||
      state?.leader?.archetype ||
      state?.leader?.talents?.some(Boolean) ||
      state?.leader?.advances?.length ||
      state?.arsenal?.models?.length ||
      state?.arsenal?.equipment?.length ||
      state?.games?.length ||
      Number(state?.campaign?.week || 1) > 1
    );
  }

  function campaignName(state) {
    return String(state?.crew?.name || "").trim() || text("Личное досье", "Personal dossier");
  }

  function loadSyncMarker() {
    try {
      const markers = JSON.parse(localStorage.getItem(SYNC_KEY) || "{}");
      const marker = markers?.[user?.id];
      return marker && typeof marker === "object" ? marker : null;
    } catch {
      return null;
    }
  }

  function saveSyncMarker(campaign, localHash, remoteHash = localHash) {
    try {
      const markers = JSON.parse(localStorage.getItem(SYNC_KEY) || "{}");
      const safeMarkers = markers && typeof markers === "object" ? markers : {};
      safeMarkers[user.id] = {
        campaignId: campaign.id,
        revision: campaign.revision,
        localHash,
        remoteHash,
        syncedAt: new Date().toISOString(),
      };
      localStorage.setItem(SYNC_KEY, JSON.stringify(safeMarkers));
    } catch {
      // Synchronization still works; the next reload will reconcile conservatively.
    }
  }

  function clearSyncMarker() {
    try {
      const markers = JSON.parse(localStorage.getItem(SYNC_KEY) || "{}");
      if (markers && typeof markers === "object" && user?.id) {
        delete markers[user.id];
        localStorage.setItem(SYNC_KEY, JSON.stringify(markers));
      }
    } catch {
      // Reconciliation will remain conservative without a marker.
    }
  }

  function claimCandidate() {
    if (linkedCampaignId) return null;
    const liveCandidate = window.CloudCampaignApi?.getClaimCandidate?.() || null;
    if (liveCandidate && liveCandidate.campaignId !== ignoredClaimId) return liveCandidate;
    try {
      const connection = JSON.parse(localStorage.getItem(LEGACY_CONNECTION_KEY) || "null");
      const organizerKeys = JSON.parse(
        localStorage.getItem(LEGACY_ORGANIZER_KEYS_KEY) || "{}",
      );
      const campaignId = String(connection?.campaignId || "");
      const organizerToken = String(organizerKeys?.[campaignId] || "");
      if (
        campaignId !== ignoredClaimId &&
        /^[A-Za-z0-9_-]{12,64}$/u.test(campaignId) &&
        /^[A-Za-z0-9_-]{32,128}$/u.test(organizerToken)
      ) {
        return { campaignId, organizerToken, name: "" };
      }
    } catch {
      // Invalid legacy connection data is ignored.
    }
    return null;
  }

  function backupConflict(reason) {
    if (!conflict || !user) return;
    try {
      localStorage.setItem(
        CONFLICT_BACKUP_KEY,
        JSON.stringify({
          userId: user.id,
          savedAt: new Date().toISOString(),
          reason,
          local: conflict.local,
          remote: conflict.remote?.dossier || {},
        }),
      );
    } catch {
      // The download action remains available if local storage is full.
    }
  }

  function downloadConflict() {
    if (!conflict) return;
    const blob = new Blob(
      [JSON.stringify({ local: conflict.local, remote: conflict.remote?.dossier || {} }, null, 2)],
      { type: "application/json" },
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `malifaux-sync-conflict-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
  }

  async function pushLocal(remote, local, localHash) {
    try {
      const payload = await api("/api/account/campaign", {
        method: "PUT",
        body: {
          revision: remote?.revision || 0,
          name: campaignName(local),
          dossier: local,
        },
      });
      const remoteHash = await hashState(payload.campaign.dossier);
      linkedCampaignId = payload.campaign.id;
      saveSyncMarker(payload.campaign, localHash, remoteHash);
      syncStatus = "synced";
      conflict = null;
      return payload.campaign;
    } catch (reason) {
      if (reason.code === "revision_conflict") {
        conflict = { local, remote: reason.payload.campaign };
        syncStatus = "conflict";
      }
      throw reason;
    }
  }

  async function useRemote(remote) {
    if (!remote) return;
    const local = window.MalifauxBuilder.getState();
    conflict = { local, remote };
    backupConflict("use_remote");
    window.MalifauxBuilder.replaceState(remote.dossier, { source: "account-cloud" });
    const normalized = window.MalifauxBuilder.getState();
    const normalizedHash = await hashState(normalized);
    saveSyncMarker(remote, normalizedHash, await hashState(remote.dossier));
    conflict = null;
    syncStatus = "synced";
  }

  async function reconcile() {
    if (!user || !session || conflict) return;
    if (syncPromise) {
      syncQueued = true;
      return syncPromise;
    }
    syncQueued = false;
    syncPromise = (async () => {
      syncStatus = "syncing";
      error = "";
      render();
      const local = window.MalifauxBuilder.getState();
      const localHash = await hashState(local);
      const payload = await api("/api/account/campaign");
      const remote = payload.campaign;
      linkedCampaignId = remote?.id || null;
      if (!remote) {
        if (claimCandidate()) {
          syncStatus = "claim";
          return;
        }
        await pushLocal(null, local, localHash);
        return;
      }
      const remoteHash = await hashState(remote.dossier);
      if (localHash === remoteHash) {
        saveSyncMarker(remote, localHash, remoteHash);
        syncStatus = "synced";
        return;
      }

      const marker = loadSyncMarker();
      if (!marker || marker.campaignId !== remote.id) {
        if (!meaningful(local)) {
          await useRemote(remote);
        } else if (!meaningful(remote.dossier)) {
          await pushLocal(remote, local, localHash);
        } else {
          conflict = { local, remote };
          syncStatus = "conflict";
        }
        return;
      }

      const localChanged = localHash !== marker.localHash;
      const remoteChanged = remote.revision !== marker.revision || remoteHash !== marker.remoteHash;
      if (localChanged && remoteChanged) {
        conflict = { local, remote };
        syncStatus = "conflict";
      } else if (remoteChanged) {
        await useRemote(remote);
      } else if (localChanged) {
        await pushLocal(remote, local, localHash);
      } else {
        saveSyncMarker(remote, localHash, remoteHash);
        syncStatus = "synced";
      }
    })()
      .then((result) => {
        resetSyncRetry();
        return result;
      })
      .catch((reason) => {
        error = errorText(reason.code);
        if (!conflict) syncStatus = "error";
        scheduleSyncRetry();
      })
      .finally(() => {
        syncPromise = null;
        render();
        if (syncQueued) scheduleSync();
      });
    return syncPromise;
  }

  function resetSyncRetry() {
    if (syncRetryTimer !== null) window.clearTimeout(syncRetryTimer);
    syncRetryTimer = null;
    syncRetryAttempt = 0;
  }

  function scheduleSyncRetry() {
    if (!user || conflict || navigator.onLine === false) return;
    if (syncRetryTimer !== null || syncRetryAttempt >= SYNC_RETRY_DELAYS.length) return;
    const delay = SYNC_RETRY_DELAYS[syncRetryAttempt];
    syncRetryAttempt += 1;
    syncRetryTimer = window.setTimeout(() => {
      syncRetryTimer = null;
      void reconcile();
    }, delay);
  }

  function scheduleSync(delay = 900) {
    if (!user || conflict) return;
    syncQueued = true;
    if (syncTimer !== null) window.clearTimeout(syncTimer);
    if (syncRetryTimer !== null) {
      window.clearTimeout(syncRetryTimer);
      syncRetryTimer = null;
    }
    syncTimer = window.setTimeout(() => {
      syncTimer = null;
      void reconcile();
    }, delay);
  }

  function scheduleLifecycleSync() {
    if (document.visibilityState === "hidden") return;
    scheduleSync(150);
  }

  function statusText() {
    const labels = {
      guest: text("Гостевой режим · только это устройство", "Guest mode · this device only"),
      syncing: text("Сверяю досье…", "Reconciling dossier…"),
      synced: text("Досье синхронизировано", "Dossier synchronized"),
      conflict: text("Нужно выбрать копию", "A copy must be chosen"),
      claim: text("Можно привязать открытую кампанию", "The open campaign can be linked"),
      error: text("Синхронизация приостановлена", "Synchronization paused"),
    };
    return labels[syncStatus] || labels.guest;
  }

  function conflictHtml() {
    if (!conflict) return "";
    const localName = campaignName(conflict.local);
    const remoteName = conflict.remote?.name || text("Облачное досье", "Cloud dossier");
    return `
      <section class="account-conflict" role="alert">
        <span class="account-stamp">SYNC CHECK</span>
        <h3>${text("Найдены две изменённые копии", "Two changed copies were found")}</h3>
        <p>${text(
          "Ничего не перезаписано. Выберите копию, с которой продолжить; обе версии будут сохранены в локальной страховочной копии.",
          "Nothing was overwritten. Choose the copy to continue with; both versions are kept in a local safety backup.",
        )}</p>
        <div class="account-copy-grid">
          <article><b>${text("На этом устройстве", "On this device")}</b><span>${escapeHtml(localName)}</span></article>
          <article><b>${text("В облаке", "In the cloud")}</b><span>${escapeHtml(remoteName)}</span></article>
        </div>
        <div class="account-conflict-actions">
          <button class="button button-red" type="button" data-account-action="keep-local">${text("Оставить локальную", "Keep local")}</button>
          <button class="button button-ink" type="button" data-account-action="use-remote">${text("Загрузить облачную", "Use cloud")}</button>
          <button class="button account-download" type="button" data-account-action="download-conflict">${text("Скачать обе", "Download both")}</button>
        </div>
      </section>`;
  }

  function accountHtml() {
    const candidate = claimCandidate();
    return `
      <section class="account-current">
        <div class="account-passport">
          <span class="account-stamp">CREW ACCOUNT</span>
          <div class="account-avatar" aria-hidden="true">${escapeHtml((user.displayName || user.email).slice(0, 1).toUpperCase())}</div>
          <div><span>${text("Владелец досье", "Dossier owner")}</span><h3>${escapeHtml(user.displayName)}</h3><p>${escapeHtml(user.email)}</p></div>
        </div>
        <div class="account-sync-state is-${escapeHtml(syncStatus)}"><i></i><span><b>${statusText()}</b><small>${text(
          "Изменения отправляются после сохранения и подхватываются при возвращении в приложение.",
          "Changes are sent after saving and picked up when you return to the application.",
        )}</small></span></div>
        ${error ? `<p class="account-error" role="alert">${escapeHtml(error)}</p>` : ""}
        ${conflictHtml()}
        ${candidate ? `<section class="account-claim">
          <span class="account-stamp">LEGACY FILE</span>
          <div><b>${text("Привязать открытую облачную кампанию", "Link the open cloud campaign")}</b><small>${escapeHtml(candidate.name || candidate.campaignId)}</small></div>
          <button class="button button-ink" type="button" data-account-action="claim" ${busy ? "disabled" : ""}>${text("Подтвердить ключ и привязать", "Verify key and link")}</button>
          <button class="account-claim-skip" type="button" data-account-action="skip-claim" ${busy ? "disabled" : ""}>${text("Создать отдельное личное досье", "Create a separate personal dossier")}</button>
        </section>` : ""}
        <div class="account-actions">
          <button class="button button-ghost" type="button" data-account-action="sync" ${busy ? "disabled" : ""}>${text("Синхронизировать сейчас", "Sync now")}</button>
          <button class="account-logout" type="button" data-account-action="logout" ${busy ? "disabled" : ""}>${text("Выйти", "Sign out")}</button>
        </div>
      </section>`;
  }

  function authHtml() {
    const registering = mode === "register";
    const requestingReset = mode === "forgot";
    const resetting = mode === "reset";
    const recovery = requestingReset || resetting;
    const introTitle = requestingReset
      ? text("Вернуть доступ к досье", "Recover dossier access")
      : resetting
        ? text("Новый пароль для архивного дела", "A new password for the archive")
        : text("Одно досье на всех ваших устройствах", "One dossier across your devices");
    const introCopy = requestingReset
      ? text(
        "Укажите email аккаунта. Если запись существует, архив отправит одноразовую ссылку, действующую 15 минут.",
        "Enter the account email. If it exists, the archive will send a one-time link valid for 15 minutes.",
      )
      : resetting
        ? text(
          "Придумайте новый пароль. После подтверждения все прежние сеансы будут завершены.",
          "Choose a new password. All previous sessions will be signed out after confirmation.",
        )
        : text(
          "Без аккаунта билдер по-прежнему работает локально. После входа текущее непустое досье будет безопасно сверено с облаком — спорные версии не перезаписываются без выбора.",
          "The builder still works locally without an account. After sign-in, a non-empty dossier is safely reconciled with the cloud—conflicting versions are never overwritten without a choice.",
        );
    const submitLabel = requestingReset
      ? text("Отправить ссылку", "Send recovery link")
      : resetting
        ? text("Сохранить новый пароль", "Save new password")
        : registering
          ? text("Создать аккаунт", "Create account")
          : text("Войти и сверить досье", "Sign in and reconcile");
    return `
      <section class="account-auth">
        <div class="account-auth-intro">
          <span class="account-stamp">${recovery ? "ACCESS RECOVERY" : "ADMIRALTY ID"}</span>
          <h3>${introTitle}</h3>
          <p>${introCopy}</p>
          <ul>${recovery
            ? `<li>${text("Одноразовая ссылка", "One-time link")}</li><li>${text("Срок действия — 15 минут", "Expires after 15 minutes")}</li>`
            : `<li>${text("Автосохранение между устройствами", "Automatic cross-device saves")}</li><li>${text("Гостевой режим остаётся доступен", "Guest mode remains available")}</li>`}</ul>
        </div>
        <form id="accountAuthForm" class="account-auth-form" data-account-form-mode="${mode}">
          ${recovery ? "" : `<div class="account-tabs" role="group" aria-label="${text("Режим аккаунта", "Account mode")}">
            <button type="button" aria-pressed="${String(!registering)}" class="${!registering ? "is-active" : ""}" data-account-mode="login">${text("Вход", "Sign in")}</button>
            <button type="button" aria-pressed="${String(registering)}" class="${registering ? "is-active" : ""}" data-account-mode="register">${text("Регистрация", "Register")}</button>
          </div>`}
          ${notice ? `<p class="account-notice" role="status">${escapeHtml(notice)}</p>` : ""}
          ${requestingReset
            ? `<label><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="254" required autofocus /></label>`
            : resetting
              ? `<label><span>${text("Новый пароль", "New password")}</span><input name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required autofocus /></label><label><span>${text("Повторите пароль", "Repeat password")}</span><input name="passwordConfirmation" type="password" autocomplete="new-password" minlength="8" maxlength="128" required /></label>`
              : `${registering ? `<label><span>${text("Имя", "Name")}</span><input name="displayName" autocomplete="name" minlength="1" maxlength="60" required /></label>` : ""}<label><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="254" required /></label><label><span>${text("Пароль", "Password")}</span><input name="password" type="password" autocomplete="${registering ? "new-password" : "current-password"}" minlength="8" maxlength="128" required /></label>`}
          ${mode === "login" ? `<button class="account-auth-link" type="button" data-account-mode="forgot">${text("Забыли пароль?", "Forgot password?")}</button>` : ""}
          ${error ? `<p class="account-error" role="alert">${escapeHtml(error)}</p>` : ""}
          <button class="button button-red" type="submit" ${busy ? "disabled" : ""}>${busy ? text("Проверяю…", "Checking…") : submitLabel}</button>
          ${recovery ? `<button class="account-auth-link is-back" type="button" data-account-mode="login">${text("← Вернуться ко входу", "← Back to sign in")}</button>` : ""}
        </form>
      </section>`;
  }

  function render() {
    if (!content) return;
    openButton.classList.toggle("is-authenticated", Boolean(user));
    chipLabel.textContent = user ? user.displayName : text("Аккаунт", "Account");
    if (loading) {
      content.innerHTML = `<div class="account-loading"><i></i><span>${text("Проверяю аккаунт…", "Checking the account…")}</span></div>`;
    } else {
      content.innerHTML = user ? accountHtml() : authHtml();
    }
  }

  async function authenticate(form) {
    const data = new FormData(form);
    busy = true;
    error = "";
    notice = "";
    render();
    try {
      const payload = await api(`/api/auth/${mode}`, {
        method: "POST",
        auth: false,
        body: {
          email: data.get("email"),
          password: data.get("password"),
          ...(mode === "register" ? { displayName: data.get("displayName") } : {}),
        },
      });
      saveSession({ token: payload.token, expiresAt: payload.expiresAt });
      user = payload.user;
      syncStatus = "syncing";
      await reconcile();
    } catch (reason) {
      error = errorText(reason.code);
    } finally {
      busy = false;
      render();
    }
  }

  async function requestPasswordReset(form) {
    const data = new FormData(form);
    busy = true;
    error = "";
    notice = "";
    render();
    try {
      await api("/api/auth/password-reset/request", {
        method: "POST",
        auth: false,
        body: { email: data.get("email") },
      });
      mode = "login";
      notice = text(
        "Если такой аккаунт существует, ссылка уже отправлена. Проверьте также папку «Спам».",
        "If that account exists, the link has been sent. Check the spam folder too.",
      );
    } catch (reason) {
      error = errorText(reason.code);
    } finally {
      busy = false;
      render();
    }
  }

  async function confirmPasswordReset(form) {
    const data = new FormData(form);
    if (data.get("password") !== data.get("passwordConfirmation")) {
      error = errorText("password_mismatch");
      render();
      return;
    }
    busy = true;
    error = "";
    notice = "";
    render();
    try {
      await api("/api/auth/password-reset/confirm", {
        method: "POST",
        auth: false,
        body: {
          token: resetToken,
          password: data.get("password"),
        },
      });
      clearAccount();
      resetToken = "";
      mode = "login";
      notice = text(
        "Пароль обновлён. Теперь войдите с новым паролем.",
        "Password updated. Sign in with the new password.",
      );
    } catch (reason) {
      error = errorText(reason.code);
    } finally {
      busy = false;
      render();
    }
  }

  async function logout() {
    busy = true;
    render();
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // Local sign-out still removes the bearer token immediately.
    } finally {
      clearAccount();
      busy = false;
      error = "";
      render();
    }
  }

  async function claimLegacy() {
    const candidate = claimCandidate();
    if (!candidate) return;
    busy = true;
    error = "";
    render();
    try {
      const payload = await api("/api/account/campaign/claim", {
        method: "POST",
        headers: { "X-Organizer-Token": candidate.organizerToken },
        body: { campaignId: candidate.campaignId },
      });
      linkedCampaignId = payload.campaign.id;
      clearSyncMarker();
      syncStatus = "syncing";
      await reconcile();
    } catch (reason) {
      error = errorText(reason.code);
    } finally {
      busy = false;
      render();
    }
  }

  function skipLegacyClaim() {
    const candidate = claimCandidate();
    if (!candidate) return;
    ignoredClaimId = candidate.campaignId;
    syncStatus = "syncing";
    render();
    void reconcile();
  }

  async function chooseLocal() {
    if (!conflict) return;
    busy = true;
    backupConflict("keep_local");
    const current = conflict;
    conflict = null;
    render();
    try {
      await pushLocal(current.remote, current.local, await hashState(current.local));
    } catch (reason) {
      error = errorText(reason.code);
    } finally {
      busy = false;
      render();
    }
  }

  async function chooseRemote() {
    if (!conflict) return;
    busy = true;
    const remote = conflict.remote;
    try {
      await useRemote(remote);
    } finally {
      busy = false;
      render();
    }
  }

  async function restore() {
    if (resetToken) {
      loading = false;
      render();
      return;
    }
    if (!session) {
      loading = false;
      render();
      return;
    }
    try {
      const payload = await api("/api/auth/me");
      user = payload.user;
      if (!user) clearAccount();
      else await reconcile();
    } catch {
      clearAccount();
    } finally {
      loading = false;
      render();
    }
  }

  content.addEventListener("submit", (event) => {
    if (event.target.id !== "accountAuthForm") return;
    event.preventDefault();
    if (busy) return;
    if (mode === "forgot") void requestPasswordReset(event.target);
    else if (mode === "reset") void confirmPasswordReset(event.target);
    else void authenticate(event.target);
  });

  content.addEventListener("click", (event) => {
    const modeButton = event.target.closest("[data-account-mode]");
    if (modeButton && !busy) {
      if (mode === "reset" && modeButton.dataset.accountMode !== "reset") {
        resetToken = "";
      }
      mode = modeButton.dataset.accountMode;
      error = "";
      notice = "";
      render();
      return;
    }
    const button = event.target.closest("[data-account-action]");
    if (!button || busy) return;
    const action = button.dataset.accountAction;
    if (action === "logout") void logout();
    if (action === "claim") void claimLegacy();
    if (action === "skip-claim") skipLegacyClaim();
    if (action === "sync") {
      error = "";
      void reconcile();
    }
    if (action === "keep-local") void chooseLocal();
    if (action === "use-remote") void chooseRemote();
    if (action === "download-conflict") downloadConflict();
  });

  openButton.addEventListener("click", () => {
    render();
    if (!dialog.open) dialog.showModal();
  });
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("cancel", () => dialog.close());
  window.addEventListener("malifaux-locale-change", render);
  window.addEventListener("malifaux-state-saved", (event) => {
    if (event.detail?.source !== "account-cloud") scheduleSync();
  });
  window.addEventListener("focus", scheduleLifecycleSync);
  window.addEventListener("pageshow", scheduleLifecycleSync);
  window.addEventListener("online", () => scheduleSync(0));
  window.addEventListener("hashchange", () => {
    const token = resetTokenFromLocation();
    if (!token) return;
    clearAccount();
    resetToken = token;
    loading = false;
    mode = "reset";
    error = "";
    notice = "";
    render();
    if (!dialog.open) dialog.showModal();
  });
  document.addEventListener("visibilitychange", scheduleLifecycleSync);

  window.MalifauxAccount = Object.freeze({
    getUser: () => (user ? { ...user } : null),
    sync: () => reconcile(),
  });

  render();
  if (resetToken && !dialog.open) dialog.showModal();
  void restore();
})();
