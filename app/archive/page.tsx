import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatWeek } from "@/lib/week";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const weeks = await prisma.article.groupBy({
    by: ["weekOf"],
    _count: { _all: true },
    orderBy: { weekOf: "desc" },
  });

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Archive</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Past weeks</h1>

      {weeks.length === 0 && <p className="mt-6 text-neutral-500">No past weeks yet.</p>}

      <ul className="mt-10 divide-y divide-brand-100 border-y border-brand-100">
        {weeks.map((week) => (
          <li key={week.weekOf}>
            <Link
              href={`/archive/${week.weekOf}`}
              className="flex items-center justify-between gap-4 py-5 transition-colors hover:bg-white hover:text-brand-500 sm:px-2"
            >
              <span className="font-medium">{formatWeek(week.weekOf)}</span>
              <span className="text-sm text-neutral-500">
                {week._count._all} {week._count._all === 1 ? "article" : "articles"} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
