-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "hnId" INTEGER NOT NULL,
    "weekOf" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "author" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "commentCount" INTEGER NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "tags" TEXT[],
    "whyItMatters" TEXT NOT NULL,
    "learnTopics" TEXT[],
    "difficulty" TEXT NOT NULL,
    "learningPath" TEXT NOT NULL,
    "buildTitle" TEXT NOT NULL,
    "buildDescription" TEXT NOT NULL,
    "buildFeatures" TEXT[],
    "buildStack" TEXT[],
    "buildTimeEstimate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" TEXT NOT NULL,
    "weekOf" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Article_weekOf_idx" ON "Article"("weekOf");

-- CreateIndex
CREATE UNIQUE INDEX "Article_hnId_weekOf_key" ON "Article"("hnId", "weekOf");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_token_key" ON "Subscriber"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Newsletter_weekOf_key" ON "Newsletter"("weekOf");
