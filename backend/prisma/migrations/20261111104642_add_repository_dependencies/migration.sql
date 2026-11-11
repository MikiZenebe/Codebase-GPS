-- CreateEnum
CREATE TYPE "DependencyKind" AS ENUM ('IMPORT', 'EXPORT', 'REQUIRE', 'DYNAMIC_IMPORT');

-- CreateTable
CREATE TABLE "RepositoryDependency" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    "targetFileId" TEXT,
    "specifier" TEXT NOT NULL,
    "kind" "DependencyKind" NOT NULL,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "packageName" TEXT,
    "line" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositoryDependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepositoryDependency_projectId_idx" ON "RepositoryDependency"("projectId");

-- CreateIndex
CREATE INDEX "RepositoryDependency_sourceFileId_idx" ON "RepositoryDependency"("sourceFileId");

-- CreateIndex
CREATE INDEX "RepositoryDependency_targetFileId_idx" ON "RepositoryDependency"("targetFileId");

-- CreateIndex
CREATE INDEX "RepositoryDependency_projectId_isExternal_idx" ON "RepositoryDependency"("projectId", "isExternal");

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryDependency_projectId_sourceFileId_specifier_kind__key" ON "RepositoryDependency"("projectId", "sourceFileId", "specifier", "kind", "line");

-- AddForeignKey
ALTER TABLE "RepositoryDependency" ADD CONSTRAINT "RepositoryDependency_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryDependency" ADD CONSTRAINT "RepositoryDependency_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "RepositoryFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryDependency" ADD CONSTRAINT "RepositoryDependency_targetFileId_fkey" FOREIGN KEY ("targetFileId") REFERENCES "RepositoryFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
