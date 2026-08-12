(function () {
  "use strict";

  const archetypes = Object.freeze({
    "Lucky Upstart": Object.freeze({
      label: "Счастливчик",
      labelEn: "Lucky Upstart",
      tagline: "Сбалансирован и начинает с особого предмета.",
      taglineEn: "Attack Actions: Choose any one attack action from an ally of cost 6 or less.",
      stats: Object.freeze({ Df: 6, Wp: 6, Sp: 6, Health: 14 }),
      talents: Object.freeze([
        Object.freeze({ id: "attack-1", kind: "attack", type: "Атака", typeEn: "Attack", limit: 6 }),
        Object.freeze({ id: "ability-1", kind: "ability", type: "Способность", typeEn: "Ability", limit: 6 }),
      ]),
      rule: "Атака и способность берутся у союзников стоимостью 6 или меньше. Затем сделайте нечитаемый обманом флип и бесплатно получите предмет с точно совпавшим BR; он не учитывается в CR и возвращается после аннигиляции.",
      ruleEn: "Attack Actions: Choose any one attack action from an ally of cost 6 or less. Tactical Actions: None. Abilities: Choose any one ability from an ally of cost 6 or less. Special: Flip a card, which may not be cheated. Select an equipment upgrade which corresponds to that flip’s value exactly and add it to your arsenal for free. This equipment never counts towards your campaign rating. If this equipment is annihilated, add it back to your arsenal after the game.",
    }),
    Generalist: Object.freeze({
      label: "Универсал",
      labelEn: "Generalist",
      tagline: "По одному таланту каждого типа.",
      taglineEn: "Attack Actions: Choose any one attack action from an ally of cost 7 or less.",
      stats: Object.freeze({ Df: 5, Wp: 5, Sp: 6, Health: 14 }),
      talents: Object.freeze([
        Object.freeze({ id: "attack-1", kind: "attack", type: "Атака", typeEn: "Attack", limit: 7 }),
        Object.freeze({ id: "tactical-1", kind: "tactical", type: "Тактика", typeEn: "Tactical", limit: 7 }),
        Object.freeze({ id: "ability-1", kind: "ability", type: "Способность", typeEn: "Ability", limit: 7 }),
      ]),
      rule: "Атака, тактика и способность берутся у союзников стоимостью 7 или меньше.",
      ruleEn: "Attack Actions: Choose any one attack action from an ally of cost 7 or less. Tactical Actions: Choose any one tactical action from an ally of cost 7 or less. Abilities: Choose any one ability from an ally of cost 7 or less.",
    }),
    "Heavy Hitter": Object.freeze({
      label: "Тяжеловес",
      labelEn: "Heavy Hitter",
      tagline: "Мощная атака с одним выбранным триггером.",
      taglineEn: "Attack Actions: Choose any one attack action from an ally of cost 10 or less.",
      stats: Object.freeze({ Df: 6, Wp: 4, Sp: 6, Health: 14 }),
      talents: Object.freeze([
        Object.freeze({ id: "attack-1", kind: "attack", chooseTrigger: true, type: "Атака + триггер", typeEn: "Attack + Trigger", limit: 10 }),
        Object.freeze({ id: "tactical-1", kind: "tactical", type: "Тактика", typeEn: "Tactical", limit: 5 }),
      ]),
      rule: "Атака берётся у союзника стоимостью 10 или меньше и сохраняет один выбранный триггер. Тактика — у союзника стоимостью 5 или меньше.",
      ruleEn: "Attack Actions: Choose any one attack action from an ally of cost 10 or less. Choose one trigger on that attack action and gain that trigger on the chosen action. Tactical Actions: Choose any one tactical action from an ally of cost 5 or less. Abilities: None.",
    }),
    Schemer: Object.freeze({
      label: "Интриган",
      labelEn: "Schemer",
      tagline: "Быстрый специалист по тактическим приёмам.",
      taglineEn: "Attack Actions: Choose any one attack action from an ally of cost 5 or less.",
      stats: Object.freeze({ Df: 6, Wp: 5, Sp: 7, Health: 13 }),
      talents: Object.freeze([
        Object.freeze({ id: "attack-1", kind: "attack", type: "Атака", typeEn: "Attack", limit: 5 }),
        Object.freeze({ id: "tactical-1", kind: "tactical", type: "Тактика I", typeEn: "Tactical I", limit: 8 }),
        Object.freeze({ id: "tactical-2", kind: "tactical", type: "Тактика II", typeEn: "Tactical II", limit: 8 }),
        Object.freeze({ id: "ability-1", kind: "ability", type: "Способность", typeEn: "Ability", limit: 8 }),
      ]),
      rule: "Атака берётся у союзника стоимостью 5 или меньше; две тактики и способность — у союзников стоимостью 8 или меньше.",
      ruleEn: "Attack Actions: Choose any one attack action from an ally of cost 5 or less. Tactical Actions: Choose any two tactical actions from an ally (or allies) of cost 8 or less. Abilities: Choose any one ability from an ally of cost 8 or less.",
    }),
    "Talented Individual": Object.freeze({
      label: "Самородок",
      labelEn: "Talented Individual",
      tagline: "Две способности и гибкий набор действий.",
      taglineEn: "Attack Actions: Choose any one attack action from an ally of cost 6 or less.",
      stats: Object.freeze({ Df: 5, Wp: 5, Sp: 5, Health: 13 }),
      talents: Object.freeze([
        Object.freeze({ id: "attack-1", kind: "attack", type: "Атака", typeEn: "Attack", limit: 6 }),
        Object.freeze({ id: "tactical-1", kind: "tactical", type: "Тактика", typeEn: "Tactical", limit: 6 }),
        Object.freeze({ id: "ability-1", kind: "ability", type: "Способность I", typeEn: "Ability I", limit: 8 }),
        Object.freeze({ id: "ability-2", kind: "ability", type: "Способность II", typeEn: "Ability II", limit: 8 }),
      ]),
      rule: "Атака и тактика берутся у союзников стоимостью 6 или меньше; две способности — у союзников стоимостью 8 или меньше.",
      ruleEn: "Attack Actions: Choose any one attack action from an ally of cost 6 or less. Tactical Actions: Choose any one tactical action from an ally of cost 6 or less. Abilities: Choose any two abilities from an ally (or allies) of cost 8 or less.",
    }),
  });

  window.MalifauxCampaignRules = Object.freeze({ archetypes });
})();
