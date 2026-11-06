import { Module } from '@nestjs/common';
import { ScannerModule } from './scanner/scanner.module.js';

@Module({
  imports: [ScannerModule],
})
export class AnalysisModule {}
