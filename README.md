# The Unwritten Index / Неписаный реестр

RU / [English](#english)

## Русский

Локальный двуязычный билдер кампании Malifaux Fourth Edition по разделу
Campaign Mode книги **M4E — Index of the Untold**.

### Запуск

Откройте `index.html` в современном браузере. Сборка и установка пакетов не нужны.
Переключатель **RU / EN** находится в верхней панели; выбранный язык сохраняется в
браузере и не меняет данные кампании.

Для локального HTTP-сервера:

```powershell
python -m http.server 4173
```

После запуска откройте `http://localhost:4173`.

### Возможности

- русская и английская версии единого интерфейса;
- титульное досье кампании и недельный цикл;
- пять архетипов лидера с корректными характеристиками и ограничениями;
- поиск карточек моделей через BiggerHat с локальным браузерным кэшем и общим Cloudflare KV-кэшем;
- свободный ввод двух ключевых слов с подсказками и проверкой по каталогу BiggerHat;
- автоматическое заполнение модели в арсенале и характеристики Henchman;
- выбор Actions, Tactical Actions, Abilities и триггера Heavy Hitter с карточки;
- сохранение полного снимка выбранной карточки внутри JSON досье;
- выбор стартовой Crew Card;
- стартовый арсенал на 25 SS и расчёт стартового скрипа;
- недельный найм со скидкой 5 скрип на первую модель и налогом за non-versatile
  модель вне ключа;
- травмы моделей, снаряжение и калькулятор Campaign Rating;
- журнал игр с расчётом Aftermath Hand, Payday и XP;
- полный 39-ячеечный трек Leadership Experience;
- краткие справочники по травмам и продвижениям, а также полный каталог из 82 предметов снаряжения;
- раздел «Правила» с точными страницами 14–56 оригинальной книги, иллюстрациями и
  двуязычным оглавлением;
- «Архивариус» с ответами по Campaign Mode через DeepSeek и Cloudflare AI Gateway, поиском по оригинальному тексту и
  кликабельными ссылками на использованные страницы;
- необязательные облачные досье в Cloudflare D1: публичная хроника и таблица игроков с отдельным ключом организатора;
- Turnstile-защита запросов к ИИ и изменений облачных данных;
- встроенная двуязычная обратная связь с защищённой D1-очередью для автоматизации;
- кликабельные номера страниц во всех разделах и возврат к исходному месту;
- автосохранение, импорт/экспорт JSON и печать.

### Правила и навигация

В приложение включён отдельный структурированный PDF раздела **Campaign Mode**:
печатные страницы 14–56 сохранены в исходной векторной вёрстке вместе с таблицами
и иллюстрациями. В PDF добавлены закладки по разделам, а в интерфейсе — русское и
английское оглавление, переход к номеру печатной страницы и прямые ссылки вида
`#rules/31`.

Номера страниц в Досье, Лидере, Арсенале, Хронике и Справочнике открывают нужную
страницу правил. Кнопка «Назад» возвращает в тот же раздел, вкладку и положение
страницы, откуда был выполнен переход. На мобильных устройствах показывается
точное постраничное изображение оригинала; полный PDF всегда можно открыть
отдельно.

Сам документ правил остаётся официальным английским оригиналом без обратного
перевода с русского. Переключатель RU / EN меняет интерфейс и оглавление.

### Архивариус

Окно «Архивариус» отправляет вопрос через отдельный Cloudflare Worker и
Cloudflare AI Gateway. Ключ
DeepSeek хранится только в Secret-хранилище Cloudflare и никогда не попадает в
HTML, JavaScript или сетевые запросы браузера. Worker ищет подходящие фрагменты
печатных страниц 14–56 и требует от модели отвечать только по найденному
контексту. Источники ответа открываются непосредственно в разделе «Правила».

AI Gateway кеширует только полностью идентичные запросы: поисковые переводы на
семь дней, ответы Архивариуса на сутки. Перед отправкой к DeepSeek Gateway делает
до трёх попыток с экспоненциальной задержкой. При инфраструктурной ошибке Gateway
Worker один раз обращается к DeepSeek напрямую; ошибки ключа, баланса и лимитов
этот аварийный маршрут не обходит. В логах Gateway сохраняются метрики, но не
тексты вопросов и ответов.

История диалога хранится только в `sessionStorage` текущей вкладки. Содержимое
досье, имена игроков и данные арсенала не отправляются. Чат работает на
опубликованном сайте и через `localhost`; небезопасный источник `file://`
намеренно не поддерживается.

### Облачная кампания и безопасность

Сайт остаётся статическим и может публиковаться на GitHub Pages. Cloudflare
Worker обслуживает только API, поэтому переносить HTML, CSS, JavaScript и
встроенные правила в Cloudflare Pages не требуется.

Кнопка «Облачная кампания» создаёт общую запись в D1. Ссылка вида
`?campaign=…#chronicle` открывает таблицу игроков и хронику только для чтения.
Изменения разрешены владельцу отдельного ключа организатора. Ключ показывается
один раз, хранится только в браузере организатора и никогда не добавляется в
публичную ссылку; в D1 сохраняется только его SHA-256-хэш. Без авторизации это
сознательная модель доступа: любой, у кого есть ссылка, может читать кампанию,
но не редактировать её. Браузер хранит ключи раздельно для каждой кампании,
поэтому открытие чужой публичной ссылки не стирает права организатора. Кампанию
вместе с таблицей и хроникой можно удалить из облака по подтверждению.

Перед записью и вопросом Архивариусу браузер получает короткую анонимную сессию
после проверки Turnstile. Сессия подписана Worker, привязана к разрешённому
Origin и действует два часа. BiggerHat запрашивается через Worker; ответы
кэшируются в KV, а Cron обновляет каталоги каждые шесть часов. Если свежий ответ
BiggerHat временно недоступен, Worker может вернуть сохранённую устаревшую
копию. Cloudflare Web Analytics работает без cookies и не записывает параметры
публичной ссылки.

### Обратная связь

Кнопка «Обратная связь» открывает встроенную доступную форму на русском или
английском языке. В D1 отправляются категория, сообщение, необязательный контакт,
версия приложения, язык и текущий раздел. Отправка использует ту же
Turnstile-сессию, что и остальные защищённые действия, но имеет отдельный лимит
частоты. Повтор одного `requestId` с теми же данными безопасно возвращает
существующую квитанцию; повтор с изменёнными данными отклоняется.

Очередь не имеет публичного API чтения. Внешняя автоматизация получает записи
только через закрытые `claim`/`ack`/`retry`/`ignored` маршруты с
`FEEDBACK_AUTOMATION_TOKEN`; стандартная аренда записи длится 15 минут.

Для первого развёртывания Worker:

```powershell
cd worker
npm install
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy
```

Значения `DEEPSEEK_API_KEY`, `SESSION_SIGNING_KEY`, `TURNSTILE_SECRET` и
`FEEDBACK_AUTOMATION_TOKEN` должны
задаваться через Cloudflare Secrets, а не через Git. Идентификаторы D1, KV,
публичный Turnstile sitekey и расписание Cron находятся в `worker/wrangler.jsonc`.

### Карточки моделей и офлайн-режим

Каталог карточек загружается из сторонней базы
[BiggerHat](https://biggerhat.net/) через Cloudflare Worker при первом открытии
селектора и сохраняется в Cloudflare KV и локально в браузере. Поиск после этого
не создаёт новых запросов; полная карточка загружается только при выборе модели.

Выбранная карточка и заимствованный талант сохраняются снимком внутри досье.
Поэтому уже созданные арсеналы, просмотр карточек и экспортированные JSON работают
без сети и не меняются вслед за внешней базой. Если BiggerHat недоступен, ручной
ввод модели и таланта остаётся доступен.

Английские формулировки правил перенесены из оригинальной книги дословно.
Нетекстовые игровые пиктограммы при необходимости переданы понятными текстовыми
обозначениями. Русские формулировки остаются сокращённой справочной версией; в
спорных случаях приоритет имеет оригинальная книга.

## English

A local bilingual Malifaux Fourth Edition campaign builder for the Campaign Mode
section of **M4E — Index of the Untold**.

### Run

Open `index.html` in a modern browser. No build step or package installation is
required. Use the **RU / EN** switch in the top bar; the selected language is saved
in the browser without changing campaign data.

To run a local HTTP server:

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`.

### Features

- Russian and English versions in one interface;
- campaign dossier and weekly cycle;
- all five Leader Archetypes with their correct stats and limits;
- BiggerHat model-card search with browser and Cloudflare KV caches;
- free entry, autocomplete, and BiggerHat validation for both campaign keywords;
- automatic arsenal entry, including the Henchman characteristic;
- card-based Action, Tactical Action, Ability, and Heavy Hitter trigger selection;
- complete card snapshots stored inside the exported dossier JSON;
- Starting Crew Card selection;
- 25 SS starting arsenal and starting-scrip calculation;
- weekly hiring with the 5-scrip first-hire discount and out-of-keyword tax;
- model Injuries, Equipment storage, and Campaign Rating calculator;
- game chronicle with Aftermath Hand, Payday, and XP calculations;
- complete 39-box Leadership Experience track;
- concise Injury and Advancement references plus the complete 82-item Equipment catalog;
- a Rules section containing exact original pages 14–56, illustrations, and a
  bilingual table of contents;
- an Archivist assistant routed through DeepSeek and Cloudflare AI Gateway,
  grounded in the original Campaign Mode text with
  clickable source-page citations;
- optional Cloudflare D1 dossiers with a shared chronicle and player table;
- Turnstile protection for AI requests and cloud-data mutations;
- embedded bilingual feedback with a protected D1 automation queue;
- clickable page references throughout the builder with contextual back navigation;
- browser autosave, JSON import/export, and print layout.

### Rules and navigation

The app includes a structured standalone PDF of the **Campaign Mode** section.
Printed pages 14–56 retain the original vector layout, tables, and illustrations,
with PDF bookmarks added for the section hierarchy. The app provides a bilingual
table of contents, printed-page navigation, and direct links such as `#rules/31`.

Page references in Dossier, Leader, Arsenal, Chronicle, and Reference open the
relevant rulebook page. Back returns to the originating section, Reference tab,
scroll position, and link. Mobile devices use exact page images from the same
source, while the complete PDF remains available separately.

The rules document is the official English source, not a translation back from
Russian. The RU / EN switch changes the interface and table of contents.

### Archivist

The Archivist sends questions through a separate Cloudflare Worker and
Cloudflare AI Gateway. The DeepSeek key stays in Cloudflare Secrets and is never
embedded in browser code or browser network requests. The Worker retrieves
relevant text from printed pages 14–56 and instructs the model to answer only
from that context. Every returned source opens directly in the Rules section.

AI Gateway caches exact requests only: search translations for seven days and
Archivist answers for one day. It retries DeepSeek up to three times with
exponential backoff. If Gateway itself has an infrastructure failure, the Worker
makes one direct DeepSeek request; authentication, billing, and rate-limit errors
do not use this fallback. Gateway logs retain metrics without storing question or
answer payloads.

Conversation history stays in the current tab's `sessionStorage`. Dossier,
player, and arsenal data is not sent. Chat works on the published site and
through `localhost`; the unsafe `file://` origin is intentionally unsupported.

### Cloud campaigns and security

The site remains static and can stay on GitHub Pages. Cloudflare serves only the
API, so the HTML, CSS, JavaScript, and bundled rules do not need to move to
Cloudflare Pages.

The Cloud Campaign button creates a shared D1 record. A link such as
`?campaign=…#chronicle` exposes the player table and shared chronicle in
read-only mode. Mutations require a separate organizer key. The raw key is shown
once, remains only in the organizer's browser, and is never included in the
share link; D1 stores only its SHA-256 hash. Since there is no user
authentication, anyone with the public link can read the campaign but cannot
edit it. Organizer keys are stored separately per campaign, so opening another
public link does not erase existing organizer access. A confirmed delete removes
the cloud dossier together with its player table and chronicle.

Before cloud mutations or an Archivist question, the browser obtains a
short-lived anonymous session after Turnstile verification. The Worker signs the
session, binds it to an allowed Origin, and expires it after two hours. BiggerHat
requests pass through the Worker, use a KV read-through cache, and are prewarmed
by Cron every six hours. A stale KV copy is used if the upstream service is
temporarily unavailable. Cloudflare Web Analytics uses no cookies and does not
record the public link's query parameters.

### Feedback

The Feedback button opens an accessible embedded form in Russian or English. D1
stores the category, message, optional contact, app version, locale, and current
section. Submission uses the existing Turnstile session and a dedicated rate
limit. Reusing a `requestId` with an identical payload safely returns the
existing receipt; changing the payload produces a conflict.

The queue has no public read endpoint. External automation can consume it only
through secret-protected `claim`/`ack`/`retry`/`ignored` routes using
`FEEDBACK_AUTOMATION_TOKEN`; the default claim lease is 15 minutes.

Initial Worker deployment:

```powershell
cd worker
npm install
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy
```

Set `DEEPSEEK_API_KEY`, `SESSION_SIGNING_KEY`, `TURNSTILE_SECRET`, and
`FEEDBACK_AUTOMATION_TOKEN` as
Cloudflare Secrets, never in Git. D1/KV IDs, the public Turnstile sitekey, and
the Cron schedule live in `worker/wrangler.jsonc`.

### Model cards and offline use

The card catalog is loaded from the third-party
[BiggerHat](https://biggerhat.net/) database through the Cloudflare Worker when
a picker is first opened. It is cached both in Cloudflare KV and locally in the
browser. Further searches do not make API requests; a full card is fetched only
when a model is selected.

Every selected card and borrowed talent is stored as a snapshot inside the
dossier. Existing arsenals, card views, and exported JSON therefore keep working
offline and do not change when the external database changes. Manual model and
talent entry remains available when BiggerHat cannot be reached.

English rules wording is reproduced verbatim from the original rulebook.
Non-text game symbols are rendered with accessible text labels where needed.
The Russian wording remains a condensed quick-reference version.
