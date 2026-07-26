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
- поиск карточек моделей через BiggerHat с локальным кэшем;
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
- краткие справочники по травмам, снаряжению и продвижениям;
- раздел «Правила» с точными страницами 14–56 оригинальной книги, иллюстрациями и
  двуязычным оглавлением;
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

### Карточки моделей и офлайн-режим

Каталог карточек загружается из сторонней базы
[BiggerHat](https://biggerhat.net/) при первом открытии селектора и сохраняется
локально в браузере. Поиск после этого не создаёт новых запросов; полная карточка
загружается только при выборе модели.

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
- BiggerHat model-card search with a local browser cache;
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
- concise Injury, Equipment, and Advancement references;
- a Rules section containing exact original pages 14–56, illustrations, and a
  bilingual table of contents;
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

### Model cards and offline use

The card catalog is loaded from the third-party
[BiggerHat](https://biggerhat.net/) database when a picker is first opened and is
then cached locally in the browser. Further searches do not make API requests; a
full card is fetched only when a model is selected.

Every selected card and borrowed talent is stored as a snapshot inside the
dossier. Existing arsenals, card views, and exported JSON therefore keep working
offline and do not change when the external database changes. Manual model and
talent entry remains available when BiggerHat cannot be reached.

English rules wording is reproduced verbatim from the original rulebook.
Non-text game symbols are rendered with accessible text labels where needed.
The Russian wording remains a condensed quick-reference version.
