import type { Article } from "@prisma/client";
import { hnDiscussionUrl } from "@/lib/hackernews";

type ArticleCardProps = {
  article: Article;
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

function Tag({ label }: { label: string }) {
  return <span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-xs text-neutral-700">{label}</span>;
}

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-900">
      {title}
      {note && <span className="ml-2 font-normal normal-case tracking-normal text-neutral-500">{note}</span>}
    </h3>
  );
}

function ListItems({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-neutral-400">–</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const isDemo = article.hnId < 0;
  const domain = getDomain(article.url);
  const link = article.url ?? hnDiscussionUrl(article.hnId);
  const postedOn = article.postedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <article className="rounded-lg border border-brand-100 bg-white p-5 transition-colors hover:border-brand-500/40 sm:p-8">
      <p className="font-mono text-xs text-neutral-400">
        <span className="text-brand-500">{String(article.rank).padStart(2, "0")}</span>
        {domain && <span> · {domain}</span>}
      </p>
      <h2 className="mt-2 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
        <a href={link} target="_blank" rel="noreferrer" className="hover:underline hover:decoration-brand-500 hover:underline-offset-4">
          {article.title}
        </a>
      </h2>
      <p className="mt-2 text-sm text-neutral-500">
        {article.points} points · by {article.author} · {postedOn} ·{" "}
        {isDemo ? (
          <span>Demo article</span>
        ) : (
          <a
            href={hnDiscussionUrl(article.hnId)}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-neutral-300 underline-offset-4 hover:text-brand-500 hover:decoration-brand-500"
          >
            {article.commentCount} comments on HN
          </a>
        )}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <Tag key={tag} label={tag} />
        ))}
      </div>

      <p className="mt-5 text-base leading-relaxed text-neutral-800">{article.summary}</p>

      <div className="mt-8 space-y-8 border-t border-brand-100 pt-8 text-[15px] leading-7 text-neutral-700">
        <section>
          <SectionTitle title="Why It Matters" />
          <p className="mt-3">{article.whyItMatters}</p>
        </section>

        <section>
          <SectionTitle title="What You'll Learn" note={article.difficulty} />
          <div className="mt-3 flex flex-wrap gap-2">
            {article.learnTopics.map((topic) => (
              <Tag key={topic} label={topic} />
            ))}
          </div>
          <p className="mt-4">{article.learningPath}</p>
        </section>

        <section>
          <SectionTitle title="Build Your Own" note={article.buildTimeEstimate} />
          <p className="mt-3 font-medium text-neutral-900">{article.buildTitle}</p>
          <p className="mt-2">{article.buildDescription}</p>
          <ListItems items={article.buildFeatures} />
          <p className="mt-4 text-sm text-neutral-500">
            <span className="font-medium text-neutral-700">Stack:</span> {article.buildStack.join(" · ")}
          </p>
        </section>
      </div>
    </article>
  );
}
