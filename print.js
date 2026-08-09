(() => {
  const STORAGE_KEY = "m4e-untold-campaign-v1";

  function escapePrintHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function currentPrintState() {
    try {
      if (typeof state === "object" && state) return state;
    } catch {
      // Fall back to the exported local state below.
    }
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function isEnglishPrint() {
    try {
      return typeof currentLocale === "string" && currentLocale === "en";
    } catch {
      return localStorage.getItem("m4e-untold-locale") === "en";
    }
  }

  function printText(ru, en) {
    return isEnglishPrint() ? en : ru;
  }

  function printInjuryCount(value) {
    return Array.isArray(value) ? value.length : Math.max(0, Number(value) || 0);
  }

  function renderPrintInjuries(value) {
    const items = Array.isArray(value) ? value : [];
    if (!items.length) return escapePrintHtml(printInjuryCount(value) || "—");
    return `<ul class="print-injury-list">${items
      .map((injury) => {
        const name =
          (isEnglishPrint() && injury.nameEn ? injury.nameEn : injury.name) ||
          injury.nameEn ||
          printText("Не указана", "Unspecified");
        const effect =
          (isEnglishPrint() && injury.effectEn ? injury.effectEn : injury.effect) ||
          injury.effectEn ||
          "";
        const flip = injury.flip ? `${injury.flip} · ` : "";
        return `<li><b>${escapePrintHtml(`${flip}${name}`)}</b>${
          effect ? `<small>${escapePrintHtml(effect)}</small>` : ""
        }</li>`;
      })
      .join("")}</ul>`;
  }

  function printAbilityRecords(advances, recipient) {
    return (Array.isArray(advances) ? advances : [])
      .filter(
        (advance) =>
          advance?.recipient === recipient &&
          (advance.tableId === "ability" || advance.resultType === "ability"),
      )
      .map((advance) => {
        const snapshot = advance.snapshot?.entry || advance.snapshot || {};
        return {
          name: advance.name || snapshot.name || printText("Способность", "Ability"),
          effect:
            snapshot.description ||
            snapshot.text ||
            snapshot.effect ||
            advance.notes ||
            "",
          source: advance.source || snapshot.source || "",
          flip: advance.flip?.card || "",
        };
      });
  }

  function renderPrintAbilitySection(advances, recipient, profileAbilities = []) {
    const items = [
      ...(Array.isArray(profileAbilities)
        ? profileAbilities.map((ability) => ({
            name: ability.name,
            effect: ability.text || ability.description || "",
            source: printText("Профиль", "Profile"),
            flip: "",
          }))
        : []),
      ...printAbilityRecords(advances, recipient),
    ];
    return `<section class="print-permanent-block" data-print-section="abilities">
      <h3>${printText("Способности", "Abilities")}</h3>
      ${
        items.length
          ? `<ul class="print-ability-list">${items
              .map(
                (ability) => `<li><b>${escapePrintHtml(ability.name)}</b>
                  ${
                    ability.source || ability.flip
                      ? `<small>${escapePrintHtml(
                          [ability.source, ability.flip].filter(Boolean).join(" · "),
                        )}</small>`
                      : ""
                  }
                  ${ability.effect ? `<p>${richPrintText(ability.effect)}</p>` : ""}
                </li>`,
              )
              .join("")}</ul>`
          : `<p class="print-empty">${printText("Способностей нет.", "No abilities.")}</p>`
      }
    </section>`;
  }

  function renderPrintInjurySection(injuries) {
    return `<section class="print-permanent-block" data-print-section="injuries">
      <h3>${printText("Травмы", "Injuries")}</h3>
      ${renderPrintInjuries(injuries)}
    </section>`;
  }

  function richPrintText(value) {
    try {
      if (typeof cardText === "function") return cardText(value);
    } catch {
      // Plain escaped text is still safe and readable in a printed export.
    }
    return escapePrintHtml(value)
      .replaceAll("{{+}}", "+")
      .replaceAll("{{-}}", "−")
      .replace(/\{\{\{?([^{}]+)\}\}\}?/g, "$1");
  }

  function printArchetype(key) {
    try {
      return archetypes[key] || null;
    } catch {
      return null;
    }
  }

  function printCrewCard(id) {
    try {
      return crewCards.find((card) => card.id === id) || null;
    } catch {
      return null;
    }
  }

  function talentSlot(archetype, talent, index) {
    const slots = archetype?.talents || [];
    return (
      slots.find((slot) => slot.id === talent?.slotId) ||
      slots[index] || {
        kind: talent?.kind || "",
        type: talent?.kind || printText("Талант", "Talent"),
        typeEn: talent?.kind || "Talent",
      }
    );
  }

  function printActionMeta(action) {
    if (!action) return "";
    const pieces = [];
    if (action.isSignature) {
      pieces.push(
        typeof actionMarkerHtml === "function"
          ? actionMarkerHtml("signature")
          : '<span class="action-marker action-marker-signature"><span class="action-marker-glyph action-marker-glyph-signature"></span></span>',
      );
    }
    if (action.range) {
      pieces.push(
        `${escapePrintHtml(action.rangeTypeLabel || action.rangeType || "Rg")} ${escapePrintHtml(action.range)}″`,
      );
    }
    if (action.stat) {
      const suits = action.statSuits ? ` ${action.statSuits}` : "";
      const modifier =
        action.statModifier === "positive"
          ? " +"
          : action.statModifier === "negative"
            ? " −"
            : action.statModifier
              ? ` ${action.statModifier}`
              : "";
      const resist = action.resistedBy ? ` vs ${action.resistedBy}` : "";
      pieces.push(
        `Stat ${escapePrintHtml(action.stat)}${escapePrintHtml(suits)}${escapePrintHtml(modifier)}${escapePrintHtml(resist)}`,
      );
    }
    if (action.targetNumber) {
      const suits = action.targetSuits ? ` ${action.targetSuits}` : "";
      pieces.push(`TN ${escapePrintHtml(action.targetNumber)}${escapePrintHtml(suits)}`);
    }
    if (action.damage) pieces.push(`Dmg ${escapePrintHtml(action.damage)}`);
    if (action.stoneCost) {
      pieces.push(
        typeof actionMarkerHtml === "function"
          ? actionMarkerHtml("stone", action.stoneCost)
          : `<span class="action-marker action-marker-stone"><span class="action-marker-glyph action-marker-glyph-stone"></span>${Number(action.stoneCost) > 1 ? `<span class="action-marker-count">${escapePrintHtml(action.stoneCost)}</span>` : ""}</span>`,
      );
    }
    return pieces.join('<span class="action-meta-separator" aria-hidden="true"> · </span>');
  }

  function renderTalent(talent, slot) {
    const entry = talent?.snapshot?.entry || null;
    const trigger = talent?.snapshot?.selectedTrigger || null;
    const name = entry?.name || talent?.name || printText("Не выбрано", "Not selected");
    const source = talent?.source || "";
    const kind = isEnglishPrint() ? slot.typeEn || slot.type : slot.type || slot.typeEn;
    const meta = slot.kind === "ability" ? "" : printActionMeta(entry);
    const description = entry?.description || "";
    return `
      <article class="print-talent">
        <div class="print-talent-heading">
          <span class="print-kicker">${escapePrintHtml(kind)}</span>
          <div>
            <h3>${escapePrintHtml(name)}</h3>
            ${source ? `<small>${printText("Источник", "Source")}: ${escapePrintHtml(source)}</small>` : ""}
          </div>
        </div>
        ${meta ? `<p class="print-action-meta">${meta}</p>` : ""}
        ${description ? `<p class="print-rule-text">${richPrintText(description)}</p>` : ""}
        ${
          trigger
            ? `<div class="print-trigger">
                <b>${printText("Триггер", "Trigger")}: ${richPrintText(
                  [trigger.suits, trigger.name].filter(Boolean).join(" · "),
                )}${trigger.stoneCost ? ` · ${escapePrintHtml(trigger.stoneCost)} SS` : ""}</b>
                ${trigger.description ? `<p>${richPrintText(trigger.description)}</p>` : ""}
              </div>`
            : ""
        }
      </article>`;
  }

  function renderCrewCard(card) {
    if (!card) return "";
    const text = isEnglishPrint() ? card.textEn || card.text : card.text || card.textEn;
    const isAction = card.effectType === "action";
    const actionDetails = isAction
      ? `<dl class="print-crew-action-stats">
          ${CREW_ACTION_FIELDS.map(({ key, label }) => {
            const presentation = crewStatPresentation(card.action?.[key]);
            const accessibleLabel =
              presentation.state === "value"
                ? ""
                : ` aria-label="${escapePrintHtml(presentation.accessible)}"`;
            return `<div data-print-crew-stat="${key}" data-stat-state="${presentation.state}">
              <dt>${label}</dt><dd${accessibleLabel}>${escapePrintHtml(presentation.display)}</dd>
            </div>`;
          }).join("")}
        </dl>`
      : `<p class="print-crew-no-actions">${printText("Действий нет", "No actions")}</p>`;
    return `
      <section class="print-crew-card">
        <div>
          <span class="print-kicker">${printText("Карта команды", "Crew card")}</span>
          <h3>${escapePrintHtml(card.name)}</h3>
          <small class="print-crew-effect-type">${printText(
            isAction ? "Действие" : "Способность",
            isAction ? "Action" : "Ability",
          )}</small>
          ${actionDetails}
        </div>
        <p>${richPrintText(text)}</p>
      </section>`;
  }

  function renderModels(models, loadout) {
    if (!models.length) {
      return `<p class="print-empty">${printText("В арсенале пока нет моделей.", "There are no models in the arsenal yet.")}</p>`;
    }
    return `
      <table class="print-table print-model-table">
        <thead>
          <tr>
            <th>${printText("Стоимость", "Cost")}</th>
            <th>${printText("Модель", "Model")}</th>
            <th>${printText("Станция и характеристики", "Station & characteristics")}</th>
            <th>${printText("Ключи", "Keywords")}</th>
            <th>${printText("Травмы", "Injuries")}</th>
            <th>${printText("Состав", "Crew")}</th>
          </tr>
        </thead>
        <tbody>
          ${models
            .map((model) => {
              const traits = [
                model.type,
                model.henchman ? "Henchman" : "",
                model.versatile ? "Versatile" : "",
              ].filter(Boolean);
              return `
                <tr>
                  <td class="print-cost">${escapePrintHtml(model.cost ?? "—")}</td>
                  <td><b>${escapePrintHtml(model.name || "—")}</b></td>
                  <td>${escapePrintHtml(traits.join(" · ") || "—")}</td>
                  <td>${escapePrintHtml(model.keywords || "—")}</td>
                  <td>${renderPrintInjuries(model.injuries)}</td>
                  <td>${(loadout?.hiredModelIds || []).includes(model.id) ? "✓" : "—"}</td>
                </tr>`;
            })
            .join("")}
        </tbody>
      </table>`;
  }

  function renderEquipment(items, data) {
    if (!items.length) {
      return `<p class="print-empty">${printText("Снаряжение отсутствует.", "No equipment.")}</p>`;
    }
    return `
      <table class="print-table">
        <thead>
          <tr>
            <th>${printText("Предмет", "Item")}</th>
            <th>BR</th>
            <th>CC</th>
            <th>${printText("Назначено", "Assigned to")}</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map((item) => {
              const assignment = (data.loadout?.assignments || []).find(
                (entry) => entry.equipmentId === item.id,
              );
              const target =
                assignment?.targetKind === "leader"
                  ? data.leader?.name || printText("Лидер", "Leader")
                  : assignment?.targetKind === "totem"
                    ? data.leader?.totem?.name || printText("Тотем", "Totem")
                    : assignment?.targetKind === "model"
                      ? (data.arsenal?.models || []).find(
                          (model) => model.id === assignment.targetId,
                        )?.name
                      : "";
              return `
                <tr>
                  <td><b>${escapePrintHtml(item.name || "—")}</b></td>
                  <td>${escapePrintHtml(item.br || "—")}</td>
                  <td>${escapePrintHtml(item.cc ?? "—")}</td>
                  <td>${escapePrintHtml(target || "—")}${item.ratingExempt ? ` · ${printText("вне CR", "CR-exempt")}` : ""}</td>
                </tr>`;
            })
            .join("")}
        </tbody>
      </table>`;
  }

  function renderGames(games) {
    if (!games.length) return "";
    return `
      <section class="print-section print-history">
        <div class="print-section-heading">
          <span class="print-kicker">${printText("Хроника", "Chronicle")}</span>
          <h2>${printText("История кампании", "Campaign history")}</h2>
        </div>
        <table class="print-table">
          <thead>
            <tr>
              <th>${printText("Неделя", "Week")}</th>
              <th>${printText("Соперник", "Opponent")}</th>
              <th>${printText("Результат", "Result")}</th>
              <th>VP</th>
              <th>${printText("Награда", "Reward")}</th>
            </tr>
          </thead>
          <tbody>
            ${games
              .map((game) => {
                const result = game.won
                  ? printText("Победа", "Win")
                  : game.lost
                    ? printText("Поражение", "Loss")
                    : printText("Ничья", "Draw");
                return `
                  <tr>
                    <td>${escapePrintHtml(game.week ?? "—")}</td>
                    <td>${escapePrintHtml(game.opponent || "—")}</td>
                    <td>${result}</td>
                    <td>${escapePrintHtml(game.vp ?? 0)}</td>
                    <td>+${escapePrintHtml(game.scrip ?? 0)} ${printText("скрип", "scrip")} · +${escapePrintHtml(game.xp ?? 0)} XP</td>
                  </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </section>`;
  }

  function renderAdvances(advances) {
    if (!advances.length) return "";
    return `
      <section class="print-section print-advances">
        <div class="print-section-heading">
          <span class="print-kicker">XP</span>
          <h2>${printText("Продвижения лидера и тотема", "Leader and Totem advancements")}</h2>
        </div>
        <ul>
          ${advances
            .map((advance) => {
              const label =
                typeof advance === "string"
                  ? advance
                  : advance?.name || advance?.label || JSON.stringify(advance);
              const details =
                typeof advance === "object" && advance
                  ? [
                      advance.xp ? `XP ${advance.xp}` : "",
                      advance.tier ? `Tier ${advance.tier}` : "",
                      advance.recipient === "totem"
                        ? printText("Тотем", "Totem")
                        : printText("Лидер", "Leader"),
                      advance.appliesTo
                        ? `${printText("для", "for")} ${advance.appliesTo}`
                        : "",
                      advance.flip?.card
                        ? `${advance.flip.card}${advance.flip.cheated ? " · cheated" : ""}`
                        : "",
                      advance.scripPaid
                        ? `${advance.scripPaid} ${printText("скрип", "scrip")}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "";
              return `<li><b>${escapePrintHtml(label)}</b>${details ? `<small> · ${escapePrintHtml(details)}</small>` : ""}${advance?.notes ? `<p>${escapePrintHtml(advance.notes)}</p>` : ""}</li>`;
            })
            .join("")}
        </ul>
      </section>`;
  }

  function renderLeaderAdvancements(advances) {
    const records = (Array.isArray(advances) ? advances : []).filter(
      (advance) =>
        advance?.recipient !== "totem" &&
        advance?.tableId !== "ability" &&
        advance?.resultType !== "ability",
    );
    if (!records.length) return "";
    return `
      <section class="print-permanent-block print-leader-advancements" data-print-leader-advancements>
        <span class="print-kicker">XP · ${printText("Лист лидера", "Leader sheet")}</span>
        <h3>${printText("Продвижения лидера", "Leader advancements")}</h3>
        <ul>
          ${records.map((advance) => {
            const label = typeof advance === "string"
              ? advance
              : advance?.name || advance?.label || printText("Продвижение", "Advancement");
            const details = typeof advance === "object" && advance
              ? [
                  advance.xp ? `XP ${advance.xp}` : "",
                  advance.tier ? `Tier ${advance.tier}` : "",
                  advance.appliesTo ? `${printText("для", "for")} ${advance.appliesTo}` : "",
                  advance.flip?.card || "",
                ].filter(Boolean).join(" · ")
              : "";
            return `<li><b>${escapePrintHtml(label)}</b>${details ? `<small>${escapePrintHtml(details)}</small>` : ""}${advance?.notes ? `<p>${escapePrintHtml(advance.notes)}</p>` : ""}</li>`;
          }).join("")}
        </ul>
      </section>`;
  }

  function renderManualUpgrades(upgrades) {
    const records = Array.isArray(upgrades) ? upgrades : [];
    if (!records.length) return "";
    return `
      <section class="print-permanent-block print-manual-upgrades" data-print-manual-upgrades>
        <span class="print-kicker">${printText("Ручные записи · вне расчётов", "Manual records · excluded from calculations")}</span>
        <h3>${printText("Улучшения лидера", "Leader upgrades")}</h3>
        <p class="print-manual-note">${printText(
          "Не изменяют характеристики, XP, скрип или рейтинг кампании.",
          "Do not change stats, XP, scrip, or Campaign Rating.",
        )}</p>
        <ul class="print-manual-upgrade-list">
          ${records.map((upgrade) => `
            <li data-print-manual-upgrade="${escapePrintHtml(upgrade.id || "")}">
              <b>${escapePrintHtml(upgrade.title || upgrade.name || "—")}</b>
              ${upgrade.action ? `<small>${printText("Действие", "Action")}: ${escapePrintHtml(upgrade.action)}</small>` : ""}
              <p>${escapePrintHtml(upgrade.effect || upgrade.notes || "")}</p>
            </li>`).join("")}
        </ul>
      </section>`;
  }

  function renderTotem(totem, keywords, advances, equipment, loadout) {
    if (!totem) return "";
    const profile = totem.snapshot || totem.profile || {};
    const stats = totem.stats || profile.stats || {};
    const rules = [
      ...(profile.attacks || []),
      ...(profile.tacticals || []),
    ];
    const totemAdvances = advances.filter(
      (advance) =>
        advance?.recipient === "totem" &&
        advance.tableId !== "ability" &&
        advance.resultType !== "ability",
    );
    const equipmentById = new Map(equipment.map((item) => [item.id, item]));
    const totemEquipment = (loadout.assignments || [])
      .filter((assignment) => assignment.targetKind === "totem")
      .map((assignment) => equipmentById.get(assignment.equipmentId))
      .filter(Boolean);
    return `
      <section class="print-section print-totem">
        <div class="print-section-heading">
          <span class="print-kicker">${printText("Тотем · всегда нанят · Cost 0", "Totem · always hired · Cost 0")}</span>
          <h2>${escapePrintHtml(totem.name || profile.name || "—")}</h2>
        </div>
        <p>${escapePrintHtml(
          [
            ...keywords,
            ...(totem.characteristics || []),
            `Sz ${totem.size || 1}`,
            `${totem.base || 30}mm`,
            `${printText("травмы", "injuries")} ${printInjuryCount(totem.injuries)}`,
          ].join(" · "),
        )}</p>
        <div class="print-permanent-grid">
          ${renderPrintAbilitySection(advances, "totem", profile.abilities || [])}
          ${renderPrintInjurySection(totem.injuries)}
        </div>
        <div class="print-stat-strip">
          ${[
            ["Df", stats.df],
            ["Wp", stats.wp],
            ["Sp", stats.sp],
            ["Health", stats.health],
          ]
            .map(
              ([label, value]) =>
                `<span><small>${label}</small><b>${escapePrintHtml(value ?? "—")}</b></span>`,
            )
            .join("")}
        </div>
        ${
          rules.length
            ? `<ul>${rules
                .map(
                  (rule) =>
                    `<li><b>${escapePrintHtml(rule.name)}</b>${rule.text ? `<p>${richPrintText(rule.text)}</p>` : ""}</li>`,
                )
                .join("")}</ul>`
            : ""
        }
        <p class="print-totem-equipment"><b>${printText("Снаряжение", "Equipment")}:</b> ${escapePrintHtml(
          totemEquipment.map((item) => item.name).join(" · ") || "—",
        )}</p>
        ${
          totemAdvances.length
            ? `<p><b>${printText("Продвижения", "Advancements")}:</b> ${escapePrintHtml(
                totemAdvances.map((advance) => advance.name).join(" · "),
              )}</p>`
            : ""
        }
      </section>`;
  }

  function renderPrintDossier() {
    const data = currentPrintState();
    const crew = data.crew || {};
    const campaign = data.campaign || {};
    const leader = data.leader || {};
    const arsenal = data.arsenal || {};
    const models = Array.isArray(arsenal.models) ? arsenal.models : [];
    const equipment = Array.isArray(arsenal.equipment) ? arsenal.equipment : [];
    const games = Array.isArray(data.games) ? data.games : [];
    const advances = Array.isArray(leader.advances) ? leader.advances : [];
    const manualUpgrades = Array.isArray(leader.manualUpgrades) ? leader.manualUpgrades : [];
    const loadout = data.loadout || {};
    const archetype = printArchetype(leader.archetype);
    const talents = Array.isArray(leader.talents) ? leader.talents : [];
    const stats = archetype?.stats || {};
    const keywords = Array.isArray(crew.keywords) ? crew.keywords.filter(Boolean) : [];
    const characteristics = Array.isArray(leader.characteristics)
      ? leader.characteristics.filter(Boolean)
      : [];
    const totalCost = models.reduce((sum, model) => sum + Number(model.cost || 0), 0);
    const totalInjuries =
      printInjuryCount(leader.injuries) +
      models.reduce((sum, model) => sum + printInjuryCount(model.injuries), 0) +
      printInjuryCount(leader.totem?.injuries);
    const archetypeName = archetype
      ? isEnglishPrint()
        ? archetype.labelEn
        : archetype.label
      : leader.archetype || "—";
    const crewCard = printCrewCard(leader.crewCard);
    const existing = document.querySelector("#printDossier");
    if (existing) existing.remove();

    const dossier = document.createElement("main");
    dossier.id = "printDossier";
    dossier.className = "print-dossier";
    dossier.hidden = true;
    dossier.setAttribute("aria-hidden", "true");
    dossier.innerHTML = `
      <section class="print-page print-leader-page">
        <header class="print-cover">
          <div>
            <span class="print-overline">M4E · ${printText("Кампанийное досье", "Campaign dossier")}</span>
            <h1>${escapePrintHtml(crew.name || printText("Без названия", "Untitled crew"))}</h1>
            <p>${[
              crew.player,
              crew.faction,
              keywords.join(" + "),
            ]
              .filter(Boolean)
              .map(escapePrintHtml)
              .join(" · ")}</p>
          </div>
          <div class="print-week-stamp">
            <small>${printText("Неделя", "Week")}</small>
            <b>${escapePrintHtml(campaign.week || 1)}</b>
            <span>${escapePrintHtml(campaign.length || "—")} ${printText("нед.", "weeks")}</span>
          </div>
        </header>

        <section class="print-leader">
          <div class="print-leader-heading">
            <div>
              <span class="print-kicker">${printText("Лидер", "Leader")}</span>
              <h2>${escapePrintHtml(leader.name || printText("Без имени", "Unnamed"))}</h2>
              <p>${[
                archetypeName,
                characteristics.join(" · "),
                leader.path,
              ]
                .filter(Boolean)
                .map(escapePrintHtml)
                .join(" · ")}</p>
            </div>
            <div class="print-leader-details">
              <span><small>Sz</small><b>${escapePrintHtml(leader.size ?? "—")}</b></span>
              <span><small>Base</small><b>${escapePrintHtml(leader.base ? `${leader.base}mm` : "—")}</b></span>
              <span><small>XP</small><b>${escapePrintHtml(leader.xp || 0)}</b></span>
            </div>
          </div>
          <div class="print-stat-strip">
            ${[
              ["Df", stats.Df],
              ["Wp", stats.Wp],
              ["Sp", stats.Sp],
              ["Health", stats.Health],
            ]
              .map(
                ([label, value]) =>
                  `<span><small>${label}</small><b>${escapePrintHtml(value ?? "—")}</b></span>`,
              )
              .join("")}
          </div>
        </section>

        <div class="print-permanent-grid print-leader-permanent">
          ${renderPrintAbilitySection(advances, "leader")}
          ${renderPrintInjurySection(leader.injuries)}
          ${renderLeaderAdvancements(advances)}
          ${renderManualUpgrades(manualUpgrades)}
        </div>

        <section class="print-section print-talents">
          <div class="print-section-heading">
            <span class="print-kicker">${printText("Заимствованные таланты", "Borrowed talents")}</span>
            <h2>${printText("Действия и способности", "Actions & abilities")}</h2>
          </div>
          <div class="print-talent-list">
            ${talents
              .map((talent, index) =>
                renderTalent(talent, talentSlot(archetype, talent, index)),
              )
              .join("")}
          </div>
        </section>

        ${renderCrewCard(crewCard)}
        <footer class="print-footer">
          <span>${printText("Лист лидера", "Leader sheet")}</span>
          <b>01</b>
        </footer>
      </section>

      <section class="print-page print-arsenal-page">
        <header class="print-page-heading">
          <div>
            <span class="print-overline">M4E · ${printText("Кампанийное досье", "Campaign dossier")}</span>
            <h1>${printText("Арсенал команды", "Crew arsenal")}</h1>
            <p>${escapePrintHtml(crew.name || "—")}</p>
          </div>
          <div class="print-summary">
            <span><small>${printText("Модели", "Models")}</small><b>${models.length}</b></span>
            <span><small>${printText("Стоимость", "Cost")}</small><b>${totalCost}</b></span>
            <span><small>${printText("Скрип", "Scrip")}</small><b>${escapePrintHtml(arsenal.scrip || 0)}</b></span>
            <span><small>${printText("Травмы", "Injuries")}</small><b>${totalInjuries}</b></span>
          </div>
        </header>

        <section class="print-section">
          <div class="print-section-heading">
            <span class="print-kicker">${printText("Состав", "Roster")}</span>
            <h2>${printText("Модели в арсенале", "Models in the arsenal")}</h2>
          </div>
          ${renderModels(models, loadout)}
        </section>

        <section class="print-section print-equipment">
          <div class="print-section-heading">
            <span class="print-kicker">${printText("Хранилище", "Storage")}</span>
            <h2>${printText("Снаряжение", "Equipment")}</h2>
          </div>
          ${renderEquipment(equipment, data)}
        </section>

        ${renderTotem(leader.totem, keywords, advances, equipment, loadout)}
        ${renderAdvances(advances)}
        ${renderGames(games)}
        <footer class="print-footer">
          <span>${printText("Арсенал и хроника", "Arsenal & chronicle")}</span>
          <b>02</b>
        </footer>
      </section>`;
    document.body.append(dossier);
  }

  window.renderPrintDossier = renderPrintDossier;
  window.addEventListener("beforeprint", renderPrintDossier);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderPrintDossier, { once: true });
  } else {
    renderPrintDossier();
  }
})();
