import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProjectSource } from '@prisma/client';
import { rm } from 'node:fs/promises';

interface QueueRepositoryInput {
  archivePath: string;
  projectName: string;
  source: ProjectSource;
  repositoryUrl?: string;
  branch?: string;
}

@Injectable()
export class RepositoryQueueService {
  constructor(
    @InjectQueue('repository-processing')
    private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async enqueueArchive(input: QueueRepositoryInput) {
    const project = await this.prisma.project.create({
      data: {
        name: input.projectName,
        source: input.source,
        status: input.source === 'GITHUB' ? 'IMPORTING' : 'UPLOADING',
        repositoryUrl: input.repositoryUrl,
        branch: input.branch,
      },
    });

    try {
      const job = await this.queue.add(
        'process-repository',
        {
          projectId: project.id,
          archivePath: input.archivePath,
          source: input.source,
        },
        {
          jobId: project.id,

          attempts: 3,

          backoff: {
            type: 'exponential',
            delay: 2000,
          },

          removeOnComplete: {
            age: 86400,
            count: 1000,
          },

          removeOnFail: {
            age: 604800,
            count: 1000,
          },
        },
      );

      return {
        message: 'Repository queued for processing',
        project,
        jobId: job.id,
        status: 'QUEUED',
      };
    } catch {
      await this.prisma.project.update({
        where: {
          id: project.id,
        },
        data: {
          status: 'FAILED',
        },
      });

      await rm(input.archivePath, {
        force: true,
      });

      throw new InternalServerErrorException(
        'Could not queue repository processing job',
      );
    }
  }

  async getProgress(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return null;
    }

    const job = await this.queue.getJob(projectId);

    if (!job) {
      return {
        projectId,
        status: project.status,
        progress:
          project.status === 'READY' || project.status === 'FAILED' ? 100 : 0,
        queueState: 'NOT_FOUND',
      };
    }

    return {
      projectId,
      status: project.status,
      progress: job.progress,
      queueState: await job.getState(),
      attemptsMade: job.attemptsMade,
    };
  }
}
