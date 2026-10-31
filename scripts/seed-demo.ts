import { prisma } from "../lib/db";

// Demo articles use negative hnIds and older weeks, so they never collide with real Hacker News data.
const demoArticles = [
  {
    hnId: -1,
    weekOf: "2026-10-05",
    rank: 1,
    title: "Demo: How database indexes make queries fast",
    url: "https://www.postgresql.org/docs/current/indexes.html",
    author: "demo",
    points: 420,
    commentCount: 120,
    postedAt: new Date("2026-10-06T15:00:00Z"),
    summary:
      "This demo story explains how a database index lets PostgreSQL find rows without scanning the whole table. It compares B-tree indexes with full table scans and shows when an index does not help.",
    tags: ["Databases", "Performance"],
    whyItMatters:
      "Almost every web application stores its data in a relational database, and slow queries are one of the most common reasons an app feels sluggish. Developers often add features without thinking about how the database will search for rows, and everything works fine until the table grows to millions of records. In the discussion, commenters shared stories about pages that went from seconds to milliseconds after adding a single index, but they also warned that every index slows down writes and uses disk space. Understanding indexes helps you read query plans, choose the right columns to index, and talk with confidence about performance in code reviews and interviews.",
    learnTopics: ["SQL basics", "B-tree data structure", "Query planner", "EXPLAIN ANALYZE", "Write amplification"],
    difficulty: "Intermediate",
    learningPath:
      "Start by getting comfortable with basic SQL: SELECT, WHERE, JOIN, and ORDER BY on a small sample database. Next, learn how a B-tree works at a high level, because it explains why an index can find a value in a few steps instead of reading every row. Then run EXPLAIN and EXPLAIN ANALYZE on your own queries to see when PostgreSQL chooses a sequential scan or an index scan. After that, experiment with composite indexes and notice how column order changes which queries they can serve. Finally, measure insert and update speed with and without extra indexes, so you understand the trade-off between faster reads and slower writes.",
    buildTitle: "Query Speed Lab",
    buildDescription:
      "Build a small command-line tool that creates a PostgreSQL table, fills it with one million fake rows, and runs the same set of queries before and after adding different indexes. For each query, the tool records how long it took and saves the output of EXPLAIN ANALYZE, then prints a simple comparison table. This makes the effect of an index visible instead of abstract. You will practice generating test data, reading query plans, and writing clean scripts that talk to a database. The finished project is a great talking point in interviews, because you can explain exactly why one query became forty times faster and what it cost.",
    buildFeatures: [
      "Generate one million realistic fake rows",
      "Run a fixed set of benchmark queries",
      "Add and remove indexes automatically",
      "Save EXPLAIN ANALYZE output for each run",
      "Print a before/after timing table",
    ],
    buildStack: ["PostgreSQL", "Node.js", "TypeScript", "Docker"],
    buildTimeEstimate: "6-10 hours",
  },
  {
    hnId: -2,
    weekOf: "2026-10-05",
    rank: 2,
    title: "Demo: Rate limiting APIs with the token bucket algorithm",
    url: "https://en.wikipedia.org/wiki/Token_bucket",
    author: "demo",
    points: 310,
    commentCount: 85,
    postedAt: new Date("2026-10-08T09:30:00Z"),
    summary:
      "This demo story walks through the token bucket algorithm and how APIs use it to limit how many requests each client can make. It covers burst handling, refill rates, and storing counters in Redis.",
    tags: ["Backend", "Distributed Systems"],
    whyItMatters:
      "Any public API needs a way to protect itself from clients that send too many requests, whether by accident or on purpose. Without rate limiting, one buggy script can slow down the service for everyone or run up a large cloud bill. The token bucket is popular because it allows short bursts while still enforcing an average rate, which feels fair to real users. Commenters compared it with fixed windows and sliding logs, and pointed out that the hard part is not the algorithm itself but keeping counts consistent across many servers. Learning this pattern gives you a concrete example of how small algorithms solve real reliability problems in production systems.",
    learnTopics: ["HTTP status codes", "Token bucket algorithm", "Redis basics", "Atomic operations"],
    difficulty: "Beginner",
    learningPath:
      "Begin with how HTTP APIs work and what the 429 Too Many Requests status code means, including the Retry-After header. Then study the token bucket algorithm on paper: a bucket holds tokens, each request removes one, and tokens refill at a fixed rate. Implement it in memory for a single server so you can see bursts and refills in action. Next, learn the basics of Redis, especially keys with expiration and atomic increment commands. Finally, move your counters into Redis and think about what happens when two servers update the same bucket at the same moment, which introduces you to atomic operations and race conditions.",
    buildTitle: "Tiny Rate Limiter Service",
    buildDescription:
      "Create a small HTTP API with one protected endpoint and a token bucket rate limiter in front of it. Each client is identified by an API key, and the limiter returns a 429 response with a Retry-After header when the bucket is empty. Start with an in-memory version, then switch to Redis so several server processes share the same limits. Add a simple load-testing script that fires many requests and prints how many succeeded and how many were limited. This project teaches you middleware, HTTP semantics, and shared state, and it is small enough to finish in a weekend while still showing real backend skills.",
    buildFeatures: [
      "Token bucket middleware per API key",
      "429 responses with Retry-After header",
      "Redis-backed shared counters",
      "Load-testing script with a summary report",
    ],
    buildStack: ["Node.js", "TypeScript", "Redis", "Express"],
    buildTimeEstimate: "5-8 hours",
  },
  {
    hnId: -3,
    weekOf: "2026-10-12",
    rank: 1,
    title: "Demo: What really happens when you type a URL into your browser",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP",
    author: "demo",
    points: 530,
    commentCount: 160,
    postedAt: new Date("2026-10-13T18:00:00Z"),
    summary:
      "This demo story follows a single web request from the address bar to the rendered page. It covers DNS lookup, TCP and TLS handshakes, HTTP requests, and how the browser renders HTML and CSS.",
    tags: ["Networking", "Web"],
    whyItMatters:
      "Web developers use the browser every day, but many never look at the layers underneath a page load. When a site is slow or broken, the cause could be DNS, a TLS certificate, a redirect chain, a large JavaScript bundle, or a slow server, and you cannot debug what you do not understand. Commenters noted that this question is a classic interview topic precisely because it reveals how well someone understands the whole stack. They also shared tips for using browser developer tools to see each step. Understanding this flow helps you build faster sites, diagnose production issues, and explain trade-offs like caching and CDNs.",
    learnTopics: ["DNS", "TCP and TLS handshakes", "HTTP requests and responses", "Browser rendering pipeline", "Caching and CDNs"],
    difficulty: "Beginner",
    learningPath:
      "Start with DNS: learn how a domain name becomes an IP address and try the dig or nslookup commands yourself. Then study how TCP opens a connection and how TLS adds encryption and certificate checks on top of it. Next, read raw HTTP requests and responses using curl with the verbose flag, paying attention to headers, status codes, and redirects. After that, open your browser's developer tools and use the Network and Performance tabs to watch a real page load. Finally, learn how HTML, CSS, and JavaScript are parsed and rendered, and how caching and CDNs reduce the work for repeat visits.",
    buildTitle: "Page Load Inspector",
    buildDescription:
      "Build a command-line tool that takes a URL and reports what happens during the request, step by step. It resolves the domain with DNS, measures how long the TCP and TLS handshakes take, follows redirects, and prints the response status, important headers, and total download size. Add a summary at the end that highlights the slowest step and suggests a possible improvement, such as enabling compression or caching. This project makes networking concepts concrete, teaches you to use low-level Node.js modules, and produces a useful tool you can run against your own websites to understand their performance.",
    buildFeatures: [
      "DNS lookup timing",
      "TCP and TLS handshake timing",
      "Redirect chain tracking",
      "Header and size report",
      "Slowest-step summary with a tip",
    ],
    buildStack: ["Node.js", "TypeScript", "dns module", "tls module"],
    buildTimeEstimate: "6-8 hours",
  },
];

async function main() {
  for (const article of demoArticles) {
    const { hnId, weekOf, ...data } = article;
    await prisma.article.upsert({
      where: { hnId_weekOf: { hnId, weekOf } },
      create: article,
      update: data,
    });
    console.log(`Saved demo article ${hnId} for week ${weekOf}: ${article.title}`);
  }
  console.log(`Done. ${demoArticles.length} demo articles saved.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
