import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { rm } from 'node:fs/promises';

import { PrismaService } from '../../prisma/prisma.service.js';
import { RepositoryUploadService } from '../services/repository-upload.service.js';

import { RepositoryScannerService } from '../../analysis/scanner/scanner.service.js';
import { ScannerPersistenceService } from '../../analysis/scanner/scanner-persistence.service.js';

interface RepositoryJobData {
  projectId: string;
  archivePath: string;
  source: 'ZIP_UPLOAD' | 'GITHUB';
}

@Injectable()
@Processor('repository-processing', {
  concurrency: 2,
})
export class RepositoryProcessor extends WorkerHost {
  private readonly logger = new Logger(RepositoryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repositoryUploadService: RepositoryUploadService,
    private readonly repositoryScannerService: RepositoryScannerService,
    private readonly scannerPersistenceService: ScannerPersistenceService,
  ) {
    super();
  }

  async process(job: Job<RepositoryJobData>) {
    const { projectId, archivePath } = job.data;

    this.logger.log(`Starting repository processing: ${projectId}`);

    try {
      // 1. Mark project as analyzing.
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: 'ANALYZING' },
      });

      await job.updateProgress(10);

      // 2. Extract the repository.
      await this.repositoryUploadService.processQueuedArchive(
        projectId,
        archivePath,
        async (progress) => {
          // Reserve 10–60% for extraction.
          const mappedProgress = 10 + Math.round(progress * 0.5);
          await job.updateProgress(mappedProgress);
        },
      );

      // 3. Retrieve the trusted extraction path from the database.
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          rootPath: true,
        },
      });

      if (!project?.rootPath) {
        throw new Error(
          `Extracted repository path not found for project ${projectId}`,
        );
      }

      await job.updateProgress(65);

      // 4. Scan repository structure.
      const scanResult = await this.repositoryScannerService.scanRepository(
        project.rootPath,
      );

      await job.updateProgress(85);

      // 5. Persist file and directory metadata.
      await this.scannerPersistenceService.persistScan(projectId, scanResult);

      // 6. Mark project as ready only after persistence succeeds.
      const readyProject = await this.prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'READY',
          fileCount: scanResult.totalFiles,
        },
        select: {
          id: true,
          fileCount: true,
          status: true,
        },
      });

      await job.updateProgress(100);

      this.logger.log(`Repository ready: ${projectId}`);

      // 7. Remove temporary archive after successful processing.
      await rm(archivePath, { force: true }).catch(() => {
        this.logger.warn(`Temporary archive cleanup failed: ${projectId}`);
      });

      return {
        projectId: readyProject.id,
        status: readyProject.status,
        fileCount: readyProject.fileCount,
      };
    } catch (error) {
      const maxAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

      if (isFinalAttempt) {
        await this.prisma.project.update({
          where: { id: projectId },
          data: { status: 'FAILED' },
        });

        await rm(archivePath, { force: true }).catch(() => {
          this.logger.warn(
            `Failed to clean up archive after failure: ${projectId}`,
          );
        });

        this.logger.error(
          `Repository processing permanently failed: ${projectId}`,
          error instanceof Error ? error.stack : String(error),
        );
      } else {
        await this.prisma.project.update({
          where: { id: projectId },
          data: {
            status: 'IMPORTING',
          },
        });

        this.logger.warn(
          `Repository processing failed. Retrying: ${projectId}`,
        );
      }

      throw error;
    }
  }
}
