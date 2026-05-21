-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SocialLinkType" AS ENUM ('link', 'qrcode');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "qq" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "stampImageUrl" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SocialLinkType" NOT NULL,
    "platformName" TEXT NOT NULL,
    "url" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "eventId" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_qq_key" ON "User"("qq");

-- CreateIndex
CREATE UNIQUE INDEX "User_token_key" ON "User"("token");

-- CreateIndex
CREATE INDEX "SocialLink_userId_idx" ON "SocialLink"("userId");

-- CreateIndex
CREATE INDEX "SocialLink_userId_sortOrder_idx" ON "SocialLink"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "Collection_userAId_idx" ON "Collection"("userAId");

-- CreateIndex
CREATE INDEX "Collection_userBId_idx" ON "Collection"("userBId");

-- CreateIndex
CREATE INDEX "Collection_eventId_idx" ON "Collection"("eventId");

-- CreateIndex
CREATE INDEX "Collection_collectedAt_idx" ON "Collection"("collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_userAId_userBId_eventId_key" ON "Collection"("userAId", "userBId", "eventId");

-- PostgreSQL treats NULL values as distinct in regular unique indexes.
-- This partial unique index prevents duplicate no-event collections.
CREATE UNIQUE INDEX "Collection_user_pair_null_event_unique"
ON "Collection"("userAId", "userBId")
WHERE "eventId" IS NULL;

-- Collection pairs are stored once, with the smaller user id in userAId.
ALTER TABLE "Collection"
ADD CONSTRAINT "Collection_user_order_check"
CHECK ("userAId" < "userBId");

-- MVP allows zero or one active event at a time.
CREATE UNIQUE INDEX "Event_only_one_active_unique"
ON "Event"("isActive")
WHERE "isActive" = true;

-- AddForeignKey
ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
