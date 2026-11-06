import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { lstat, readdir } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';

import { RepositoryFileNode, RepositoryScanResult } from './scanner.types.js';

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  '.output',
  'dist',
  'build',
  'coverage',
  '.cache',
  '.turbo',
  '.vercel',
  '.idea',
  '.vscode',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  'vendor',
  'target',
  'venv',
  '.venv',
]);

const IGNORED_FILES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);

const SENSITIVE_FILE_PATTERNS = [
  /^\.env($|\.)/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /credentials/i,
  /secrets?/i,
];

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.py': 'Python',
  '.java': 'Java',
  '.php': 'PHP',
  '.go': 'Go',
  '.rs': 'Rust',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.c': 'C',
  '.h': 'C',
  '.cs': 'C#',
  '.rb': 'Ruby',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.dart': 'Dart',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.json': 'JSON',
  '.md': 'Markdown',
  '.sql': 'SQL',
  '.sh': 'Shell',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.xml': 'XML',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
};

@Injectable()
export class RepositoryScannerService {
  private readonly logger = new Logger(RepositoryScannerService.name);

  private readonly MAX_FILES = 50000;
  private readonly MAX_DEPTH = 30;

  async scanRepository(repositoryPath: string): Promise<RepositoryScanResult> {
    if (!repositoryPath?.trim()) {
      throw new BadRequestException('Repository path is required.');
    }

    const rootPath = resolve(repositoryPath);

    let rootStats;

    try {
      rootStats = await lstat(rootPath);
    } catch {
      throw new BadRequestException('Repository directory does not exist.');
    }

    if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
      throw new BadRequestException('Invalid repository directory.');
    }

    const stats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      truncated: false,
    };

    this.logger.log('Starting repository scan.');

    const tree = await this.scanDirectory(rootPath, rootPath, 0, stats);

    return {
      rootPath,
      tree,
      totalFiles: stats.totalFiles,
      totalDirectories: stats.totalDirectories,
      totalSize: stats.totalSize,
      scannedAt: new Date().toISOString(),
      truncated: stats.truncated,
    };
  }

  private async scanDirectory(
    currentPath: string,
    rootPath: string,
    depth: number,
    stats: {
      totalFiles: number;
      totalDirectories: number;
      totalSize: number;
      truncated: boolean;
    },
  ): Promise<RepositoryFileNode[]> {
    if (depth > this.MAX_DEPTH) {
      stats.truncated = true;
      return [];
    }

    let entries;

    try {
      entries = await readdir(currentPath, {
        withFileTypes: true,
      });
    } catch {
      this.logger.warn('Unable to read a repository directory.');
      return [];
    }

    const nodes: RepositoryFileNode[] = [];

    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;

      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      if (stats.totalFiles >= this.MAX_FILES) {
        stats.truncated = true;
        break;
      }

      const name = entry.name;

      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(name)) {
        continue;
      }

      if (
        IGNORED_FILES.has(name) ||
        SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(name))
      ) {
        continue;
      }

      if (entry.isSymbolicLink()) {
        continue;
      }

      const absolutePath = resolve(currentPath, name);

      const relativePath = relative(rootPath, absolutePath)
        .split(sep)
        .join('/');

      try {
        const fileStats = await lstat(absolutePath);

        if (fileStats.isSymbolicLink()) {
          continue;
        }

        if (fileStats.isDirectory()) {
          stats.totalDirectories++;

          const children = await this.scanDirectory(
            absolutePath,
            rootPath,
            depth + 1,
            stats,
          );

          nodes.push({
            name,
            path: relativePath,
            type: 'DIRECTORY',
            size: 0,
            modifiedAt: fileStats.mtime.toISOString(),
            children,
          });
        } else if (fileStats.isFile()) {
          stats.totalFiles++;
          stats.totalSize += fileStats.size;

          const extension = extname(name).toLowerCase();

          nodes.push({
            name,
            path: relativePath,
            type: 'FILE',
            extension,
            language: LANGUAGE_MAP[extension] || 'Unknown',
            size: fileStats.size,
            modifiedAt: fileStats.mtime.toISOString(),
          });
        }
      } catch {
        this.logger.warn('Skipping an inaccessible repository entry.');
      }
    }

    return nodes;
  }
}
