(() => {
  "use strict";

  const SEEN_VERSION_KEY = "m4e-release-notes-seen-v1";
  const RELEASES = Object.freeze([
    {
      version: "2026.09.23.1",
      date: "2026-09-23",
      title: {
        ru: "Эффекты Lucky Miss добавляются прямо к модели",
        en: "Lucky Miss effects can be added directly to a model",
      },
      summary: {
        ru: "Результат дополнительного флипа после Close Call теперь можно выбрать, сохранить и удалить в Арсенале.",
        en: "The extra flip after Close Call can now be selected, saved, and removed in the Arsenal.",
      },
      items: [
        {
          ru: "Отдельный каталог показывает все результаты Lucky Miss от 1 до Joker.",
          en: "A dedicated catalog lists every Lucky Miss result from 1 through Joker.",
        },
        {
          ru: "Эффекты доступны для моделей, лидера и тотема и сохраняются после перезагрузки.",
          en: "Effects are available for models, the leader, and the Totem and persist after reload.",
        },
        {
          ru: "Ошибочно добавленный эффект можно удалить из карточки.",
          en: "An incorrectly added effect can be removed from the card.",
        },
      ],
    },
    {
      version: "2026.09.20.1",
      date: "2026-09-20",
      title: {
        ru: "Sniveling Coward можно заменить в арсенале",
        en: "Sniveling Coward can be replaced in the arsenal",
      },
      summary: {
        ru: "Fight Another Day теперь оформляется прямо в досье с проверкой условия и допустимых профилей.",
        en: "Fight Another Day can now be resolved directly in the dossier with condition and profile validation.",
      },
      items: [
        {
          ru: "Кнопка замены появляется только у Sniveling Coward, полученного по Black Joker.",
          en: "The replacement action appears only for a Sniveling Coward gained from the Black Joker.",
        },
        {
          ru: "В списке доступны только тотемы без Black Joker и Red Joker.",
          en: "Only non-Black-Joker and non-Red-Joker Totems are available.",
        },
        {
          ru: "Продвижения, травмы и назначенное снаряжение сохраняются после замены и перезагрузки.",
          en: "Advancements, injuries, and assigned equipment persist after replacement and reload.",
        },
      ],
    },
    {
      version: "2026.09.18.1",
      date: "2026-09-18",
      title: {
        ru: "Хроника сохраняет все выполненные схемы",
        en: "The chronicle records every completed scheme",
      },
      summary: {
        ru: "Можно записать четыре и более выполненных схем, сохранив официальный лимит Aftermath hand.",
        en: "Four or more completed schemes can be recorded while preserving the official Aftermath hand cap.",
      },
      items: [
        {
          ru: "Поле выполненных схем больше не ограничено тремя записями.",
          en: "The completed-schemes field is no longer limited to three entries.",
        },
        {
          ru: "Фактическое количество сохраняется в хронике и переживает перезагрузку.",
          en: "The actual count is saved in the chronicle and survives reloads.",
        },
        {
          ru: "При расчёте Aftermath hand по-прежнему учитываются максимум три схемы.",
          en: "The Aftermath hand calculation still counts no more than three schemes.",
        },
      ],
    },
    {
      version: "2026.09.17.1",
      date: "2026-09-17",
      title: {
        ru: "Формы превращающихся моделей собраны вместе",
        en: "Transforming model forms stay together",
      },
      summary: {
        ru: "Арсенал распознаёт взаимные замены из текста карточек и сохраняет все связанные формы одной модели.",
        en: "The arsenal recognizes reciprocal replacement rules and saves every linked form of a model.",
      },
      items: [
        {
          ru: "Способности с формулировкой replace itself with автоматически связывают формы.",
          en: "Abilities using replace itself with now link model forms automatically.",
        },
        {
          ru: "Стоимость модели учитывается один раз, а в арсенале доступны карточки каждой формы.",
          en: "The model is paid for once while every form card remains available in the arsenal.",
        },
        {
          ru: "Все связанные профили также попадают в печатное досье.",
          en: "Every linked profile is also included in the printed dossier.",
        },
      ],
    },
    {
      version: "2026.09.16.1",
      date: "2026-09-16",
      title: {
        ru: "Печатный лист теперь ведёт к правилам",
        en: "Printed sheets now include a rules reference",
      },
      summary: {
        ru: "Первая страница стала компактнее, а все приобретённые правила лидера вынесены в отдельный справочник.",
        en: "The first page is now more compact, while all acquired leader rules are collected in a separate reference page.",
      },
      items: [
        {
          ru: "Полные тексты действий, способностей и триггеров находятся на странице 2.",
          en: "Full actions, abilities, and trigger text now appear on page 2.",
        },
        {
          ru: "На первой странице остаются только быстрые параметры и ссылки на справочник.",
          en: "The first page keeps only quick stats and references to the rules page.",
        },
        {
          ru: "В справочник также попадают карта команды и снаряжение лидера.",
          en: "The reference also includes the crew card and the leader’s equipment.",
        },
      ],
    },
    {
      version: "2026.09.15.2",
      date: "2026-09-15",
      title: {
        ru: "Печатное досье стало полнее благодаря вашей обратной связи",
        en: "Printed dossiers are now more complete thanks to your feedback",
      },
      summary: {
        ru: "Карточки ростера теперь переносят на печать больше важных деталей, а история изменений доступна прямо в приложении.",
        en: "Roster cards now carry more important details into print, and the update history is available inside the app.",
      },
      items: [
        {
          ru: "Лидерские способности и триггеры печатаются с мастями и маркерами.",
          en: "Leader abilities and triggers print with suits and markers.",
        },
        {
          ru: "Добавлены полные карточки моделей, комментарий к ростеру и подписи игроков.",
          en: "Full model cards, roster notes, and player signature lines were added.",
        },
        {
          ru: "Появились одноразовый баннер релиза и полный чейнджлог в аккаунте.",
          en: "A one-time release banner and full account changelog are now available.",
        },
      ],
    },
    {
      version: "2026.09.10.1",
      date: "2026-09-10",
      title: {
        ru: "Точные маркеры фирменных действий",
        en: "Accurate signature action markers",
      },
      summary: {
        ru: "Исправлены маркеры фирменных действий по официальному каталогу карт.",
        en: "Signature action markers were corrected against the official card catalog.",
      },
      items: [
        {
          ru: "Восстановлен фирменный маркер Herd ’Em.",
          en: "The Herd ’Em signature marker was restored.",
        },
        {
          ru: "Уточнены маркеры у затронутых лидеров и действий.",
          en: "Markers were corrected for affected leaders and actions.",
        },
      ],
    },
    {
      version: "2026.09.08.1",
      date: "2026-09-08",
      title: {
        ru: "Масти лидерских способностей",
        en: "Leader ability suits",
      },
      summary: {
        ru: "Досье сохраняет и печатает больше характеристик лидерских способностей.",
        en: "Dossiers preserve and print more leader ability details.",
      },
      items: [
        {
          ru: "Сохраняются масти, защита и данные о камнях душ.",
          en: "Suits, defense, and Soulstone details are preserved.",
        },
      ],
    },
    {
      version: "2026.09.03.1",
      date: "2026-09-03",
      title: {
        ru: "Надёжнее кампании и каталоги",
        en: "More reliable campaigns and catalogs",
      },
      summary: {
        ru: "Улучшена работа организаторских кампаний и загрузка каталогов ростера.",
        en: "Organizer campaigns and roster catalog loading are more reliable.",
      },
      items: [
        {
          ru: "Кампании организатора отделены от арсеналов игроков.",
          en: "Organizer campaigns are separated from player arsenals.",
        },
        {
          ru: "Приложение больше не повторяет без конца запрос недоступного каталога.",
          en: "The app no longer retries an unavailable catalog indefinitely.",
        },
      ],
    },
    {
      version: "2026.08.18.1",
      date: "2026-08-18",
      title: {
        ru: "Колода Судьбы под рукой",
        en: "Fate Deck at hand",
      },
      summary: {
        ru: "Колоду Судьбы теперь можно открыть без автоматического вытягивания карты.",
        en: "The Fate Deck can now be opened without automatically drawing a card.",
      },
      items: [
        {
          ru: "Добавлена отдельная панель колоды для осознанного первого флипа.",
          en: "A dedicated deck panel lets you choose when to make the first flip.",
        },
      ],
    },
  ]);

  const appVersion = document.querySelector('meta[name="app-version"]')?.content.trim() || "";
  const currentRelease = RELEASES.find((release) => release.version === appVersion);
  const banner = document.querySelector("#releaseBanner");
  const bannerContent = document.querySelector("#releaseBannerContent");
  const bannerChangelogButton = document.querySelector("#releaseBannerChangelog");
  const bannerDismissButton = document.querySelector("#releaseBannerDismiss");
  const accountDialog = document.querySelector("#accountDialog");
  const accountChangelogButton = document.querySelector("#accountChangelogButton");
  const dialog = document.querySelector("#changelogDialog");
  const dialogContent = document.querySelector("#changelogDialogContent");
  const dialogCloseButton = document.querySelector("#changelogDialogClose");
  const dialogKicker = document.querySelector("#changelogDialogKicker");
  const dialogTitle = document.querySelector("#changelogDialogTitle");
  let sessionSeenVersion = "";

  function locale() {
    return window.MalifauxBuilder?.getLocale?.() === "en" ? "en" : "ru";
  }

  function copy(value) {
    return value?.[locale()] || value?.ru || "";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function localizedDate(date) {
    const parsed = new Date(`${date}T12:00:00`);
    return new Intl.DateTimeFormat(locale() === "en" ? "en-GB" : "ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parsed);
  }

  function storedSeenVersion() {
    try {
      return localStorage.getItem(SEEN_VERSION_KEY) || sessionSeenVersion;
    } catch {
      return sessionSeenVersion;
    }
  }

  function markCurrentReleaseSeen() {
    if (!appVersion) return;
    sessionSeenVersion = appVersion;
    try {
      localStorage.setItem(SEEN_VERSION_KEY, appVersion);
    } catch {
      // Session memory still prevents repeated banners if storage is unavailable.
    }
    hideBanner();
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove("is-visible");
    if (banner.open) banner.close();
    banner.hidden = true;
  }

  function renderBanner() {
    if (!banner || !bannerContent || !currentRelease) return;
    const isEnglish = locale() === "en";
    bannerContent.innerHTML = `
      <div class="release-banner-meta">
        <span>${isEnglish ? "New release" : "Новая версия"}</span>
        <b>v${escapeHtml(currentRelease.version)}</b>
      </div>
      <h2 id="releaseBannerTitle">${escapeHtml(copy(currentRelease.title))}</h2>
      <p>${escapeHtml(copy(currentRelease.summary))}</p>
      <ul>
        ${currentRelease.items
          .slice(0, 3)
          .map((item) => `<li>${escapeHtml(copy(item))}</li>`)
          .join("")}
      </ul>
    `;
    bannerChangelogButton.textContent = isEnglish ? "Full changelog" : "Весь чейнджлог";
    bannerDismissButton.textContent = isEnglish ? "Got it" : "Понятно";
  }

  function showBannerIfNeeded() {
    const releaseNotesTestEnabled = window.__MALIFAUX_TEST_RELEASE_NOTES__ === true;
    if (
      !banner ||
      !currentRelease ||
      storedSeenVersion() === appVersion ||
      (navigator.webdriver && !releaseNotesTestEnabled)
    ) {
      hideBanner();
      return;
    }
    renderBanner();
    banner.hidden = false;
    if (!banner.open) banner.showModal();
    requestAnimationFrame(() => banner.classList.add("is-visible"));
  }

  function renderDialog() {
    if (!dialogContent) return;
    const isEnglish = locale() === "en";
    dialogKicker.textContent = isEnglish ? "Update archive" : "Архив обновлений";
    dialogTitle.textContent = isEnglish ? "Changelog" : "Чейнджлог";
    dialogCloseButton.setAttribute("aria-label", isEnglish ? "Close" : "Закрыть");
    accountChangelogButton.textContent = isEnglish ? "Changelog" : "Чейнджлог";
    dialogContent.innerHTML = RELEASES.map(
      (release, index) => `
        <article class="changelog-entry${index === 0 ? " is-current" : ""}">
          <div class="changelog-entry-meta">
            <span class="changelog-version">v${escapeHtml(release.version)}</span>
            <time datetime="${escapeHtml(release.date)}">${escapeHtml(localizedDate(release.date))}</time>
            ${index === 0 ? `<b>${isEnglish ? "Current" : "Текущая"}</b>` : ""}
          </div>
          <h3>${escapeHtml(copy(release.title))}</h3>
          <p>${escapeHtml(copy(release.summary))}</p>
          <ul>
            ${release.items.map((item) => `<li>${escapeHtml(copy(item))}</li>`).join("")}
          </ul>
        </article>
      `,
    ).join("");
  }

  function openChangelog() {
    if (!dialog) return;
    markCurrentReleaseSeen();
    renderDialog();
    if (accountDialog?.open) accountDialog.close();
    if (!dialog.open) dialog.showModal();
  }

  bannerDismissButton?.addEventListener("click", markCurrentReleaseSeen);
  bannerChangelogButton?.addEventListener("click", openChangelog);
  banner?.addEventListener("cancel", (event) => {
    event.preventDefault();
    markCurrentReleaseSeen();
  });
  accountChangelogButton?.addEventListener("click", openChangelog);
  dialogCloseButton?.addEventListener("click", () => dialog.close());
  window.addEventListener("malifaux-locale-change", () => {
    renderBanner();
    renderDialog();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === SEEN_VERSION_KEY && event.newValue === appVersion) hideBanner();
  });

  renderDialog();
  showBannerIfNeeded();

  window.MalifauxChangelog = Object.freeze({
    currentVersion: appVersion,
    open: openChangelog,
    releases: RELEASES,
    seenStorageKey: SEEN_VERSION_KEY,
  });
})();
