import { Module } from '@nestjs/common';

import { RepositoryScannerService } from './scanner.service.js';
import { ScannerPersistenceService } from './scanner-persistence.service.js';

@Module({
  providers: [RepositoryScannerService, ScannerPersistenceService],
  exports: [RepositoryScannerService, ScannerPersistenceService],
})
export class ScannerModule {}
