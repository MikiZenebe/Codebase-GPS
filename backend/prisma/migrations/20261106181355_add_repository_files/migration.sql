-- CreateEnum
CREATE TYPE "RepositoryFileType" AS ENUM ('FILE', 'DIRECTORY');

-- CreateTable
CREATE TABLE "RepositoryFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "type" "RepositoryFileType" NOT NULL,
    "extension" TEXT,
    "language" TEXT,
    "size" BIGINT NOT NULL DEFAULT 0,
    "modifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositoryFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepositoryFile_projectId_idx" ON "RepositoryFile"("projectId");

-- CreateIndex
CREATE INDEX "RepositoryFile_projectId_type_idx" ON "RepositoryFile"("projectId", "type");

-- CreateIndex
CREATE INDEX "RepositoryFile_projectId_language_idx" ON "RepositoryFile"("projectId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryFile_projectId_path_key" ON "RepositoryFile"("projectId", "path");

-- AddForeignKey
ALTER TABLE "RepositoryFile" ADD CONSTRAINT "RepositoryFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
