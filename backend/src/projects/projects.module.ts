import { Module } from '@nestjs/common';

import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { RepositoryUploadService } from './services/repository-upload.service.js';
import { GithubService } from './services/github.service.js';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, RepositoryUploadService, GithubService],
  exports: [ProjectsService, RepositoryUploadService, GithubService],
})
export class ProjectsModule {}
