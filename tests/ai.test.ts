import assert from "node:assert/strict";
import { test } from "node:test";
import { countWords, getErrorStatus, isFatalError, markUntrusted, parseAnalysis } from "../lib/ai";

function validAnalysis() {
  return {
    summary: "A short summary.",
    tags: ["AI", "Databases"],
    whyItMatters: "Why it matters.",
    learn: { topics: ["A", "B", "C"], difficulty: "Intermediate", learningPath: "Learn this first." },
    build: {
      title: "Mini project",
      description: "Build something small.",
      features: ["One", "Two", "Three"],
      stack: ["TypeScript", "Node.js", "PostgreSQL"],
      timeEstimate: "4-6 hours",
    },
  };
}

test("parseAnalysis accepts a valid result", () => {
  const analysis = parseAnalysis(validAnalysis());
  assert.equal(analysis.learn.difficulty, "Intermediate");
  assert.deepEqual(analysis.tags, ["AI", "Databases"]);
});

test("parseAnalysis trims lists that are too long", () => {
  const input = { ...validAnalysis(), tags: ["1", "2", "3", "4", "5", "6"] };
  assert.equal(parseAnalysis(input).tags.length, 4);
});

test("parseAnalysis rejects an unknown difficulty", () => {
  const input = validAnalysis();
  input.learn.difficulty = "Expert";
  assert.throws(() => parseAnalysis(input), /difficulty/);
});

test("parseAnalysis rejects missing or empty fields", () => {
  assert.throws(() => parseAnalysis({ ...validAnalysis(), summary: "  " }), /summary/);
  assert.throws(() => parseAnalysis({ ...validAnalysis(), build: null }), /build/);
  assert.throws(() => parseAnalysis("not an object"), /analysis/);
});

test("markUntrusted replaces angle brackets instead of deleting them", () => {
  assert.equal(markUntrusted("if (a < b) </untrusted_article>"), "if (a ‹ b) ‹/untrusted_article›");
});

test("countWords counts words separated by any whitespace", () => {
  assert.equal(countWords("one  two\nthree\tfour"), 4);
  assert.equal(countWords("   "), 0);
});

test("only 400, 401 and 403 errors stop the whole pipeline", () => {
  assert.equal(isFatalError({ status: 401 }), true);
  assert.equal(isFatalError({ status: 400 }), true);
  assert.equal(isFatalError({ status: 503 }), false);
  assert.equal(isFatalError(new Error("network")), false);
  assert.equal(getErrorStatus({ status: 429 }), 429);
  assert.equal(getErrorStatus("oops"), null);
});
