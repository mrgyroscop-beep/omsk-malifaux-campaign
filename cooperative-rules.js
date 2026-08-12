(function () {
  "use strict";

  const VERSION = 2;
  const suits = Object.freeze(["R", "M", "C", "T"]);
  const crewCardsFallback = Object.freeze([
    ["expert-coordination", "Expert Coordination", "ability", "Models with either leader keyword may drain a Soulstone on activation to move up to 3\"."],
    ["shape-landscape", "Shape the Landscape", "marker", "Choose a marker from an eligible Master's Crew Card."],
    ["heavy-blow", "Heavy Blow", "ability", "After damaging an enemy, drain a Soulstone to deal +1 damage."],
    ["unusual-specialty", "Unusual Specialty", "token", "Choose an eligible token; Fast and Aetheric Surge are forbidden."],
    ["the-plan", "The Plan Comes Together", "action", "An ally within 6\" may move up to 3\" and Interact with a Strategy marker."],
    ["forbidden-curse", "Forbidden Curse", "token", "Choose an eligible token; Flicker and Summon are forbidden."],
    ["specialized-tools", "Specialized Tools", "upgrade", "Choose an eligible upgrade type from a related Master, Crew Card, or Totem."],
    ["prepared", "Prepared For Anything", "ability", "Models may drain a Soulstone to declare Prepare."],
    ["scavenger", "Scavenger's Instinct", "ability", "After killing an enemy, drain a Soulstone to draw and heal 1."],
    ["inhuman", "Inhuman Determination", "ability", "On activation, drain a Soulstone to heal 2 and move up to 1\"."],
    ["loot-stash", "Loot Their Stash", "action", "Attach temporary equipment matching an uncheatable flip."],
    ["sadistic", "Sadistic Blow", "action", "Melee attack; on a raise the target gains Injured."],
  ].map(([id, name, parameterType, text]) => Object.freeze({ id, name, parameterType, text })));

  const scenarioEconomy = Object.freeze({
    intro: { hand: 3, payday: 2, xp: 1 }, smash: { hand: 3, payday: 2, xp: 1 },
    mine: { hand: 3, payday: 2, xp: 1 }, soulstone: { hand: 4, payday: 2, xp: 1 },
    train: { hand: 3, payday: 2, xp: 1 }, bargain: { hand: 3, payday: 2, xp: 1 },
    overthrow: { hand: 3, payday: 2, xp: 1 }, infiltration: { hand: 4, payday: 2, xp: 1 },
    bounty: { hand: 4, payday: 2, xp: 1 }, jailbreak: { hand: 3, payday: 2, xp: 1 },
    call: { hand: 3, payday: 2, xp: 1 }, last: { hand: 4, payday: 3, xp: 1 },
    workshop: { hand: 3, payday: 2, xp: 1 }, ritual: { hand: 3, payday: 2, xp: 1 },
    pillars: { hand: 4, payday: 3, xp: 1 },
  });

  function uid(prefix) {
    return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
  }
  function card(value, suit = "") {
    const joker = value === "RJ" ? "red" : value === "BJ" ? "black" : "";
    return { id: uid("card"), value, suit, joker, label: joker ? value : `${value} ${suit}` };
  }
  function createDeck() {
    const deck = [];
    suits.forEach((suit) => { for (let value = 1; value <= 13; value += 1) deck.push(card(value, suit)); });
    deck.push(card("BJ"), card("RJ"));
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  function parseCard(value) {
    const text = String(value || "").trim().toUpperCase().replace(/\s+/gu, " ");
    if (["RJ", "RED JOKER"].includes(text)) return card("RJ");
    if (["BJ", "BLACK JOKER"].includes(text)) return card("BJ");
    const match = text.match(/^(1[0-3]|[1-9])\s*([RMCT])$/u);
    return match ? card(Number(match[1]), match[2]) : null;
  }
  function parseHand(value) {
    const parts = String(value || "").split(/[,;\n]+/u).map((item) => item.trim()).filter(Boolean);
    const cards = parts.map(parseCard);
    const invalid = parts.filter((_, index) => !cards[index]);
    const valid = cards.filter(Boolean);
    const seen = new Set();
    const duplicates = valid.filter((item) => seen.has(item.label) || !seen.add(item.label)).map((item) => item.label);
    return { cards: valid, invalid, duplicates };
  }
  function outcome(cardValue, cheated = false) {
    if (!cardValue) return null;
    return { ...cardValue, cheated, natural: !cheated, effectiveValue: cardValue.joker === "red" && cheated ? 13 : cardValue.value };
  }
  function barterRating(cardValue) {
    if (!cardValue) return null;
    if (cardValue.joker === "black") return 0;
    if (cardValue.joker === "red") return 13;
    return Number(cardValue.value);
  }
  function injuryKey(cardValue) {
    if (!cardValue) return "";
    if (cardValue.joker === "black") return "Black Joker";
    if (cardValue.joker === "red") return "Red Joker";
    return `${cardValue.value} ${["R", "M"].includes(cardValue.suit) ? "R/M" : "C/T"}`;
  }
  function formula(scenarioId, tracker, result) {
    const base = scenarioEconomy[scenarioId] || { hand: 3, payday: 2, xp: 1 };
    const lossXp = result === "loss" ? 1 : 0;
    return {
      hand: base.hand,
      payday: base.payday,
      xp: base.xp + lossXp,
      explanation: [`Base hand ${base.hand}`, `Base payday ${base.payday}`, `Participation XP ${base.xp}`, lossXp ? "Group loss +1 XP" : "No loss bonus"],
      trackerSnapshot: { ...(tracker || {}) },
      rulesVersion: VERSION,
    };
  }
  function pendingFlip(purpose) { return { id: uid("flip"), purpose, card: null, cheatedWith: null, resolved: false }; }

  window.CooperativeCampaignRules = Object.freeze({
    version: VERSION, suits, crewCardsFallback, scenarioEconomy,
    createDeck, parseCard, parseHand, outcome, barterRating, injuryKey, formula, pendingFlip, uid,
  });
})();
