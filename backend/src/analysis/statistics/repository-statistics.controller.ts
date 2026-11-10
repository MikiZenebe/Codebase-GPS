import { Controller, Get, Param } from '@nestjs/common';

import { RepositoryStatisticsService } from './repository-statistics.service.js';

@Controller('projects')
export class RepositoryStatisticsController {
  constructor(
    private readonly statisticsService: RepositoryStatisticsService,
  ) {}

  @Get(':projectId/statistics')
  getProjectStatistics(@Param('projectId') projectId: string) {
    return this.statisticsService.getProjectStatistics(projectId);
  }
}
