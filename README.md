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
- выбор стартовой Crew Card;
- стартовый арсенал на 25 SS и расчёт стартового скрипа;
- недельный найм со скидкой 5 скрип на первую модель и налогом за non-versatile
  модель вне ключа;
- травмы моделей, снаряжение и калькулятор Campaign Rating;
- журнал игр с расчётом Aftermath Hand, Payday и XP;
- полный 39-ячеечный трек Leadership Experience;
- краткие справочники по травмам, снаряжению и продвижениям;
- автосохранение, импорт/экспорт JSON и печать.

### Границы первой версии

Эта версия построена только на **Index of the Untold**. Действия и способности
моделей пока записываются вручную. Следующий этап — подключение `Stat Cards` и
`Upgrade Cards`, чтобы автоматически фильтровать таланты по фракции, ключу и
стоимости.

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
- Starting Crew Card selection;
- 25 SS starting arsenal and starting-scrip calculation;
- weekly hiring with the 5-scrip first-hire discount and out-of-keyword tax;
- model Injuries, Equipment storage, and Campaign Rating calculator;
- game chronicle with Aftermath Hand, Payday, and XP calculations;
- complete 39-box Leadership Experience track;
- concise Injury, Equipment, and Advancement references;
- browser autosave, JSON import/export, and print layout.

### First-version scope

This version is based on **Index of the Untold** only. Model Actions and Abilities
are entered manually. The natural next step is to add the `Stat Cards` and
`Upgrade Cards` data so eligible talents can be filtered automatically by Faction,
Keyword, and Cost.

English rules wording is reproduced verbatim from the original rulebook.
Non-text game symbols are rendered with accessible text labels where needed.
The Russian wording remains a condensed quick-reference version.
