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

  function printKnownRuleText(name, fallback = "") {
    const rules = {
      "Catch a Glimpse": {
        ru: "Посмотрите две верхние карты колоды судьбы этой модели, затем верните их в том же порядке.",
        en: "Look at the top two cards of this model’s fate deck, then place them back in the same order.",
      },
      "Draw Their Attention": {
        ru: "Дружественная модель в LoS этой модели может сбросить карту, чтобы объявить действие Interact.",
        en: "A friendly model in this model’s LoS may discard a card to declare the Interact action.",
      },
      "Serene Countenance": {
        ru: "Вражеские атакующие действия, целящиеся в эту модель, не могут жульничать на дуэли.",
        en: "Enemy attack actions that target this model cannot cheat their duel.",
      },
      "Hag’s Kiss": {
        ru: "Атака Wp 5 на 2″; урон 2. Цель получает Stunned и Slow.",
        en: "Rg 2\"; Skl 5; Rst Wp; TN -; Dmg 2. The target gains Stunned and Slow tokens.",
      },
    };
    const key = String(name || "").trim();
    return fallback || rules[key]?.[isEnglishPrint() ? "en" : "ru"] || "";
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
    return `<section class="print-permanent-block${items.length ? "" : " is-empty"}" data-print-section="abilities">
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
    const items = Array.isArray(injuries) ? injuries : [];
    const isEmpty = !items.length && !printInjuryCount(injuries);
    return `<section class="print-permanent-block${isEmpty ? " is-empty" : ""}" data-print-section="injuries">
      <h3>${printText("Травмы", "Injuries")}</h3>
      ${isEmpty ? `<p class="print-empty">—</p>` : renderPrintInjuries(injuries)}
    </section>`;
  }

  function assignedPrintEquipment(items, loadout, targetKind, targetId = null) {
    const equipmentById = new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
    return (Array.isArray(loadout?.assignments) ? loadout.assignments : [])
      .filter(
        (assignment) =>
          assignment.targetKind === targetKind &&
          (targetKind !== "model" || assignment.targetId === targetId),
      )
      .map((assignment) => equipmentById.get(assignment.equipmentId))
      .filter(Boolean);
  }

  function renderPrintEquipmentSection(items) {
    const records = Array.isArray(items) ? items : [];
    return `<section class="print-permanent-block${records.length ? "" : " is-empty"}" data-print-section="equipment">
      <h3>${printText("Снаряжение", "Equipment")}</h3>
      ${
        records.length
          ? `<ul class="print-equipment-list">${records
              .map((item) => `<li><b>${escapePrintHtml(item.name || "—")}</b>${
                printKnownRuleText(item.name, item.effect) ? `<p>${richPrintText(printKnownRuleText(item.name, item.effect))}</p>` : ""
              }</li>`)
              .join("")}</ul>`
          : `<p class="print-empty">—</p>`
      }
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

  function plainPrintText(value) {
    try {
      if (typeof plainCardText === "function") return escapePrintHtml(plainCardText(value));
    } catch {
      // Fall through to a plain, escaped token label.
    }
    return escapePrintHtml(value).replace(/\{\{\{?([^{}]+)\}\}\}?/g, "$1");
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
      const marker =
        typeof actionMarkerHtml === "function"
          ? actionMarkerHtml("signature")
          : '<span class="action-marker action-marker-signature" aria-hidden="true"><span class="action-marker-glyph action-marker-glyph-signature"></span></span>';
      pieces.push(
        `<span class="print-signature-label" data-print-signature-label>${marker}<span>${printText("Сигнатурное", "Signature")}</span></span>`,
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
      <article class="print-talent${trigger ? " has-triggers" : ""}${slot.kind === "ability" ? " print-talent-ability" : ""}">
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

  function renderLeaderAction(record) {
    const action = record?.action || {};
    const kind = action.typeLabel || action.type || printText("Действие", "Action");
    const source = [
      record?.originLabel,
      record?.source ? `${printText("Источник", "Source")}: ${record.source}` : "",
      record?.page ? `${printText("стр.", "p.")} ${record.page}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const triggers = Array.isArray(action.triggers) ? action.triggers : [];
    return `
      <article class="print-talent print-leader-action${triggers.length ? " has-triggers" : ""}" data-print-leader-action="${escapePrintHtml(action.name)}">
        <div class="print-talent-heading">
          <span class="print-kicker">${escapePrintHtml(kind)}</span>
          <div>
            <h3>${escapePrintHtml(action.name || printText("Действие", "Action"))}</h3>
            ${source ? `<small>${escapePrintHtml(source)}</small>` : ""}
          </div>
        </div>
        ${printActionMeta(action) ? `<p class="print-action-meta">${printActionMeta(action)}</p>` : ""}
        ${action.description ? `<p class="print-rule-text">${richPrintText(action.description)}</p>` : ""}
        ${triggers
          .map(
            (trigger) => `<div class="print-trigger" data-print-action-trigger="${escapePrintHtml(trigger.name)}">
              <b>${printText("Триггер", "Trigger")}: ${richPrintText(
                [trigger.suits, trigger.name].filter(Boolean).join(" · "),
              )}${trigger.stoneCost ? ` · ${escapePrintHtml(trigger.stoneCost)} SS` : ""}</b>
              ${printKnownRuleText(trigger.name, trigger.description) ? `<p>${richPrintText(printKnownRuleText(trigger.name, trigger.description))}</p>` : ""}
            </div>`,
          )
          .join("")}
      </article>`;
  }

  function renderLeaderAbility(record) {
    const ability = record?.ability || {};
    const meta = (() => {
      const defensiveType = String(ability.defensiveAbilityType || "")
        .replaceAll("_", " ")
        .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
      const stoneCost = Number(ability.stoneCost || 0);
      return [
        defensiveType,
        ability.suits,
        stoneCost ? (stoneCost > 1 ? `◆ ${stoneCost}` : "◆") : "",
      ]
        .filter(Boolean)
        .join(" · ");
    })();
    const source = [
      record?.originLabel,
      record?.source ? `${printText("Источник", "Source")}: ${record.source}` : "",
      ability.flip?.card || "",
    ]
      .filter(Boolean)
      .join(" · ");
    return `<article class="print-talent print-talent-ability" data-print-leader-ability="${escapePrintHtml(ability.name)}">
      <div class="print-talent-heading">
        <span class="print-kicker">${printText("Способность", "Ability")}</span>
        <div>
          <h3>${escapePrintHtml(ability.name || printText("Способность", "Ability"))}</h3>
          ${source ? `<small>${escapePrintHtml(source)}</small>` : ""}
        </div>
      </div>
      ${meta ? `<p class="print-action-meta">${richPrintText(meta)}</p>` : ""}
      ${printKnownRuleText(ability.name, ability.effect) ? `<p class="print-rule-text">${richPrintText(printKnownRuleText(ability.name, ability.effect))}</p>` : ""}
    </article>`;
  }

  function renderLeaderPresentationGroup(group) {
    return `<section class="print-leader-action-group" data-print-leader-action-group="${escapePrintHtml(group.id)}">
      <header class="print-leader-action-group-heading">
        <h3>${escapePrintHtml(group.label)}</h3>
        <b>${group.records.length}</b>
      </header>
      <div class="print-talent-list">
        ${group.records
          .map((record) =>
            group.id === "ability"
              ? renderLeaderAbility(record)
              : renderLeaderAction(record),
          )
          .join("")}
      </div>
    </section>`;
  }

  function renderCrewCard(card, advances = []) {
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
    const earnedEffects = advances.filter(
      (advance) => !advance?.legacy && advance?.tableId === "crew-card",
    );
    const earnedEffectsHtml = earnedEffects.length
      ? `<div class="print-crew-earned">
          <span class="print-kicker">Tier IV · ${printText("Добавленные эффекты", "Added effects")}</span>
          ${earnedEffects
            .map((advance) => {
              const entry = advance.snapshot?.entry || {};
              const parameter = String(advance.snapshot?.parameter || "").trim();
              return `<article>
                <b>${escapePrintHtml(advance.name || entry.name || "—")}</b>
                <small>${escapePrintHtml(
                  [advance.source, parameter ? `${printText("Выбор", "Choice")}: ${parameter}` : ""]
                    .filter(Boolean)
                    .join(" · "),
                )}</small>
                ${entry.description ? `<p>${richPrintText(entry.description)}</p>` : ""}
              </article>`;
            })
            .join("")}
        </div>`
      : "";
    return `
      <section class="print-crew-card">
        <div>
          <span class="print-kicker">${printText("Карта команды", "Crew card")}</span>
          <h3 class="print-crew-card-title">${
            isAction && typeof crewActionMarkersHtml === "function"
              ? crewActionMarkersHtml(card.action)
              : ""
          }<span>${escapePrintHtml(card.name)}</span></h3>
          <small class="print-crew-effect-type">${printText(
            isAction ? "Действие" : "Способность",
            isAction ? "Action" : "Ability",
          )}</small>
          ${actionDetails}
        </div>
        <p>${richPrintText(text)}</p>
        ${earnedEffectsHtml}
      </section>`;
  }

  function renderPrintEquipmentSummary(items) {
    const records = Array.isArray(items) ? items : [];
    return `<section class="print-permanent-block${records.length ? "" : " is-empty"}" data-print-section="equipment">
      <h3>${printText("Снаряжение", "Equipment")}</h3>
      ${records.length
        ? `<ul class="print-equipment-list">${records.map((item) => `<li><b>${escapePrintHtml(item.name || "—")}</b></li>`).join("")}</ul>`
        : `<p class="print-empty">—</p>`}
    </section>`;
  }

  function renderModels(models, loadout, equipment) {
    if (!models.length) {
      return `<p class="print-empty">${printText("В арсенале пока нет моделей.", "There are no models in the arsenal yet.")}</p>`;
    }
    return `
      <div class="print-model-cards">
        ${models
          .map((model) => {
            const profile = model.cardSnapshot || null;
            const traits = [
              profile?.stationLabel || model.type,
              model.henchman ? "Henchman" : "",
              model.versatile ? "Versatile" : "",
              model.keywords || profile?.keywords?.map((keyword) => keyword.name).filter(Boolean).join(", "),
              ...(model.characteristics?.length
                ? model.characteristics
                : profile?.characteristics || []),
            ].filter(Boolean);
            const assigned = assignedPrintEquipment(equipment, loadout, "model", model.id);
            return `<article class="print-model-card" data-print-model-card="${escapePrintHtml(model.id || model.name || "")}">
              <header>
                <div><span class="print-kicker">${printText("Модель", "Model")}</span><h3>${escapePrintHtml(model.name || "—")}</h3></div>
                <b class="print-model-cost">${escapePrintHtml(model.cost ?? "—")}</b>
              </header>
              <p class="print-model-traits">${escapePrintHtml(traits.join(" · ") || "—")}</p>
              ${profile ? renderModelProfile(profile) : `<p class="print-model-profile-missing">${printText("Полный профиль не сохранён для этой модели.", "A full profile is not saved for this model.")}</p>`}
              <div class="print-model-upgrades">
                ${renderPrintInjurySection(model.injuries)}
                ${renderPrintEquipmentSection(assigned)}
              </div>
            </article>`;
          })
          .join("")}
      </div>`;
  }

  function renderModelProfile(profile) {
    const actions = Array.isArray(profile.actions) ? profile.actions : [];
    const abilities = Array.isArray(profile.abilities) ? profile.abilities : [];
    const stats = [
      ["Df", profile.defense, profile.defenseSuit],
      ["Wp", profile.willpower, profile.willpowerSuit],
      ["Sp", profile.speed],
      ["Health", profile.health],
      ["Sz", profile.size],
      ["Base", profile.baseLabel || (profile.base ? `${profile.base}mm` : null)],
    ];
    const renderRuleGroup = (label, records, kind) => `
      <section class="print-model-rule-group" data-print-model-${kind === "action" ? "actions" : "abilities"}>
        <h4>${label}</h4>
        <div class="print-talent-list">
          ${
            records.length
              ? records
                  .map((entry) =>
                    kind === "action"
                      ? renderModelAction(entry)
                      : renderModelAbility(entry),
                  )
                  .join("")
              : `<p class="print-empty">—</p>`
          }
        </div>
      </section>`;
    return `<section class="print-model-profile" data-print-model-profile>
      <div class="print-stat-strip">
        ${stats
          .map(
            ([label, value, suit]) =>
              `<span><small>${label}</small><b>${plainPrintText([value ?? "—", suit].filter(Boolean).join(" "))}</b></span>`,
          )
          .join("")}
      </div>
      <div class="print-model-rule-groups">
        ${renderRuleGroup(printText("Действия", "Actions"), actions, "action")}
        ${renderRuleGroup(printText("Способности", "Abilities"), abilities, "ability")}
      </div>
    </section>`;
  }

  function renderCompactLeaderAction(record) {
    const action = record?.action || {};
    const source = [record?.originLabel, record?.source ? `${printText("Источник", "Source")}: ${record.source}` : "", record?.page ? `${printText("стр.", "p.")} ${record.page}` : ""]
      .filter(Boolean)
      .join(" · ");
    const triggers = Array.isArray(action.triggers) ? action.triggers : [];
    return `<article class="print-talent print-leader-action print-talent-compact${triggers.length ? " has-triggers" : ""}">
      <div class="print-talent-heading">
        <div><h3>${escapePrintHtml(action.name || printText("Действие", "Action"))}</h3>${source ? `<small>${escapePrintHtml(source)}</small>` : ""}</div>
      </div>
      ${printActionMeta(action) ? `<p class="print-action-meta">${printActionMeta(action)}</p>` : ""}
      ${action.description ? `<p class="print-rule-text">${richPrintText(action.description)}</p>` : ""}
      ${triggers.map((trigger) => `<div class="print-trigger print-trigger-compact"><b>${printText("Триггер", "Trigger")}: ${richPrintText([trigger.suits, trigger.name].filter(Boolean).join(" · "))}</b>${printKnownRuleText(trigger.name, trigger.description) ? `<p>${richPrintText(printKnownRuleText(trigger.name, trigger.description))}</p>` : ""}</div>`).join("")}
    </article>`;
  }

  function renderCompactLeaderAbility(record) {
    const ability = record?.ability || {};
    const source = [record?.originLabel, record?.source ? `${printText("Источник", "Source")}: ${record.source}` : "", ability.flip?.card || ""]
      .filter(Boolean)
      .join(" · ");
    return `<article class="print-talent print-talent-ability print-talent-compact">
      <div class="print-talent-heading">
        <span class="print-kicker">${printText("Способность", "Ability")}</span>
        <div><h3>${escapePrintHtml(ability.name || printText("Способность", "Ability"))}</h3>${source ? `<small>${escapePrintHtml(source)}</small>` : ""}</div>
      </div>
      ${printKnownRuleText(ability.name, ability.effect) ? `<p class="print-rule-text">${richPrintText(printKnownRuleText(ability.name, ability.effect))}</p>` : ""}
    </article>`;
  }

  function renderCompactLeaderPresentationGroup(group) {
    return `<section class="print-leader-action-group" data-print-leader-action-group="${escapePrintHtml(group.id)}">
      <header class="print-leader-action-group-heading"><h3>${escapePrintHtml(group.label)}</h3><b>${group.records.length}</b></header>
      <div class="print-talent-list">${group.records.map((record) => group.id === "ability" ? renderCompactLeaderAbility(record) : renderCompactLeaderAction(record)).join("")}</div>
    </section>`;
  }

  function renderCompactCrewCard(card) {
    if (!card) return "";
    return `<section class="print-crew-card print-crew-card-compact"><div><span class="print-kicker">${printText("Карта команды", "Crew card")}</span><h3>${escapePrintHtml(card.name)}</h3></div></section>`;
  }

  function renderModelAction(action) {
    const triggers = Array.isArray(action.triggers) ? action.triggers : [];
    return `<article class="print-talent print-model-action${triggers.length ? " has-triggers" : ""}" data-print-model-action="${escapePrintHtml(action.name || "")}">
      <div class="print-talent-heading">
        <span class="print-kicker">${escapePrintHtml(action.typeLabel || action.type || printText("Действие", "Action"))}</span>
        <div><h3>${escapePrintHtml(action.name || printText("Действие", "Action"))}</h3></div>
      </div>
      ${printActionMeta(action) ? `<p class="print-action-meta">${printActionMeta(action)}</p>` : ""}
      ${action.description ? `<p class="print-rule-text">${richPrintText(action.description)}</p>` : ""}
      ${triggers
        .map(
          (trigger) => `<div class="print-trigger" data-print-model-trigger="${escapePrintHtml(trigger.name || "")}">
            <b>${printText("Триггер", "Trigger")}: ${richPrintText([trigger.suits, trigger.name].filter(Boolean).join(" · "))}${trigger.stoneCost ? ` · ${escapePrintHtml(trigger.stoneCost)} SS` : ""}</b>
            ${trigger.description ? `<p>${richPrintText(trigger.description)}</p>` : ""}
          </div>`,
        )
        .join("")}
    </article>`;
  }

  function renderModelAbility(ability) {
    return `<article class="print-talent print-talent-ability" data-print-model-ability="${escapePrintHtml(ability.name || "")}">
      <div class="print-talent-heading">
        <span class="print-kicker">${printText("Способность", "Ability")}</span>
        <div><h3>${escapePrintHtml(ability.name || printText("Способность", "Ability"))}</h3></div>
      </div>
      ${ability.suits || ability.defensiveAbilityType ? `<p class="print-action-meta">${richPrintText([ability.defensiveAbilityType, ability.suits].filter(Boolean).join(" · "))}</p>` : ""}
      ${ability.description ? `<p class="print-rule-text">${richPrintText(ability.description)}</p>` : ""}
    </article>`;
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

  function renderAcquiredAdvancesReference(advances) {
    const records = (Array.isArray(advances) ? advances : []).filter((advance) => !advance?.legacy);
    if (!records.length) return "";
    return `<section class="print-section print-acquired-reference">
      <div class="print-section-heading"><span class="print-kicker">${printText("Продвижения", "Advancements")}</span><h2>${printText("Приобретённые правила", "Acquired rules")}</h2></div>
      <div class="print-acquired-reference-list">
        ${records.map((advance) => {
          const snapshot = advance?.snapshot?.entry || advance?.snapshot?.result || advance?.snapshot || {};
          const description = printKnownRuleText(advance.name || snapshot.name, snapshot.description || snapshot.text || snapshot.effect || advance.notes || "");
          const meta = [
            advance.recipient === "totem" ? printText("Тотем", "Totem") : printText("Лидер", "Leader"),
            advance.appliesTo ? `${printText("для", "for")} ${advance.appliesTo}` : "",
            advance.source || "",
            advance.flip?.card || "",
          ].filter(Boolean).join(" · ");
          return `<article class="print-acquired-reference-entry">
            <div class="print-acquired-reference-heading"><div><span class="print-kicker">${escapePrintHtml(advance.resultType || advance.tableId || printText("Продвижение", "Advancement"))}</span><h3>${escapePrintHtml(advance.name || snapshot.name || "—")}</h3></div>${meta ? `<small>${escapePrintHtml(meta)}</small>` : ""}</div>
            ${description ? `<p>${richPrintText(description)}</p>` : `<p class="print-empty">${printText("Текст правила не сохранён.", "Rule text was not saved.")}</p>`}
          </article>`;
        }).join("")}
      </div>
    </section>`;
  }

  function printTotemActionRecords(profile, advances) {
    const records = [...(profile.attacks || []), ...(profile.tacticals || [])].map(
      (source, index) => ({
        id: `totem-profile-${index + 1}`,
        originLabel: printText("Профиль тотема", "Totem profile"),
        source: "",
        page: null,
        action: {
          name: source.name || "",
          type: source.type || (index < (profile.attacks || []).length ? "attack" : "tactical"),
          typeLabel: source.type || (index < (profile.attacks || []).length ? "Attack" : "Tactical"),
          range: source.range || "",
          stat: source.stat ?? source.skill ?? "",
          resistedBy: source.resistedBy || source.resist || "",
          targetNumber: source.targetNumber || source.tn || "",
          damage: source.damage || "",
          description: source.description || source.text || "",
          isSignature: Boolean(source.isSignature || source.signature),
          stoneCost: source.stoneCost || 0,
          triggers: Array.isArray(source.triggers) ? source.triggers : [],
        },
      }),
    );
    const advancementRecords =
      typeof leaderActionRecords === "function"
        ? leaderActionRecords({ talents: [], advances, recipient: "totem" })
        : [];
    advancementRecords.forEach((record) => {
      if (!records.some((candidate) => candidate.action.name === record.action.name)) records.push(record);
    });
    (Array.isArray(advances) ? advances : [])
      .filter(
        (advance) =>
          advance?.recipient === "totem" &&
          ["attack-modification", "tactical-modification"].includes(advance?.tableId) &&
          advance?.appliesTo,
      )
      .forEach((advance) => {
        const record = records.find(
          (candidate) => candidate.action.name.toLocaleLowerCase() === String(advance.appliesTo).toLocaleLowerCase(),
        );
        if (!record) return;
        if (advance.resultType === "skill" && Number.isFinite(Number(advance.snapshot?.result?.skill))) {
          record.action.stat = String(advance.snapshot.result.skill);
        }
        if (advance.resultType === "signature") record.action.isSignature = true;
        if (advance.resultType === "trigger") {
          const snapshot = advance.snapshot?.entry || advance.snapshot?.result || {};
          const trigger = {
            name: snapshot.name || advance.name || "",
            suits: snapshot.suits || advance.suits || "",
            description: snapshot.description || snapshot.text || advance.notes || "",
            stoneCost: snapshot.stoneCost || 0,
          };
          if (trigger.name && !record.action.triggers.some((item) => item.name === trigger.name)) {
            record.action.triggers.push(trigger);
          }
        }
      });
    return records;
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
    const actionRecords = printTotemActionRecords(profile, advances);
    const totemAdvances = advances.filter(
      (advance) =>
        advance?.recipient === "totem" &&
        advance.tableId !== "ability" &&
        advance.resultType !== "ability",
    );
    const totemEquipment = assignedPrintEquipment(equipment, loadout, "totem");
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
          ${renderPrintEquipmentSection(totemEquipment)}
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
          actionRecords.length
            ? `<div class="print-talent-list print-totem-actions">${actionRecords.map(renderLeaderAction).join("")}</div>`
            : ""
        }
        ${
          totemAdvances.length
            ? `<p><b>${printText("Продвижения", "Advancements")}:</b> ${escapePrintHtml(
                totemAdvances.map((advance) => advance.name).join(" · "),
              )}</p>`
            : ""
        }
      </section>`;
  }

  function buildDossier(data) {
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
    const leaderActions = typeof leaderActionRecords === "function"
      ? leaderActionRecords({ talents, advances, recipient: "leader" })
      : [];
    const leaderEquipment = assignedPrintEquipment(equipment, loadout, "leader");
    const presentationGroups =
      typeof leaderPresentationGroups === "function"
        ? leaderPresentationGroups({ talents, advances, includeLegacyAbilities: true })
        : [
            { id: "attack", label: printText("Действия", "Actions"), records: leaderActions },
          ].filter((group) => group.records.length);
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
    const printComment = String(crew.printComment || "").trim();
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
            <div class="print-leader-details">
              <span><small>Sz</small><b>${escapePrintHtml(leader.size ?? "—")}</b></span>
              <span><small>Base</small><b>${escapePrintHtml(leader.base ? `${leader.base}mm` : "—")}</b></span>
              <span><small>XP</small><b>${escapePrintHtml(leader.xp || 0)}</b></span>
            </div>
          </div>
        </section>

        <div class="print-permanent-grid print-leader-permanent">
          ${renderPrintInjurySection(leader.injuries)}
          ${renderPrintEquipmentSection(leaderEquipment)}
          ${renderManualUpgrades(manualUpgrades)}
        </div>

        <section class="print-section print-talents">
          <div class="print-section-heading">
            <span class="print-kicker">${printText("Таланты и продвижения", "Talents & advancements")}</span>
            <h2>${printText("Действия и способности", "Actions & abilities")}</h2>
          </div>
          <div class="print-leader-action-groups">
            ${presentationGroups.map(renderCompactLeaderPresentationGroup).join("")}
          </div>
        </section>

        ${renderCompactCrewCard(crewCard)}
        <footer class="print-footer">
          <span>${printText("Лист лидера", "Leader sheet")}</span>
          <b>01</b>
        </footer>
      </section>

      <section class="print-page print-rules-page">
        <header class="print-page-heading">
          <div>
            <span class="print-overline">M4E · ${printText("Кампанийное досье", "Campaign dossier")}</span>
            <h1>${printText("Справочник правил", "Rules reference")}</h1>
            <p>${escapePrintHtml(crew.name || "—")} · ${escapePrintHtml(leader.name || "—")}</p>
          </div>
          <div class="print-reference-stamp"><span>${printText("Только приобретённое", "Acquired only")}</span><b>02</b></div>
        </header>

        <section class="print-section print-acquired-rules">
          <div class="print-section-heading"><span class="print-kicker">${printText("Лидер", "Leader")}</span><h2>${printText("Полные тексты действий и способностей", "Full actions & abilities")}</h2></div>
          <div class="print-leader-action-groups">${presentationGroups.map(renderLeaderPresentationGroup).join("")}</div>
        </section>

        ${renderCrewCard(crewCard, advances)}
        ${renderAcquiredAdvancesReference(advances)}
        <section class="print-section print-acquired-equipment">
          <div class="print-section-heading"><span class="print-kicker">${printText("Предметы", "Equipment")}</span><h2>${printText("Снаряжение лидера", "Leader equipment")}</h2></div>
          ${renderPrintEquipmentSummary(leaderEquipment)}
        </section>

        <footer class="print-footer"><span>${printText("Справочник приобретённых правил", "Acquired rules reference")}</span><b>02</b></footer>
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

        ${
          printComment
            ? `<aside class="print-roster-comment" data-print-roster-comment>
                <span class="print-kicker">${printText("Комментарий к ростеру", "Roster comment")}</span>
                <p>${escapePrintHtml(printComment)}</p>
              </aside>`
            : ""
        }

        <section class="print-section">
          <div class="print-section-heading">
            <span class="print-kicker">${printText("Состав", "Roster")}</span>
            <h2>${printText("Модели в арсенале", "Models in the arsenal")}</h2>
          </div>
          ${renderModels(models, loadout, equipment)}
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
          <b>03</b>
        </footer>
      </section>`;
    return dossier;
  }

  function renderPrintDossier() {
    document.querySelector("#printDossier")?.remove();
    document.body.append(buildDossier(currentPrintState()));
  }

  window.createReadOnlyDossier = (value) => {
    const data = window.MalifauxBuilder.normalizeDossier(value);
    const element = buildDossier(data);
    const models = new Map(data.arsenal.models.map((model) => [model.id || model.name, model]));
    element.querySelectorAll("[data-print-model-card]").forEach((card) => {
      const model = models.get(card.dataset.printModelCard);
      if (!model?.cardSnapshot) return;
      const details = document.createElement("details");
      details.className = "org-model-card";
      const summary = document.createElement("summary");
      summary.textContent = printText("Карточка модели", "Model card");
      const body = document.createElement("div");
      body.innerHTML = modelCardHtml(model.cardSnapshot);
      details.append(summary, body);
      card.append(details);
    });
    element.removeAttribute("id");
    element.removeAttribute("aria-hidden");
    element.hidden = false;
    return element;
  };

  window.renderPrintDossier = renderPrintDossier;
  window.addEventListener("beforeprint", renderPrintDossier);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderPrintDossier, { once: true });
  } else {
    renderPrintDossier();
  }
})();
