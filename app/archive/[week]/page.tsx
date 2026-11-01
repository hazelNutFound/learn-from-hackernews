import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import { prisma } from "@/lib/db";
import { formatWeek } from "@/lib/week";

export const dynamic = "force-dynamic";

type WeekPageProps = {
  params: Promise<{ week: string }>;
};

export default async function WeekPage({ params }: WeekPageProps) {
  const { week } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) {
    notFound();
  }

  const articles = await prisma.article.findMany({
    where: { weekOf: week },
    orderBy: { rank: "asc" },
  });
  if (articles.length === 0) {
    notFound();
  }

  return (
    <div>
      <Link href="/archive" className="text-sm text-neutral-500 transition-colors hover:text-brand-500">
        ← All weeks
      </Link>
      <p className="mt-8 text-xs font-medium uppercase tracking-widest text-neutral-500">Week of</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{formatWeek(week)}</h1>
      <p className="mt-3 text-neutral-500">
        {articles.length} {articles.length === 1 ? "article" : "articles"}
      </p>

      <div className="mt-10 space-y-10">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
