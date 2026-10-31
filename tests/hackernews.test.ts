import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeEntities, extractMainHtml, hnDiscussionUrl, htmlToText, sortByPoints, type Story } from "../lib/hackernews";

function makeStory(hnId: number, points: number): Story {
  return {
    hnId,
    title: `Story ${hnId}`,
    url: null,
    author: "someone",
    points,
    commentCount: 0,
    postedAt: new Date("2026-10-20T00:00:00Z"),
    text: null,
  };
}

test("decodeEntities decodes named and numeric entities", () => {
  assert.equal(decodeEntities("Tom &amp; Jerry &lt;3 &quot;hi&quot; it&#x27;s &#39;ok&#39;"), `Tom & Jerry <3 "hi" it's 'ok'`);
});

test("decodeEntities does not crash on a code point that is too large", () => {
  assert.doesNotThrow(() => decodeEntities("&#99999999999;"));
});

test("htmlToText removes scripts, styles and tags", () => {
  const html = "<style>p{}</style><p>Hello <b>world</b></p><script>alert(1)</script>";
  assert.equal(htmlToText(html), "Hello world");
});

test("extractMainHtml prefers <article> over <main>", () => {
  const html = "<nav>menu</nav><main><article>Story body</article><aside>ads</aside></main>";
  assert.equal(extractMainHtml(html), "<article>Story body</article>");
});

test("extractMainHtml falls back to <main>, then to the whole page", () => {
  assert.equal(extractMainHtml("<nav>menu</nav><main>Body</main>"), "<main>Body</main>");
  assert.equal(extractMainHtml("<div>Only a div</div>"), "<div>Only a div</div>");
});

test("sortByPoints sorts high to low without changing the original list", () => {
  const stories = [makeStory(1, 10), makeStory(2, 300), makeStory(3, 50)];
  const sorted = sortByPoints(stories);
  assert.deepEqual(sorted.map((story) => story.hnId), [2, 3, 1]);
  assert.deepEqual(stories.map((story) => story.hnId), [1, 2, 3]);
});

test("hnDiscussionUrl builds the Hacker News link", () => {
  assert.equal(hnDiscussionUrl(123), "https://news.ycombinator.com/item?id=123");
});
