import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

import * as ts from 'typescript';

import { readFile } from 'node:fs/promises';

import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';

import type {
  DetectedDependency,
  DependencyKind,
  DependencyAnalysisResult,
} from './dependency.types.js';

const SUPPORTED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs',
]);

const RESOLUTION_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs',
  '.json',
];

interface ScannedFile {
  id: string;
  path: string;
}

@Injectable()
export class DependencyAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async analyzeProject(projectId: string): Promise<DependencyAnalysisResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        rootPath: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!project.rootPath) {
      throw new BadRequestException('Repository storage path is missing');
    }

    const rootPath = resolve(project.rootPath);

    const files = await this.prisma.repositoryFile.findMany({
      where: {
        projectId,
        type: 'FILE',
        extension: {
          in: [...SUPPORTED_EXTENSIONS],
        },
      },
      select: {
        id: true,
        path: true,
      },
    });

    const fileMap = new Map<string, string>();

    for (const file of files) {
      fileMap.set(this.normalizePath(file.path), file.id);
    }

    const dependencies: DetectedDependency[] = [];

    for (const file of files) {
      const absolutePath = resolve(rootPath, file.path);
      const relativePath = relative(rootPath, absolutePath);

      // Prevent reading outside the repository.
      if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
        continue;
      }

      let sourceCode: string;

      try {
        sourceCode = await readFile(absolutePath, 'utf8');
      } catch {
        // Files may have disappeared since scanning.
        continue;
      }

      const detected = this.extractDependencies(
        sourceCode,
        file,
        rootPath,
        fileMap,
      );

      dependencies.push(...detected);
    }

    // Replace previous dependency records.
    await this.prisma.$transaction(async (transaction) => {
      await transaction.repositoryDependency.deleteMany({
        where: { projectId },
      });

      const BATCH_SIZE = 1000;

      for (let index = 0; index < dependencies.length; index += BATCH_SIZE) {
        await transaction.repositoryDependency.createMany({
          data: dependencies
            .slice(index, index + BATCH_SIZE)
            .map((dependency) => ({
              projectId,
              ...dependency,
            })),
        });
      }
    });

    const internalDependencies = dependencies.filter(
      (item) => !item.isExternal && item.targetFileId,
    ).length;

    const externalDependencies = dependencies.filter(
      (item) => item.isExternal,
    ).length;

    const unresolvedDependencies = dependencies.filter(
      (item) => !item.isExternal && !item.targetFileId,
    ).length;

    return {
      projectId,
      totalDependencies: dependencies.length,
      internalDependencies,
      externalDependencies,
      unresolvedDependencies,
      analyzedFiles: files.length,
    };
  }

  private extractDependencies(
    sourceCode: string,
    file: ScannedFile,
    rootPath: string,
    fileMap: Map<string, string>,
  ): DetectedDependency[] {
    const extension = extname(file.path).toLowerCase();

    const scriptKind =
      extension === '.tsx'
        ? ts.ScriptKind.TSX
        : extension === '.jsx'
          ? ts.ScriptKind.JSX
          : ['.js', '.mjs', '.cjs'].includes(extension)
            ? ts.ScriptKind.JS
            : ts.ScriptKind.TS;

    const sourceFile = ts.createSourceFile(
      file.path,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    );

    const results: DetectedDependency[] = [];

    const addDependency = (
      specifier: string,
      kind: DependencyKind,
      node: ts.Node,
    ) => {
      const line =
        sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
          .line + 1;

      const isRelative =
        specifier.startsWith('./') ||
        specifier.startsWith('../') ||
        specifier.startsWith('/');

      const isAlias =
        specifier.startsWith('@/') ||
        specifier.startsWith('~/') ||
        specifier.startsWith('#');

      const isExternal = !isRelative && !isAlias;

      const targetFileId = isRelative
        ? this.resolveImport(specifier, file.path, rootPath, fileMap)
        : null;

      results.push({
        sourceFileId: file.id,
        targetFileId,
        specifier,
        kind,
        isExternal,
        packageName: isExternal ? this.getPackageName(specifier) : null,
        line,
      });
    };

    const visit = (node: ts.Node) => {
      // import ... from "module"
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteralLike(node.moduleSpecifier)
      ) {
        addDependency(node.moduleSpecifier.text, 'IMPORT', node);
      }

      // export ... from "module"
      if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier &&
        ts.isStringLiteralLike(node.moduleSpecifier)
      ) {
        addDependency(node.moduleSpecifier.text, 'EXPORT', node);
      }

      // require("module") and import("module")
      if (ts.isCallExpression(node)) {
        const argument = node.arguments[0];

        if (argument && ts.isStringLiteralLike(argument)) {
          if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
            addDependency(argument.text, 'DYNAMIC_IMPORT', node);
          } else if (
            ts.isIdentifier(node.expression) &&
            node.expression.text === 'require'
          ) {
            addDependency(argument.text, 'REQUIRE', node);
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return results;
  }

  private resolveImport(
    specifier: string,
    sourcePath: string,
    rootPath: string,
    fileMap: Map<string, string>,
  ): string | null {
    const sourceDirectory = dirname(sourcePath);

    const basePath = resolve(rootPath, sourceDirectory, specifier);

    const candidates = [basePath];

    // Support imports without extensions.
    if (!extname(basePath)) {
      for (const extension of RESOLUTION_EXTENSIONS) {
        candidates.push(basePath + extension);
      }

      for (const extension of RESOLUTION_EXTENSIONS) {
        candidates.push(resolve(basePath, `index${extension}`));
      }
    }

    // Support TypeScript projects importing .js paths
    // that resolve to TypeScript source files.
    if (extname(basePath) === '.js') {
      candidates.push(
        basePath.slice(0, -3) + '.ts',
        basePath.slice(0, -3) + '.tsx',
      );
    }

    for (const candidate of candidates) {
      const candidateRelative = relative(rootPath, candidate);

      if (candidateRelative.startsWith('..') || isAbsolute(candidateRelative)) {
        continue;
      }

      const normalized = this.normalizePath(candidateRelative);

      const fileId = fileMap.get(normalized);

      if (fileId) {
        return fileId;
      }
    }

    return null;
  }

  private getPackageName(specifier: string): string {
    if (
      specifier.startsWith('node:') ||
      specifier.startsWith('file:') ||
      specifier.startsWith('data:')
    ) {
      return specifier;
    }

    const parts = specifier.split('/');

    if (specifier.startsWith('@')) {
      return parts.slice(0, 2).join('/');
    }

    return parts[0];
  }

  private normalizePath(value: string): string {
    return value.replace(/\\/g, '/').replace(/^\.\//, '');
  }
}
