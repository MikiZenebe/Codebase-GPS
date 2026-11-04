import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Octokit } from '@octokit/rest';

import { RepositoryUploadService } from './repository-upload.service.js';

@Injectable()
export class GithubService {
  private readonly octokit: Octokit;

  constructor(
    private readonly repositoryUploadService: RepositoryUploadService,
  ) {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || undefined,
      userAgent: 'Codebase-GPS',
    });
  }

  async importRepository(repositoryUrl: string, requestedBranch?: string) {
    const { owner, repo } = this.parseGithubUrl(repositoryUrl);

    try {
      // 1. Retrieve repository information.
      const repository = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      // 2. Determine which branch to download.
      const branch = requestedBranch || repository.data.default_branch;

      if (!branch) {
        throw new BadRequestException(
          'Repository does not have a default branch',
        );
      }

      // 3. Verify that the requested branch exists.
      try {
        await this.octokit.rest.repos.getBranch({
          owner,
          repo,
          branch,
        });
      } catch (error: any) {
        if (error.status === 404) {
          throw new BadRequestException(
            `Branch "${branch}" does not exist or is inaccessible`,
          );
        }

        throw error;
      }

      // 4. Download the repository ZIP archive.
      const response = await this.octokit.rest.repos.downloadZipballArchive({
        owner,
        repo,
        ref: branch,
      });

      // 5. Convert GitHub response into a Node.js Buffer.
      const archive = Buffer.isBuffer(response.data)
        ? Buffer.from(response.data)
        : Buffer.from(response.data as unknown as ArrayBuffer);

      // 6. Enforce compressed archive size limit.
      const maxSize =
        Number(process.env.MAX_UPLOAD_SIZE_MB ?? 50) * 1024 * 1024;

      if (archive.length > maxSize) {
        throw new BadRequestException(
          'GitHub repository archive exceeds the 50 MB limit',
        );
      }

      // 7. Reuse the existing ZIP import pipeline.
      return await this.repositoryUploadService.importArchive(
        archive,
        repository.data.name,
        {
          source: 'GITHUB',
          repositoryUrl: `https://github.com/${owner}/${repo}`,
          branch,
        },
      );
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (error.status === 401) {
        throw new UnauthorizedException(
          'GitHub authentication failed. Check your access token.',
        );
      }

      if (error.status === 404) {
        throw new NotFoundException(
          'GitHub repository not found or inaccessible',
        );
      }

      if (error.status === 403 || error.status === 429) {
        throw new BadRequestException(
          'GitHub API rate limit reached or repository access denied',
        );
      }

      throw new InternalServerErrorException(
        'Failed to import GitHub repository',
      );
    }
  }

  private parseGithubUrl(url: string): {
    owner: string;
    repo: string;
  } {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      throw new BadRequestException('Invalid GitHub repository URL');
    }

    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.hostname !== 'github.com' ||
      parsedUrl.port ||
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.search ||
      parsedUrl.hash
    ) {
      throw new BadRequestException(
        'Only standard HTTPS GitHub repository URLs are supported',
      );
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean);

    if (segments.length !== 2) {
      throw new BadRequestException(
        'Provide a URL in the format https://github.com/owner/repository',
      );
    }

    const [owner, repositoryName] = segments;

    const repo = repositoryName.replace(/\.git$/i, '');

    if (
      !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(owner) ||
      !/^[a-zA-Z0-9._-]+$/.test(repo) ||
      repo === '.' ||
      repo === '..'
    ) {
      throw new BadRequestException('Invalid GitHub owner or repository name');
    }

    return {
      owner,
      repo,
    };
  }
}
