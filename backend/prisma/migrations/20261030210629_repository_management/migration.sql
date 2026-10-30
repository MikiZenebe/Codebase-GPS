-- CreateEnum
CREATE TYPE "ProjectSource" AS ENUM ('ZIP_UPLOAD', 'GITHUB');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('UPLOADING', 'IMPORTING', 'READY', 'ANALYZING', 'FAILED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" "ProjectSource" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'UPLOADING',
    "repositoryUrl" TEXT,
    "branch" TEXT,
    "rootPath" TEXT,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");
