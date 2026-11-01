import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import { prisma } from "@/lib/db";
import { formatWeek } from "@/lib/week";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const latest = await prisma.article.findFirst({ orderBy: { weekOf: "desc" }, select: { weekOf: true } });

  if (!latest) {
    return <p className="text-neutral-500">No articles yet. Check back after the weekly update.</p>;
  }

  const articles = await prisma.article.findMany({
    where: { weekOf: latest.weekOf },
    orderBy: { rank: "asc" },
  });

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Learn from Hacker News</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-neutral-500">
        An AI-powered weekly developer learning dashboard. Every week we pick the most interesting tech stories from
        Hacker News and turn them into study notes: why each story matters, what you need to learn to understand it, and
        a small project you can build yourself.
      </p>

      <p className="mt-12 text-xs font-medium uppercase tracking-widest text-neutral-500">This week</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{formatWeek(latest.weekOf)}</h2>
      <p className="mt-3 max-w-xl leading-relaxed text-neutral-500">
        Picked from the 200 highest-scoring Hacker News stories posted this week (UTC), with AI-generated study notes.
      </p>

      <div className="mt-10 space-y-10">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      <div className="mt-12">
        <Link
          href="/archive"
          className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
        >
          Browse past weeks
        </Link>
      </div>
    </div>
  );
}
