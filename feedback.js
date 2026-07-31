((global) => {
  "use strict";

  const MAX_MESSAGE = 2_000;
  const MAX_CONTACT = 180;
  const CATEGORIES = new Set(["bug", "idea", "data", "other"]);

  function normalizedDraft(value) {
    return {
      category: String(value?.category || ""),
      message: String(value?.message || "").trim(),
      contact: String(value?.contact || "").trim(),
      appVersion: String(value?.appVersion || "").trim(),
      locale: value?.locale === "en" ? "en" : "ru",
      section: String(value?.section || "").trim(),
    };
  }

  function validateDraft(value) {
    const draft = normalizedDraft(value);
    if (!CATEGORIES.has(draft.category)) return "invalid_category";
    if (draft.message.length < 10) return "message_too_short";
    if (draft.message.length > MAX_MESSAGE) return "message_too_long";
    if (draft.contact.length > MAX_CONTACT) return "contact_too_long";
    if (!draft.appVersion || draft.appVersion.length > 64) return "invalid_context";
    if (!draft.section || draft.section.length > 64) return "invalid_context";
    return "";
  }

  function newRequestId(cryptoApi = global.crypto) {
    if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10).join(""),
    ].join("-");
  }

  global.MalifauxFeedbackInternals = Object.freeze({
    normalizedDraft,
    validateDraft,
    newRequestId,
  });

  if (!global.document) return;

  const copy = {
    ru: {
      kicker: "Записка разработчику",
      title: "Обратная связь",
      intro:
        "Опишите проблему или идею. Текущий раздел и версия приложения приложатся автоматически.",
      category: "Категория",
      categories: {
        bug: "Ошибка",
        idea: "Идея",
        data: "Данные и правила",
        other: "Другое",
      },
      message: "Сообщение",
      messagePlaceholder: "Что произошло или что стоит улучшить?",
      messageHint: "От 10 до 2000 символов",
      contact: "Контакт для ответа",
      optional: "(необязательно)",
      contactPlaceholder: "Email, Telegram или другой контакт",
      contactHint: "Оставьте, только если хотите получить ответ",
      context: "Контекст",
      cancel: "Отмена",
      submit: "Отправить",
      submitting: "Отправляю…",
      success: "Спасибо! Записка принята.",
      invalid_category: "Выберите категорию.",
      message_too_short: "Добавьте немного деталей — нужно хотя бы 10 символов.",
      message_too_long: "Сообщение не должно превышать 2000 символов.",
      contact_too_long: "Контакт не должен превышать 180 символов.",
      invalid_context: "Не удалось определить контекст приложения.",
      api_unavailable: "Отправка недоступна в локальном файле.",
      rate_limited: "Слишком много отправок. Попробуйте немного позже.",
      session_required: "Защитная сессия истекла. Повторите отправку.",
      request_id_conflict: "Черновик изменился во время отправки. Повторите попытку.",
      generic_error: "Не удалось отправить записку. Она останется в форме для повтора.",
      open: "Открыть форму обратной связи",
      close: "Закрыть",
    },
    en: {
      kicker: "A note to the developer",
      title: "Feedback",
      intro:
        "Describe a problem or an idea. The current section and app version are attached automatically.",
      category: "Category",
      categories: {
        bug: "Bug",
        idea: "Idea",
        data: "Data and rules",
        other: "Other",
      },
      message: "Message",
      messagePlaceholder: "What happened, or what should be improved?",
      messageHint: "10 to 2000 characters",
      contact: "Reply contact",
      optional: "(optional)",
      contactPlaceholder: "Email, Telegram, or another contact",
      contactHint: "Leave this only if you would like a reply",
      context: "Context",
      cancel: "Cancel",
      submit: "Send",
      submitting: "Sending…",
      success: "Thank you! Your note was received.",
      invalid_category: "Choose a category.",
      message_too_short: "Please add a little detail — at least 10 characters.",
      message_too_long: "The message must not exceed 2000 characters.",
      contact_too_long: "The contact must not exceed 180 characters.",
      invalid_context: "The app context could not be determined.",
      api_unavailable: "Sending is unavailable from a local file.",
      rate_limited: "Too many submissions. Please try again later.",
      session_required: "The security session expired. Submit again.",
      request_id_conflict: "The draft changed while sending. Please retry.",
      generic_error: "The note could not be sent. It remains in the form for retrying.",
      open: "Open feedback form",
      close: "Close",
    },
  };

  const apiRoot =
    document.querySelector('meta[name="app-api-url"]')?.content.trim().replace(/\/+$/u, "") ||
    "";
  const appVersion =
    document.querySelector('meta[name="app-version"]')?.content.trim() || "unknown";
  const dialog = document.querySelector("#feedbackDialog");
  const form = document.querySelector("#feedbackForm");
  const openButton = document.querySelector("#openFeedbackButton");
  const closeButton = document.querySelector("#feedbackCloseButton");
  const cancelButton = document.querySelector("#feedbackCancelButton");
  const submitButton = document.querySelector("#feedbackSubmitButton");
  const category = document.querySelector("#feedbackCategory");
  const message = document.querySelector("#feedbackMessage");
  const contact = document.querySelector("#feedbackContact");
  const status = document.querySelector("#feedbackStatus");
  const count = document.querySelector("#feedbackMessageCount");
  const contextValue = document.querySelector("#feedbackContextValue");

  if (
    !dialog ||
    !form ||
    !openButton ||
    !closeButton ||
    !cancelButton ||
    !submitButton ||
    !category ||
    !message ||
    !contact ||
    !status ||
    !count ||
    !contextValue
  ) {
    return;
  }

  let pendingRequest = null;
  let busy = false;

  function locale() {
    return global.MalifauxBuilder?.getLocale?.() === "en" ? "en" : "ru";
  }

  function section() {
    return (
      document.querySelector(".route.is-active")?.id.replace(/^route-/u, "") ||
      "dossier"
    );
  }

  function currentCopy() {
    return copy[locale()];
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function localize() {
    const text = currentCopy();
    setText("#feedbackKicker", text.kicker);
    setText("#feedbackDialogTitle", text.title);
    setText("#feedbackIntro", text.intro);
    setText("#feedbackCategoryLabel", text.category);
    setText("#feedbackMessageLabel", text.message);
    setText("#feedbackMessageHint", text.messageHint);
    setText("#feedbackContactLabel", `${text.contact} ${text.optional}`);
    setText("#feedbackContactHint", text.contactHint);
    setText("#feedbackContextLabel", text.context);
    cancelButton.textContent = text.cancel;
    submitButton.textContent = busy ? text.submitting : text.submit;
    openButton.textContent = text.title;
    openButton.setAttribute("aria-label", text.open);
    closeButton.setAttribute("aria-label", text.close);
    message.placeholder = text.messagePlaceholder;
    contact.placeholder = text.contactPlaceholder;
    for (const option of category.options) {
      option.textContent = text.categories[option.value] || option.value;
    }
    renderContext();
  }

  function renderContext() {
    contextValue.textContent = `${section()} · ${locale().toUpperCase()} · v${appVersion}`;
  }

  function renderCount() {
    count.textContent = `${message.value.length} / ${MAX_MESSAGE}`;
  }

  function setStatus(value, tone = "") {
    status.textContent = value;
    if (tone) status.dataset.tone = tone;
    else delete status.dataset.tone;
  }

  function draft() {
    return normalizedDraft({
      category: category.value,
      message: message.value,
      contact: contact.value,
      appVersion,
      locale: locale(),
      section: section(),
    });
  }

  function pendingFor(value) {
    const signature = JSON.stringify(value);
    if (!pendingRequest || pendingRequest.signature !== signature) {
      pendingRequest = { signature, requestId: newRequestId() };
    }
    return pendingRequest;
  }

  function setBusy(value) {
    busy = value;
    category.disabled = value;
    message.disabled = value;
    contact.disabled = value;
    submitButton.disabled = value;
    cancelButton.disabled = value;
    closeButton.disabled = value;
    submitButton.textContent = currentCopy()[value ? "submitting" : "submit"];
  }

  async function postFeedback(payload, retry = true) {
    if (!apiRoot || location.protocol === "file:") {
      const error = new Error("api_unavailable");
      error.code = "api_unavailable";
      throw error;
    }
    const token = await global.CloudCampaignApi?.ensureSession?.();
    if (!token) {
      const error = new Error("session_required");
      error.code = "session_required";
      throw error;
    }
    const response = await fetch(`${apiRoot}/api/feedback`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401 && retry) {
      global.CloudCampaignApi?.clearSession?.();
      return postFeedback(payload, false);
    }
    if (!response.ok) {
      const error = new Error(result.error || "generic_error");
      error.code = result.error || "generic_error";
      throw error;
    }
    return result;
  }

  function invalidField(code) {
    if (code === "invalid_category") return category;
    if (code === "message_too_short" || code === "message_too_long") return message;
    if (code === "contact_too_long") return contact;
    return null;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const value = draft();
    const errorCode = validateDraft(value);
    category.removeAttribute("aria-invalid");
    message.removeAttribute("aria-invalid");
    contact.removeAttribute("aria-invalid");
    if (errorCode) {
      const field = invalidField(errorCode);
      field?.setAttribute("aria-invalid", "true");
      field?.focus();
      setStatus(currentCopy()[errorCode] || currentCopy().generic_error, "error");
      return;
    }

    const request = pendingFor(value);
    setBusy(true);
    setStatus(currentCopy().submitting);
    try {
      await postFeedback({ ...value, requestId: request.requestId });
      pendingRequest = null;
      form.reset();
      renderCount();
      setStatus(currentCopy().success, "success");
    } catch (error) {
      const code = String(error?.code || error?.message || "generic_error");
      setStatus(currentCopy()[code] || currentCopy().generic_error, "error");
    } finally {
      setBusy(false);
    }
  });

  for (const field of [category, message, contact]) {
    field.addEventListener("input", () => {
      field.removeAttribute("aria-invalid");
      setStatus("");
      if (field === message) renderCount();
    });
  }

  openButton.addEventListener("click", () => {
    localize();
    setStatus("");
    renderCount();
    if (!dialog.open) dialog.showModal();
    global.setTimeout(() => category.focus(), 0);
  });

  function close() {
    if (!busy && dialog.open) dialog.close();
  }

  closeButton.addEventListener("click", close);
  cancelButton.addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    if (busy) event.preventDefault();
  });
  global.addEventListener("malifaux-locale-change", localize);
  global.addEventListener("hashchange", renderContext);

  localize();
  renderCount();
})(globalThis);
