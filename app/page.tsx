import ArticleCard from "@/components/ArticleCard";
import { fetchCandidates, type Story } from "@/lib/hackernews";
import { formatWeek, weekOf } from "@/lib/week";

export const revalidate = 3600;

const ARTICLE_COUNT = 8;

export default async function HomePage() {
  const week = weekOf();
  let stories: Story[] = [];
  let loadFailed = false;

  try {
    const candidates = await fetchCandidates(week);
    stories = candidates.slice(0, ARTICLE_COUNT);
  } catch (error) {
    console.error("Could not load Hacker News stories:", error);
    loadFailed = true;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Week of {formatWeek(week)}</h1>
      <p className="mt-1 text-sm text-gray-600">
        Top {ARTICLE_COUNT} stories by points posted on Hacker News during this week (UTC).
      </p>

      {loadFailed && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">Could not load stories from Hacker News. Please try again later.</p>
      )}

      {!loadFailed && stories.length === 0 && <p className="mt-6 text-gray-600">No stories found for this week.</p>}

      <div className="mt-6 space-y-4">
        {stories.map((story, index) => (
          <ArticleCard key={story.hnId} story={story} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}
