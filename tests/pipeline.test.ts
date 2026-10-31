import assert from "node:assert/strict";
import { test } from "node:test";
import type { Article } from "@prisma/client";
import type { Story } from "../lib/hackernews";
import {
  articlesToReanalyze,
  countMissing,
  countNewToSelect,
  excludeSaved,
  firstNewRank,
  parsePipelineArgs,
  storyFromArticle,
} from "../lib/pipeline";

function makeArticle(hnId: number, rank: number): Article {
  return {
    id: `id-${hnId}`,
    hnId,
    weekOf: "2026-10-19",
    rank,
    title: `Article ${hnId}`,
    url: `https://example.com/${hnId}`,
    author: "someone",
    points: 100,
    commentCount: 10,
    postedAt: new Date("2026-10-20T00:00:00Z"),
    summary: "",
    tags: [],
    whyItMatters: "",
    learnTopics: [],
    difficulty: "Beginner",
    learningPath: "",
    buildTitle: "",
    buildDescription: "",
    buildFeatures: [],
    buildStack: [],
    buildTimeEstimate: "",
    createdAt: new Date("2026-10-26T00:00:00Z"),
  };
}

function makeStory(hnId: number): Story {
  return { hnId, title: `Story ${hnId}`, url: null, author: "someone", points: 1, commentCount: 0, postedAt: new Date(), text: null };
}

function weekWith(count: number): Article[] {
  return Array.from({ length: count }, (_, index) => makeArticle(100 + index, index + 1));
}

test("parsePipelineArgs uses limit 8 and no force by default", () => {
  assert.deepEqual(parsePipelineArgs([]), { limit: 8, force: false });
  assert.deepEqual(parsePipelineArgs(["--limit", "2", "--force"]), { limit: 2, force: true });
});

test("parsePipelineArgs rejects invalid limits", () => {
  for (const value of ["0", "11", "abc", "1.5"]) {
    assert.throws(() => parsePipelineArgs(["--limit", value]), /--limit/);
  }
  assert.throws(() => parsePipelineArgs(["--limit"]), /--limit/);
});

test("countMissing never goes above 8 or below 0", () => {
  assert.equal(countMissing(0), 8);
  assert.equal(countMissing(3), 5);
  assert.equal(countMissing(8), 0);
  assert.equal(countMissing(10), 0);
});

test("a normal run on a complete week does nothing", () => {
  const existing = weekWith(8);
  const reanalyze = articlesToReanalyze(existing, { limit: 8, force: false });
  assert.equal(reanalyze.length, 0);
  assert.equal(countNewToSelect(existing.length, reanalyze.length, 8), 0);
});

test("a normal run only fills the missing articles", () => {
  assert.equal(countNewToSelect(3, 0, 8), 5);
  assert.equal(countNewToSelect(0, 0, 8), 8);
});

test("--limit caps how many new articles are selected", () => {
  assert.equal(countNewToSelect(1, 0, 2), 2);
  assert.equal(countNewToSelect(7, 0, 5), 1);
});

test("--force re-analyzes saved articles by rank, even if they are out of order", () => {
  const existing = [makeArticle(3, 3), makeArticle(1, 1), makeArticle(2, 2)];
  const reanalyze = articlesToReanalyze(existing, { limit: 8, force: true });
  assert.deepEqual(reanalyze.map((article) => article.rank), [1, 2, 3]);
});

test("--force --limit 1 re-analyzes only rank 1 and adds nothing new", () => {
  const existing = weekWith(3);
  const reanalyze = articlesToReanalyze(existing, { limit: 1, force: true });
  assert.deepEqual(reanalyze.map((article) => article.rank), [1]);
  assert.equal(countNewToSelect(existing.length, reanalyze.length, 1), 0);
});

test("--force on an incomplete week re-analyzes first, then fills with what is left of the limit", () => {
  const existing = weekWith(3);
  const reanalyze = articlesToReanalyze(existing, { limit: 5, force: true });
  assert.equal(reanalyze.length, 3);
  assert.equal(countNewToSelect(existing.length, reanalyze.length, 5), 2);
});

test("--force on a complete week never adds new articles", () => {
  const existing = weekWith(8);
  const reanalyze = articlesToReanalyze(existing, { limit: 10, force: true });
  assert.equal(reanalyze.length, 8);
  assert.equal(countNewToSelect(existing.length, reanalyze.length, 10), 0);
});

test("excludeSaved removes stories that are already saved", () => {
  const candidates = [makeStory(1), makeStory(2), makeStory(3)];
  const available = excludeSaved(candidates, [{ hnId: 2 }]);
  assert.deepEqual(available.map((story) => story.hnId), [1, 3]);
});

test("firstNewRank continues after the highest saved rank", () => {
  assert.equal(firstNewRank([]), 1);
  assert.equal(firstNewRank([{ rank: 1 }, { rank: 2 }, { rank: 3 }]), 4);
  assert.equal(firstNewRank([{ rank: 1 }, { rank: 5 }]), 6);
});

test("storyFromArticle uses the saved article, not the latest candidates", () => {
  const story = storyFromArticle(makeArticle(42, 1));
  assert.equal(story.hnId, 42);
  assert.equal(story.url, "https://example.com/42");
  assert.equal(story.text, null);
});
