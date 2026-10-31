import { Prisma, type Article } from "@prisma/client";
import { analyzeArticle, getErrorStatus, getModel, isFatalError, requireApiKey, selectArticles, tokenUsage, type Analysis } from "../lib/ai";
import { prisma } from "../lib/db";
import { fetchArticleText, fetchCandidates, fetchTopComments, type Story } from "../lib/hackernews";
import { formatWeek, weekOf } from "../lib/week";

const ARTICLE_COUNT = 8;

type Job = {
  story: Story;
  isNew: boolean;
};

function readOptions() {
  const args = process.argv.slice(2);
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function storyFromArticle(article: Article, candidates: Story[]): Story {
  const fresh = candidates.find((story) => story.hnId === article.hnId);
  if (fresh) {
    return fresh;
  }
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
  const { limit, force } = readOptions();
  requireApiKey();

  const week = weekOf();
  console.log(`Week of ${week} (${formatWeek(week)}, UTC) · model: ${getModel()}${force ? " · --force" : ""}\n`);

  const existing = await prisma.article.findMany({ where: { weekOf: week }, orderBy: { rank: "asc" } });
  const missing = Math.max(ARTICLE_COUNT - existing.length, 0);
  console.log(`Already saved for this week: ${existing.length}/${ARTICLE_COUNT}`);

  if (missing === 0 && !force) {
    console.log("This week is already complete. Nothing to do (use --force to analyze the saved articles again).");
    return;
  }

  console.log("1/4 Fetching candidates...");
  const candidates = await fetchCandidates(week);
  const savedIds = new Set(existing.map((article) => article.hnId));
  const available = candidates.filter((story) => !savedIds.has(story.hnId));
  console.log(`  Found ${candidates.length} candidates, ${available.length} not saved yet.`);

  let newStories: Story[] = [];
  if (missing > 0) {
    console.log(`2/4 Selecting ${missing} new articles with Gemini...`);
    newStories = await selectArticles(available, missing);
    console.log(`  Selected ${newStories.length}.`);
  } else {
    console.log("2/4 This week already has 8 articles, no new ones needed.");
  }

  const reanalyzeJobs: Job[] = force ? existing.map((article) => ({ story: storyFromArticle(article, candidates), isNew: false })) : [];
  const newJobs: Job[] = newStories.map((story) => ({ story, isNew: true }));
  const jobs = [...reanalyzeJobs, ...newJobs].slice(0, limit);

  console.log(`3/4 Analyzing ${jobs.length} articles...`);
  let nextRank = Math.max(0, ...existing.map((article) => article.rank)) + 1;
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
    console.error(`::error::${errorMessage(error)}`);
    if (tokenUsage.calls > 0) {
      printTokenUsage();
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
