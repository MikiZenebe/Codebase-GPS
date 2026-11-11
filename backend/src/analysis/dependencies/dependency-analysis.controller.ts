import { Controller, Get, Post, Param } from '@nestjs/common';
import { DependencyAnalysisService } from './dependency-analysis.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Controller('projects/:projectId/dependencies')
export class DependencyAnalysisController {
  constructor(
    private readonly dependencyAnalysisService: DependencyAnalysisService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('analyze')
  async analyze(@Param('projectId') projectId: string) {
    return this.dependencyAnalysisService.analyzeProject(projectId);
  }

  @Get()
  async getDependencies(@Param('projectId') projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return {
        message: 'Project not found',
      };
    }

    const dependencies = await this.prisma.repositoryDependency.findMany({
      where: { projectId },
      include: {
        sourceFile: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        targetFile: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
      orderBy: {
        sourceFile: {
          path: 'asc',
        },
      },
    });

    const internal = dependencies.filter(
      (item) => !item.isExternal && item.targetFileId,
    ).length;

    const external = dependencies.filter((item) => item.isExternal).length;

    const unresolved = dependencies.filter(
      (item) => !item.isExternal && !item.targetFileId,
    ).length;

    return {
      projectId,
      summary: {
        total: dependencies.length,
        internal,
        external,
        unresolved,
      },
      dependencies,
    };
  }
}
