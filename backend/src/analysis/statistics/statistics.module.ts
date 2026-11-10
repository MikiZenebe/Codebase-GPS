import { Module } from '@nestjs/common';

import { RepositoryStatisticsService } from './repository-statistics.service.js';
import { RepositoryStatisticsController } from './repository-statistics.controller.js';

@Module({
  controllers: [RepositoryStatisticsController],
  providers: [RepositoryStatisticsService],
  exports: [RepositoryStatisticsService],
})
export class StatisticsModule {}
