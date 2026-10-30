import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learn from Hacker News",
  description: "Weekly top Hacker News stories, explained: why they matter, what to learn, and what to build.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-5">
            <Link href="/" className="text-xl font-bold">
              <span className="text-orange-500">Learn</span> from Hacker News
            </Link>
            <p className="mt-1 text-sm text-gray-600">Top tech stories of the week, and what you can learn from them.</p>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-3xl px-4 pb-8 text-sm text-gray-500">
          Data from the Hacker News API (via Algolia and Firebase).
        </footer>
      </body>
    </html>
  );
}
