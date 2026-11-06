import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

import { RepositoryFileNode, RepositoryScanResult } from './scanner.types.js';

@Injectable()
export class ScannerPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async persistScan(projectId: string, result: RepositoryScanResult) {
    const records: {
      projectId: string;
      name: string;
      path: string;
      type: 'FILE' | 'DIRECTORY';
      extension: string | null;
      language: string | null;
      size: bigint;
      modifiedAt: Date | null;
    }[] = [];

    const flatten = (nodes: RepositoryFileNode[]) => {
      for (const node of nodes) {
        records.push({
          projectId,
          name: node.name,
          path: node.path,
          type: node.type,
          extension: node.extension ?? null,
          language: node.language ?? null,
          size: BigInt(node.size),
          modifiedAt: node.modifiedAt ? new Date(node.modifiedAt) : null,
        });

        if (node.children?.length) {
          flatten(node.children);
        }
      }
    };

    flatten(result.tree);

    await this.prisma.$transaction(async (tx) => {
      // Remove previous scan results.
      await tx.repositoryFile.deleteMany({
        where: { projectId },
      });

      // Insert new scan results in batches.
      const batchSize = 1000;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        await tx.repositoryFile.createMany({
          data: batch,
        });
      }

      // Update repository file count.
      await tx.project.update({
        where: { id: projectId },
        data: {
          fileCount: result.totalFiles,
        },
      });
    });

    return {
      projectId,
      totalFiles: result.totalFiles,
      totalDirectories: result.totalDirectories,
      totalSize: result.totalSize,
      scannedAt: result.scannedAt,
      truncated: result.truncated,
    };
  }
}
