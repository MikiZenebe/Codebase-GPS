import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class RepositoryStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectStatistics(projectId: string) {
    // 1. Verify that the project exists.
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        fileCount: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // 2. Count files and directories.
    const [totalFiles, totalDirectories] = await Promise.all([
      this.prisma.repositoryFile.count({
        where: {
          projectId,
          type: 'FILE',
        },
      }),

      this.prisma.repositoryFile.count({
        where: {
          projectId,
          type: 'DIRECTORY',
        },
      }),
    ]);

    // 3. Calculate total repository size.
    const sizeResult = await this.prisma.repositoryFile.aggregate({
      where: {
        projectId,
        type: 'FILE',
      },
      _sum: {
        size: true,
      },
    });

    const totalSizeBytes = sizeResult._sum.size ?? BigInt(0);

    // 4. Group files by programming language.
    const languageGroups = await this.prisma.repositoryFile.groupBy({
      by: ['language'],
      where: {
        projectId,
        type: 'FILE',
      },
      _count: {
        _all: true,
      },
      _sum: {
        size: true,
      },
    });

    const languages = languageGroups
      .map((group) => {
        const language = group.language ?? 'Unknown';
        const fileCount = group._count._all;

        return {
          language,
          fileCount,
          percentage:
            totalFiles > 0
              ? Number(((fileCount / totalFiles) * 100).toFixed(2))
              : 0,
          sizeBytes: (group._sum.size ?? BigInt(0)).toString(),
        };
      })
      .sort((a, b) => b.fileCount - a.fileCount);

    // 5. Group files by extension.
    const extensionGroups = await this.prisma.repositoryFile.groupBy({
      by: ['extension'],
      where: {
        projectId,
        type: 'FILE',
      },
      _count: {
        _all: true,
      },
      _sum: {
        size: true,
      },
    });

    const extensions = extensionGroups
      .map((group) => ({
        extension: group.extension ?? '(no extension)',
        fileCount: group._count._all,
        sizeBytes: (group._sum.size ?? BigInt(0)).toString(),
      }))
      .sort((a, b) => b.fileCount - a.fileCount);

    // 6. Return statistics.
    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
      },

      overview: {
        totalFiles,
        totalDirectories,
        totalSizeBytes: totalSizeBytes.toString(),
      },

      languages,
      extensions,

      generatedAt: new Date().toISOString(),
    };
  }
}
