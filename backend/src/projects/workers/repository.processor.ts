import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RepositoryUploadService } from '../services/repository-upload.service.js';

import { rm } from 'node:fs/promises';

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
  ) {
    super();
  }

  async process(job: Job<RepositoryJobData>) {
    const { projectId, archivePath, source } = job.data;

    this.logger.log(`Starting repository processing: ${projectId}`);

    try {
      // Update project status.
      await this.prisma.project.update({
        where: {
          id: projectId,
        },
        data: {
          status: 'ANALYZING',
        },
      });

      await job.updateProgress(10);

      // Extract repository.
      const project = await this.repositoryUploadService.processQueuedArchive(
        projectId,
        archivePath,
        async (progress) => {
          await job.updateProgress(progress);
        },
      );

      await job.updateProgress(100);

      this.logger.log(`Repository ready: ${projectId}`);

      // Archive is no longer needed.
      await rm(archivePath, {
        force: true,
      }).catch(() => {
        this.logger.warn(`Temporary archive cleanup failed: ${projectId}`);
      });

      return {
        projectId,
        status: 'READY',
        fileCount: project.fileCount,
      };
    } catch (error) {
      const maxAttempts = job.opts.attempts ?? 1;

      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

      if (isFinalAttempt) {
        await this.prisma.project.update({
          where: {
            id: projectId,
          },
          data: {
            status: 'FAILED',
          },
        });

        await rm(archivePath, {
          force: true,
        });

        this.logger.error(
          `Repository processing permanently failed: ${projectId}`,
        );
      } else {
        await this.prisma.project.update({
          where: {
            id: projectId,
          },
          data: {
            status: source === 'GITHUB' ? 'IMPORTING' : 'UPLOADING',
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
