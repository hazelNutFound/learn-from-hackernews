import type { Article } from "@prisma/client";
import type { Story } from "./hackernews";

export const ARTICLE_COUNT = 8;

export type PipelineOptions = {
  limit: number;
  force: boolean;
};

export function parsePipelineArgs(args: string[]): PipelineOptions {
  let limit = ARTICLE_COUNT;

  const limitIndex = args.indexOf("--limit");
  if (limitIndex !== -1) {
    limit = Number(args[limitIndex + 1]);
    if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
      throw new Error("--limit must be a whole number from 1 to 10, for example: npm run pipeline -- --limit 1");
    }
  }

  return { limit, force: args.includes("--force") };
}

export function countMissing(existingCount: number): number {
  return Math.max(ARTICLE_COUNT - existingCount, 0);
}

export function articlesToReanalyze(existing: Article[], options: PipelineOptions): Article[] {
  if (!options.force) {
    return [];
  }
  return [...existing].sort((a, b) => a.rank - b.rank).slice(0, options.limit);
}

export function countNewToSelect(existingCount: number, reanalyzeCount: number, limit: number): number {
  return Math.min(countMissing(existingCount), Math.max(limit - reanalyzeCount, 0));
}

export function excludeSaved(candidates: Story[], existing: { hnId: number }[]): Story[] {
  const savedIds = new Set(existing.map((article) => article.hnId));
  return candidates.filter((story) => !savedIds.has(story.hnId));
}

export function firstNewRank(existing: { rank: number }[]): number {
  return Math.max(0, ...existing.map((article) => article.rank)) + 1;
}

export function storyFromArticle(article: Article): Story {
  return {
    hnId: article.hnId,
    title: article.title,
    url: article.url,
    author: article.author,
    points: article.points,
    commentCount: article.commentCount,
    postedAt: article.postedAt,
    text: null,
  };
}
