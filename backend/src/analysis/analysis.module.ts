import { Module } from '@nestjs/common';
import { ScannerModule } from './scanner/scanner.module.js';
import { StatisticsModule } from './statistics/statistics.module.js';
import { DependencyAnalysisController } from './dependencies/dependency-analysis.controller.js';
import { DependencyAnalysisService } from './dependencies/dependency-analysis.service.js';

@Module({
  imports: [ScannerModule, StatisticsModule],
  controllers: [DependencyAnalysisController],
  providers: [DependencyAnalysisService],
  exports: [DependencyAnalysisService],
})
export class AnalysisModule {}
