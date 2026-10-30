import { fetchArticleText, fetchCandidates, fetchTopComments, hnDiscussionUrl } from "../lib/hackernews";
import { formatWeek, weekOf } from "../lib/week";

async function main() {
  const week = weekOf();
  console.log(`Week of ${week} (${formatWeek(week)}, UTC)\n`);

  console.log("1/3 Fetching candidates...");
  const candidates = await fetchCandidates(week);
  console.log(`Found ${candidates.length} candidates. Top 10 by points:`);
  candidates.slice(0, 10).forEach((story, index) => {
    console.log(`  ${index + 1}. [${story.points} pts, ${story.commentCount} comments] ${story.title}`);
  });

  const story = candidates[0];
  if (!story) {
    console.log("No stories found for this week.");
    return;
  }

  console.log(`\nDetails for: ${story.title}`);
  console.log(`  Article: ${story.url ?? "(no external link)"}`);
  console.log(`  Discussion: ${hnDiscussionUrl(story.hnId)}`);

  console.log("\n2/3 Fetching top comments...");
  const comments = await fetchTopComments(story.hnId);
  comments.forEach((comment, index) => {
    console.log(`  ${index + 1}. ${comment.author}: ${comment.text.slice(0, 200)}`);
  });

  console.log("\n3/3 Fetching article text...");
  const text = await fetchArticleText(story);
  if (text) {
    console.log(`  ${text.length} characters. First 500:\n  ${text.slice(0, 500)}`);
  } else {
    console.log("  Article text unavailable (analysis would use title + comments only).");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
