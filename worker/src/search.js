import { RULE_PAGES } from "./rules-data.js";

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "been",
  "being",
  "book",
  "campaign",
  "does",
  "from",
  "have",
  "into",
  "page",
  "that",
  "their",
  "then",
  "there",
  "these",
  "they",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "your",
  "будет",
  "быть",
  "если",
  "есть",
  "игрок",
  "кампания",
  "когда",
  "может",
  "можно",
  "надо",
  "правило",
  "после",
  "почему",
  "такое",
  "тогда",
  "чтобы",
  "этого",
  "этой",
]);

const RUSSIAN_RULE_TERMS = new Map([
  ["арсенал", ["arsenal"]],
  ["бартер", ["barter"]],
  ["банда", ["crew"]],
  ["встреч", ["encounter", "game"]],
  ["дуэл", ["duel"]],
  ["действ", ["action"]],
  ["заработ", ["payday", "scrip"]],
  ["ключ", ["keyword"]],
  ["кооператив", ["cooperative"]],
  ["лидер", ["leader"]],
  ["модель", ["model"]],
  ["наем", ["hire"]],
  ["наним", ["hire"]],
  ["недел", ["week"]],
  ["обмен", ["barter"]],
  ["опыт", ["experience"]],
  ["последств", ["aftermath"]],
  ["продвиж", ["advance", "advancement"]],
  ["репутац", ["reputation"]],
  ["рейтинг", ["campaign", "rating"]],
  ["снаряж", ["equipment"]],
  ["скрип", ["scrip"]],
  ["способност", ["ability"]],
  ["травм", ["injury"]],
  ["флип", ["flip"]],
]);

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en-US")
    .replaceAll("ё", "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function tokenize(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));
}

function expandedTerms(query, translatedTerms = []) {
  const terms = new Set([...tokenize(query), ...translatedTerms.flatMap(tokenize)]);
  const normalizedQuery = normalize(query);

  for (const [stem, additions] of RUSSIAN_RULE_TERMS) {
    if (!normalizedQuery.includes(stem)) continue;
    additions.forEach((term) => terms.add(term));
  }

  return [...terms].slice(0, 24);
}

function occurrences(haystack, needle) {
  let count = 0;
  let offset = 0;
  while (offset < haystack.length) {
    const found = haystack.indexOf(needle, offset);
    if (found === -1) break;
    count += 1;
    offset = found + needle.length;
  }
  return count;
}

export function searchRules(query, translatedTerms = [], limit = 4) {
  const terms = expandedTerms(query, translatedTerms);
  if (!terms.length) return [];

  const normalizedPhrase = normalize(translatedTerms.join(" ") || query);
  const ranked = RULE_PAGES.map((page) => {
    const title = normalize(page.title);
    const text = normalize(page.text);
    let score = 0;

    if (normalizedPhrase.length >= 8 && text.includes(normalizedPhrase)) score += 14;

    for (const term of terms) {
      const titleHits = occurrences(title, term);
      const textHits = Math.min(occurrences(text, term), 8);
      score += titleHits * 7 + textHits;
    }

    return { ...page, score };
  })
    .filter((page) => page.score > 0 && page.text)
    .sort((left, right) => right.score - left.score || left.page - right.page);

  const selected = [];
  for (const page of ranked) {
    if (selected.length >= limit) break;
    selected.push(page);
  }

  if (!selected.length && ranked.length) selected.push(ranked[0]);
  return selected;
}

export function rulesContext(pages, maxChars = 16000) {
  let context = "";
  const included = [];

  for (const page of pages) {
    const block = `\n\n[SOURCE: Index of the Untold, printed page ${page.page}${
      page.title ? `, ${page.title}` : ""
    }]\n${page.text}`;
    if (context.length + block.length > maxChars) break;
    context += block;
    included.push(page.page);
  }

  return { context: context.trim(), pages: included };
}
