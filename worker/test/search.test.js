import assert from "node:assert/strict";
import test from "node:test";

import { rulesContext, searchRules } from "../src/search.js";

test("finds barter pages from English terms", () => {
  const results = searchRules("How many barter flips do I receive?");
  assert.ok(results.length > 0);
  assert.ok(results.some((page) => page.page === 21));
});

test("keeps adjacent aftermath pages when the question mentions a winner", () => {
  const results = searchRules(
    "How many Barter Flips does the winner receive after a game?",
  );
  assert.ok(results.some((page) => page.page === 20));
  assert.ok(results.some((page) => page.page === 21));
});

test("expands common Russian campaign vocabulary", () => {
  const results = searchRules("Как определяется травма модели?");
  assert.ok(results.length > 0);
  assert.ok(results.some((page) => [34, 35, 36].includes(page.page)));
});

test("recognizes Russian builder slang and a typo in existing master", () => {
  const results = searchRules("Могу я взять мастера сущесвующего себе в билдер?");
  assert.ok(results.some((page) => page.page === 15));
  assert.ok(results.some((page) => page.page === 17));
});

test("treats roster and stones as arsenal and encounter vocabulary", () => {
  const results = searchRules("На сколько камней собирать ростер?");
  assert.ok(results.some((page) => page.page === 15));
  assert.ok(results.some((page) => page.page === 19));
});

test("builds a bounded context with printed page labels", () => {
  const results = searchRules("equipment from barter flips");
  const output = rulesContext(results, 9000);
  assert.ok(output.context.includes("[SOURCE: Index of the Untold, printed page"));
  assert.ok(output.context.length <= 9000);
  assert.ok(output.pages.length > 0);
  assert.ok(output.pages.length <= results.length);
});
