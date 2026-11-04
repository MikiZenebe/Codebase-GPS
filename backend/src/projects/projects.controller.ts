import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateGithubProjectDto } from './dto/create-github-project.dto.js';
import { GithubService } from './services/github.service.js';
import { RepositoryUploadService } from './services/repository-upload.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly repositoryUploadService: RepositoryUploadService,
    private readonly githubService: GithubService,
  ) {}

  // GET /api/projects
  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  // GET /api/projects/:id
  @Get(':id')
  findOne(@Param(':id') id: string) {
    return this.projectsService.findOne(id);
  }

  // POST /api/projects/upload
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
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
    return this.repositoryUploadService.uploadRepository(file, name);
  }

  // POST /api/projects/github
  @Post('github')
  importGithubRepository(@Body() dto: CreateGithubProjectDto) {
    return this.githubService.importRepository(dto.repositoryUrl, dto.branch);
  }
}
