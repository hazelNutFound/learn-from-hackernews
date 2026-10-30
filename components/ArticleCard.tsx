import { hnDiscussionUrl, type Story } from "@/lib/hackernews";

type ArticleCardProps = {
  story: Story;
  rank: number;
};

function getDomain(url: string | null): string | null {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default function ArticleCard({ story, rank }: ArticleCardProps) {
  const domain = getDomain(story.url);
  const postedOn = story.postedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="text-2xl font-bold text-orange-500">{rank}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-snug">
            <a href={story.url ?? hnDiscussionUrl(story.hnId)} target="_blank" rel="noreferrer" className="hover:underline">
              {story.title}
            </a>
          </h2>
          {domain && <p className="mt-1 text-sm text-gray-500">{domain}</p>}
          <p className="mt-3 text-sm text-gray-600">
            {story.points} points · by {story.author} · {postedOn} ·{" "}
            <a href={hnDiscussionUrl(story.hnId)} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">
              {story.commentCount} comments on HN
            </a>
          </p>
        </div>
      </div>
    </article>
  );
}
