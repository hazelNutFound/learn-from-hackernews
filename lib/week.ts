const DAY_MS = 24 * 60 * 60 * 1000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// weekOf is the Monday of the last full Monday–Sunday week (UTC), i.e. the week the articles cover.
// Running on Mon 2026-11-02 gives "2026-10-26" (articles from Oct 26 to Nov 1).
export function weekOf(now: Date = new Date()): string {
  const daysSinceMonday = (now.getUTCDay() + 6) % 7;
  const thisMonday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday);
  return toDateString(new Date(thisMonday - 7 * DAY_MS));
}

export function weekRange(week: string): { start: Date; end: Date } {
  const start = new Date(`${week}T00:00:00Z`);
  const end = new Date(start.getTime() + 7 * DAY_MS);
  return { start, end };
}

export function formatWeek(week: string): string {
  const { start } = weekRange(week);
  const last = new Date(start.getTime() + 6 * DAY_MS);

  const startMonth = MONTHS[start.getUTCMonth()];
  const lastMonth = MONTHS[last.getUTCMonth()];
  const startYear = start.getUTCFullYear();
  const lastYear = last.getUTCFullYear();

  if (startYear !== lastYear) {
    return `${startMonth} ${start.getUTCDate()}, ${startYear} – ${lastMonth} ${last.getUTCDate()}, ${lastYear}`;
  }
  if (startMonth !== lastMonth) {
    return `${startMonth} ${start.getUTCDate()} – ${lastMonth} ${last.getUTCDate()}, ${lastYear}`;
  }
  return `${startMonth} ${start.getUTCDate()}–${last.getUTCDate()}, ${lastYear}`;
}
