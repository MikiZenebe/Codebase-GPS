import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateGithubProjectDto } from './dto/create-github-project.dto.js';
import { GithubService } from './services/github.service.js';
import { RepositoryUploadService } from './services/repository-upload.service.js';
import { ProjectQueryDto } from './dto/project-query.dto.js';
import { RepositoryQueueService } from './services/repository-queue.service.js';
import { diskStorage } from 'multer';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly repositoryUploadService: RepositoryUploadService,
    private readonly githubService: GithubService,
    private readonly repositoryQueueService: RepositoryQueueService,
  ) {}

  // GET /api/projects
  @Get()
  findAll(@Query() query: ProjectQueryDto) {
    return this.projectsService.findAll(query);
  }

  // GET /api/projects/stats
  @Get('stats')
  getStats() {
    return this.projectsService.getStats();
  }

  // GET /api/projects/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  // DELETE /api/projects/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  // POST /api/projects/upload
  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadDirectory = path.join(tmpdir(), 'codebase-gps-uploads');

          mkdirSync(uploadDirectory, {
            recursive: true,
          });

          callback(null, uploadDirectory);
        },

        filename: (_req, _file, callback) => {
          callback(null, `${randomUUID()}.zip`);
        },
      }),
      limits: {
        fileSize: Number(process.env.MAX_UPLOAD_SIZE_MB ?? 50) * 1024 * 1024,
        files: 1,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.originalname.toLowerCase().endsWith('.zip')) {
          return callback(
            new BadRequestException('Only ZIP files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  uploadRepository(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name?: string,
  ) {
    if (!file) {
      throw new BadRequestException('ZIP file is required');
    }

    const projectName =
      name?.trim() || path.basename(file.originalname, '.zip');

    if (!projectName || projectName.length > 100) {
      throw new BadRequestException('Invalid project name');
    }

    return this.repositoryQueueService.enqueueArchive({
      archivePath: file.path,
      projectName,
      source: 'ZIP_UPLOAD',
    });
  }

  // POST /api/projects/github
  @Post('github')
  importGithubRepository(@Body() dto: CreateGithubProjectDto) {
    return this.githubService.importRepository(dto.repositoryUrl, dto.branch);
  }

  // GET /api/projects/:id/progress
  @Get(':id/progress')
  async getProgress(@Param('id') id: string) {
    const progress = await this.repositoryQueueService.getProgress(id);

    if (!progress) {
      throw new NotFoundException('Project not found');
    }

    return progress;
  }
}
