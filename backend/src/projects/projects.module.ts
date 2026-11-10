import { Module } from '@nestjs/common';

import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { RepositoryUploadService } from './services/repository-upload.service.js';
import { GithubService } from './services/github.service.js';
import { RepositoryQueueService } from './services/repository-queue.service.js';
import { BullModule } from '@nestjs/bullmq';
import { RepositoryProcessor } from './workers/repository.processor.js';
import { ScannerModule } from '../analysis/scanner/scanner.module.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'repository-processing',
    }),
    ScannerModule,
  ],

  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    RepositoryUploadService,
    GithubService,
    RepositoryQueueService,
    RepositoryProcessor,
  ],
  exports: [
    ProjectsService,
    RepositoryUploadService,
    GithubService,
    RepositoryQueueService,
    RepositoryProcessor,
  ],
})
export class ProjectsModule {}
