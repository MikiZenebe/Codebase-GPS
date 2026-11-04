import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectQueryDto } from './dto/project-query.dto.js';
import { ProjectSource, ProjectStatus, Prisma } from '@prisma/client';
import { rename, rm } from 'node:fs/promises';

import path from 'node:path';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/projects
  async findAll(query: ProjectQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      ...(query.search && {
        name: {
          contains: query.search.trim(),
          mode: 'insensitive',
        },
      }),

      ...(query.source && {
        source: query.source,
      }),

      ...(query.status && {
        status: query.status,
      }),
    };

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.project.count({
        where,
      }),
    ]);

    return {
      data: projects,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  // GET /api/projects/:id
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  // GET /api/projects/stats
  async getStats() {
    const [
      total,
      ready,
      importing,
      uploading,
      analyzing,
      failed,
      sourceGroups,
    ] = await Promise.all([
      this.prisma.project.count(),

      this.prisma.project.count({
        where: { status: 'READY' },
      }),

      this.prisma.project.count({
        where: { status: 'IMPORTING' },
      }),

      this.prisma.project.count({
        where: { status: 'UPLOADING' },
      }),

      this.prisma.project.count({
        where: { status: 'ANALYZING' },
      }),

      this.prisma.project.count({
        where: { status: 'FAILED' },
      }),

      this.prisma.project.groupBy({
        by: ['source'],
        _count: {
          _all: true,
        },
      }),
    ]);

    return {
      total,
      ready,
      importing,
      uploading,
      analyzing,
      failed,

      sources: {
        ZIP_UPLOAD:
          sourceGroups.find((item) => item.source === 'ZIP_UPLOAD')?._count
            ._all ?? 0,

        GITHUB:
          sourceGroups.find((item) => item.source === 'GITHUB')?._count._all ??
          0,
      },
    };
  }

  // DELETE /api/projects/:id
  async remove(id: string) {
    const project = await this.findOne(id);

    if (project.status === ProjectStatus.ANALYZING) {
      throw new BadRequestException(
        'Cannot delete a repository while it is being analyzed',
      );
    }

    const storageRoot = path.resolve(
      process.cwd(),
      process.env.REPOSITORY_STORAGE_PATH ?? './storage/repositories',
    );

    // Never trust a database path for arbitrary filesystem deletion.
    const expectedPath = path.resolve(storageRoot, project.id);

    if (!project.rootPath || path.resolve(project.rootPath) !== expectedPath) {
      throw new BadRequestException('Repository storage path is invalid');
    }

    // Move files into temporary storage before deleting the record.
    // This allows us to restore the directory if database deletion fails.
    const trashPath = path.join(storageRoot, `.deleting-${project.id}`);

    let directoryMoved = false;

    try {
      await rename(expectedPath, trashPath);
      directoryMoved = true;
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw new InternalServerErrorException(
          'Could not prepare repository for deletion',
        );
      }
    }

    try {
      await this.prisma.project.delete({
        where: { id },
      });
    } catch {
      if (directoryMoved) {
        try {
          await rename(trashPath, expectedPath);
        } catch {
          // Recovery may require manual cleanup if the filesystem fails.
        }
      }

      throw new InternalServerErrorException('Could not delete repository');
    }

    // Database record is gone. Remove the quarantined directory.
    if (directoryMoved) {
      try {
        await rm(trashPath, {
          recursive: true,
          force: true,
        });
      } catch {
        // The project is deleted, but orphaned files need cleanup.
      }
    }

    return {
      message: 'Repository deleted successfully',
      id,
    };
  }
}
