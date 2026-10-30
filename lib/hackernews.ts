import { weekRange } from "./week";

export type Story = {
  hnId: number;
  title: string;
  url: string | null;
  author: string;
  points: number;
  commentCount: number;
  postedAt: Date;
  text: string | null;
};

export type Comment = {
  author: string;
  text: string;
};

type AlgoliaHit = {
  objectID: string;
  title: string;
  url?: string | null;
  author: string;
  points?: number | null;
  num_comments?: number | null;
  created_at_i: number;
  story_text?: string | null;
};

type HnItem = {
  id: number;
  by?: string;
  text?: string;
  kids?: number[];
  deleted?: boolean;
  dead?: boolean;
};

const ALGOLIA_SEARCH_URL = "https://hn.algolia.com/api/v1/search";
const HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item";
const PAGE_SIZE = 100;
const CANDIDATE_PAGES = 2;
const ARTICLE_TEXT_LIMIT = 6000;

export function hnDiscussionUrl(hnId: number): string {
  return `https://news.ycombinator.com/item?id=${hnId}`;
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Math.min(parseInt(hex, 16), 0x10ffff)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Math.min(Number(dec), 0x10ffff)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

export function htmlToText(html: string): string {
  const withoutTags = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}

export function extractMainHtml(html: string): string {
  const match = html.match(/<article[\s\S]*?<\/article>/i) ?? html.match(/<main[\s\S]*?<\/main>/i);
  return match ? match[0] : html;
}

export function sortByPoints(stories: Story[]): Story[] {
  return [...stories].sort((a, b) => b.points - a.points);
}

function toStory(hit: AlgoliaHit): Story {
  return {
    hnId: Number(hit.objectID),
    title: hit.title,
    url: hit.url || null,
    author: hit.author,
    points: hit.points ?? 0,
    commentCount: hit.num_comments ?? 0,
    postedAt: new Date(hit.created_at_i * 1000),
    text: hit.story_text ? htmlToText(hit.story_text) : null,
  };
}

async function fetchAlgoliaPage(start: Date, end: Date, page: number): Promise<AlgoliaHit[]> {
  const params = new URLSearchParams({
    tags: "story",
    numericFilters: `created_at_i>=${start.getTime() / 1000},created_at_i<${end.getTime() / 1000}`,
    hitsPerPage: String(PAGE_SIZE),
    page: String(page),
  });
  const response = await fetch(`${ALGOLIA_SEARCH_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Algolia request failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.hits;
}

// Candidates are the top PAGE_SIZE * CANDIDATE_PAGES (200) stories posted during the given UTC week,
// as ranked by points in Algolia's HN index. This is a weekly top list, not a ranking of all HN history.
export async function fetchCandidates(week: string): Promise<Story[]> {
  const { start, end } = weekRange(week);
  const stories: Story[] = [];

  for (let page = 0; page < CANDIDATE_PAGES; page++) {
    const hits = await fetchAlgoliaPage(start, end, page);
    for (const hit of hits) {
      const story = toStory(hit);
      if (!stories.some((s) => s.hnId === story.hnId)) {
        stories.push(story);
      }
    }
    if (hits.length < PAGE_SIZE) {
      break;
    }
  }

  return sortByPoints(stories);
}

async function fetchItem(id: number): Promise<HnItem | null> {
  const response = await fetch(`${HN_ITEM_URL}/${id}.json`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function fetchTopComments(hnId: number, limit = 5): Promise<Comment[]> {
  try {
    const story = await fetchItem(hnId);
    const kidIds = (story?.kids ?? []).slice(0, limit * 2);
    const kids = await Promise.all(kidIds.map(fetchItem));

    const comments: Comment[] = [];
    for (const kid of kids) {
      if (!kid || kid.deleted || kid.dead || !kid.text) {
        continue;
      }
      comments.push({ author: kid.by ?? "unknown", text: htmlToText(kid.text) });
    }
    return comments.slice(0, limit);
  } catch (error) {
    console.error(`Could not fetch comments for ${hnId}:`, error);
    return [];
  }
}

export async function fetchArticleText(story: Story): Promise<string | null> {
  if (!story.url) {
    return story.text ? story.text.slice(0, ARTICLE_TEXT_LIMIT) : null;
  }

  try {
    const response = await fetch(story.url, { signal: AbortSignal.timeout(10_000) });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.includes("text")) {
      return null;
    }
    const html = await response.text();
    let text = htmlToText(extractMainHtml(html));
    if (text.length < 200) {
      text = htmlToText(html);
    }
    text = text.slice(0, ARTICLE_TEXT_LIMIT);
    return text || null;
  } catch (error) {
    console.error(`Could not fetch article text for ${story.url}:`, error);
    return null;
  }
}
