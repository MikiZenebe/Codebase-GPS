import { Module } from '@nestjs/common';
import { ScannerModule } from './scanner/scanner.module.js';
import { StatisticsModule } from './statistics/statistics.module.js';

@Module({
  imports: [ScannerModule, StatisticsModule],
})
export class AnalysisModule {}
