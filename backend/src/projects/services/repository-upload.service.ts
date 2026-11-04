import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

import AdmZip from 'adm-zip';

import { mkdir, writeFile, rm } from 'node:fs/promises';

import path from 'node:path';

@Injectable()
export class RepositoryUploadService {
  private readonly maxFiles = 10_000;
  private readonly maxExtractedSize = 500 * 1024 * 1024;
  private readonly maxSingleFileSize = 25 * 1024 * 1024;

  constructor(private readonly prisma: PrismaService) {}

  async uploadRepository(file: Express.Multer.File, projectName?: string) {
    if (!file) {
      throw new BadRequestException('ZIP file is required');
    }

    if (
      path.extname(file.originalname).toLowerCase() !== '.zip' ||
      !this.isZipFile(file.buffer)
    ) {
      throw new BadRequestException('Invalid ZIP file');
    }

    const name =
      projectName?.trim() || path.basename(file.originalname, '.zip');

    return this.importArchive(file.buffer, name, {
      source: 'ZIP_UPLOAD',
    });
  }

  async importArchive(
    buffer: Buffer,
    projectName: string,
    metadata: {
      source: 'ZIP_UPLOAD' | 'GITHUB';
      repositoryUrl?: string;
      branch?: string;
    },
  ) {
    if (!buffer || !this.isZipFile(buffer)) {
      throw new BadRequestException('Invalid ZIP archive');
    }

    const project = await this.prisma.project.create({
      data: {
        name: projectName,
        source: metadata.source,
        status: metadata.source === 'GITHUB' ? 'IMPORTING' : 'UPLOADING',
        repositoryUrl: metadata.repositoryUrl,
        branch: metadata.branch,
      },
    });

    const storageRoot = path.resolve(
      process.cwd(),
      process.env.REPOSITORY_STORAGE_PATH ?? './storage/repositories',
    );

    const projectPath = path.join(storageRoot, project.id);

    try {
      await mkdir(projectPath, {
        recursive: true,
      });

      const fileCount = await this.extractZip(buffer, projectPath);

      if (fileCount === 0) {
        throw new BadRequestException('Repository contains no files');
      }

      const updatedProject = await this.prisma.project.update({
        where: {
          id: project.id,
        },
        data: {
          status: 'READY',
          rootPath: projectPath,
          fileCount,
        },
      });

      return {
        message: 'Repository imported successfully',
        project: updatedProject,
      };
    } catch (error) {
      await rm(projectPath, {
        recursive: true,
        force: true,
      });

      await this.prisma.project.update({
        where: {
          id: project.id,
        },
        data: {
          status: 'FAILED',
        },
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to import repository');
    }
  }

  private isZipFile(buffer: Buffer): boolean {
    if (buffer.length < 4) {
      return false;
    }

    const signature = buffer.subarray(0, 4).toString('hex');

    // Local file header, empty archive, or spanning signature.
    return ['504b0304', '504b0506', '504b0708'].includes(signature);
  }

  private async extractZip(
    buffer: Buffer,
    destination: string,
  ): Promise<number> {
    let zip: AdmZip;

    try {
      zip = new AdmZip(buffer);
    } catch {
      throw new BadRequestException('Unable to read ZIP archive');
    }

    const entries = zip.getEntries();

    if (entries.length > this.maxFiles) {
      throw new BadRequestException('ZIP archive contains too many entries');
    }

    let totalExtractedSize = 0;
    let fileCount = 0;

    for (const entry of entries) {
      const entryName = entry.entryName;

      // Normalize Windows and Unix paths.
      const normalizedName = entryName.replace(/\\/g, '/');

      // Reject unsafe paths.
      if (
        normalizedName.includes('\0') ||
        normalizedName.startsWith('/') ||
        /^[a-zA-Z]:/.test(normalizedName) ||
        normalizedName.split('/').includes('..')
      ) {
        throw new BadRequestException('ZIP contains an unsafe file path');
      }

      // Resolve and verify destination.
      const targetPath = path.resolve(destination, normalizedName);

      if (
        !targetPath.startsWith(destination + path.sep) &&
        targetPath !== destination
      ) {
        throw new BadRequestException(
          'ZIP contains an invalid extraction path',
        );
      }

      // Reject symbolic links.
      const unixMode = (entry.header.attr >>> 16) & 0o170000;

      if (unixMode === 0o120000) {
        throw new BadRequestException('Symbolic links are not allowed');
      }

      if (entry.isDirectory) {
        await mkdir(targetPath, {
          recursive: true,
        });

        continue;
      }

      const declaredSize = entry.header.size;

      if (
        !Number.isSafeInteger(declaredSize) ||
        declaredSize < 0 ||
        declaredSize > this.maxSingleFileSize
      ) {
        throw new BadRequestException(
          'ZIP contains an invalid or oversized file',
        );
      }

      totalExtractedSize += declaredSize;

      if (totalExtractedSize > this.maxExtractedSize) {
        throw new BadRequestException('Extracted repository exceeds 500 MB');
      }

      // Decompress one entry at a time.
      let data: Buffer;

      try {
        data = entry.getData();
      } catch {
        throw new BadRequestException('Unable to extract ZIP entry');
      }

      // Verify actual decompressed size.
      if (data.length !== declaredSize) {
        throw new BadRequestException('ZIP entry size validation failed');
      }

      if (data.length > this.maxSingleFileSize) {
        throw new BadRequestException('ZIP contains an oversized file');
      }

      const parentDirectory = path.dirname(targetPath);

      await mkdir(parentDirectory, {
        recursive: true,
      });

      // wx prevents overwriting duplicate archive paths.
      try {
        await writeFile(targetPath, data, {
          flag: 'wx',
          mode: 0o600,
        });
      } catch {
        throw new BadRequestException(
          'ZIP contains duplicate or invalid file paths',
        );
      }

      fileCount++;
    }

    return fileCount;
  }
}
