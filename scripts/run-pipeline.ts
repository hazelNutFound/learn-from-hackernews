import { Prisma } from "@prisma/client";
import { analyzeArticle, getErrorStatus, getModel, isFatalError, requireApiKey, selectArticles, tokenUsage, type Analysis } from "../lib/ai";
import { prisma } from "../lib/db";
import { fetchArticleText, fetchCandidates, fetchTopComments, type Story } from "../lib/hackernews";
import {
  ARTICLE_COUNT,
  articlesToReanalyze,
  countNewToSelect,
  excludeSaved,
  firstNewRank,
  parsePipelineArgs,
  storyFromArticle,
} from "../lib/pipeline";
import { formatWeek, weekOf } from "../lib/week";

type Job = {
  story: Story;
  isNew: boolean;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function lastLine(text: string): string {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines[lines.length - 1] ?? "Unknown error";
}

function articleData(story: Story, analysis: Analysis) {
  return {
    title: story.title,
    url: story.url,
    author: story.author,
    points: story.points,
    commentCount: story.commentCount,
    postedAt: story.postedAt,
    summary: analysis.summary,
    tags: analysis.tags,
    whyItMatters: analysis.whyItMatters,
    learnTopics: analysis.learn.topics,
    difficulty: analysis.learn.difficulty,
    learningPath: analysis.learn.learningPath,
    buildTitle: analysis.build.title,
    buildDescription: analysis.build.description,
    buildFeatures: analysis.build.features,
    buildStack: analysis.build.stack,
    buildTimeEstimate: analysis.build.timeEstimate,
  };
}

async function createArticle(week: string, rank: number, story: Story, analysis: Analysis): Promise<boolean> {
  try {
    await prisma.article.create({ data: { hnId: story.hnId, weekOf: week, rank, ...articleData(story, analysis) } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return false;
    }
    throw error;
  }
}

async function updateArticle(week: string, story: Story, analysis: Analysis) {
  await prisma.article.update({
    where: { hnId_weekOf: { hnId: story.hnId, weekOf: week } },
    data: articleData(story, analysis),
  });
}

function printTokenUsage() {
  console.log(`  Gemini calls: ${tokenUsage.calls}`);
  console.log(`  Input tokens: ${tokenUsage.inputTokens}`);
  console.log(`  Output tokens: ${tokenUsage.outputTokens}`);
  console.log(`  Thinking tokens: ${tokenUsage.thoughtTokens}`);
}

async function main() {
  const options = parsePipelineArgs(process.argv.slice(2));
  requireApiKey();

  const week = weekOf();
  console.log(`Week of ${week} (${formatWeek(week)}, UTC) · model: ${getModel()}${options.force ? " · --force" : ""}\n`);

  const existing = await prisma.article.findMany({ where: { weekOf: week }, orderBy: { rank: "asc" } });
  const reanalyze = articlesToReanalyze(existing, options);
  const newCount = countNewToSelect(existing.length, reanalyze.length, options.limit);
  console.log(`Already saved for this week: ${existing.length}/${ARTICLE_COUNT}`);

  if (reanalyze.length === 0 && newCount === 0) {
    console.log("This week is already complete. Nothing to do (use --force to analyze the saved articles again).");
    return;
  }

  let newStories: Story[] = [];
  if (newCount > 0) {
    console.log("1/4 Fetching candidates...");
    const candidates = await fetchCandidates(week);
    const available = excludeSaved(candidates, existing);
    console.log(`  Found ${candidates.length} candidates, ${available.length} not saved yet.`);

    console.log(`2/4 Selecting ${newCount} new articles with Gemini...`);
    newStories = (await selectArticles(available, newCount)).slice(0, newCount);
    console.log(`  Selected ${newStories.length}.`);
  } else {
    console.log("1/4 No new articles needed, skipping Hacker News candidates.");
    console.log("2/4 No new articles needed, skipping Gemini selection.");
  }

  const jobs: Job[] = [
    ...reanalyze.map((article) => ({ story: storyFromArticle(article), isNew: false })),
    ...newStories.map((story) => ({ story, isNew: true })),
  ];

  console.log(`3/4 Analyzing ${jobs.length} articles...`);
  let nextRank = firstNewRank(existing);
  let saved = 0;
  let alreadySaved = 0;
  let failed = 0;

  for (const [index, job] of jobs.entries()) {
    console.log(`  [${index + 1}/${jobs.length}] ${job.isNew ? "New" : "Re-analyze"}: ${job.story.title}`);

    try {
      const [comments, articleText] = await Promise.all([fetchTopComments(job.story.hnId), fetchArticleText(job.story)]);
      console.log(`    ${comments.length} comments, article text: ${articleText ? `${articleText.length} chars` : "unavailable"}`);
      const analysis = await analyzeArticle(job.story, comments, articleText);

      if (!job.isNew) {
        await updateArticle(week, job.story, analysis);
      } else if (await createArticle(week, nextRank, job.story, analysis)) {
        console.log(`    Rank ${nextRank}.`);
        nextRank += 1;
      } else {
        console.log("    Another run already saved this article, skipping.");
        alreadySaved += 1;
        continue;
      }
      saved += 1;
      console.log("    Saved.");
    } catch (error) {
      if (isFatalError(error)) {
        throw error;
      }
      failed += 1;
      console.log(`    Skipped: ${errorMessage(error)}`);
    }
  }

  console.log("4/4 Done.");
  console.log(`  Saved: ${saved}, already saved by another run: ${alreadySaved}, failed: ${failed}`);
  printTokenUsage();

  if (failed > 0) {
    console.log(`::warning::${failed} article(s) failed to analyze. See the log above for the reasons.`);
  }
  if (jobs.length > 0 && saved === 0 && alreadySaved === 0) {
    console.error("::error::No articles were saved in this run.");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    const status = getErrorStatus(error);
    if (status === 400 || status === 401 || status === 403) {
      console.error(`\nPipeline stopped: Gemini rejected the request (HTTP ${status}). Check GEMINI_API_KEY and GEMINI_MODEL.`);
    } else {
      console.error("\nPipeline stopped.");
    }
    console.error(errorMessage(error));
    console.error(`::error::${lastLine(errorMessage(error))}`);
    if (tokenUsage.calls > 0) {
      printTokenUsage();
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
