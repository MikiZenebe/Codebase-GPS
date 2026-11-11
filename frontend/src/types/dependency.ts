export type DependencyKind = "IMPORT" | "EXPORT" | "REQUIRE" | "DYNAMIC_IMPORT";

export type DependencyNodeCategory = "file" | "package" | "unresolved";

export type DependencyFilter = "all" | "internal" | "external" | "unresolved";

export interface DependencyFile {
  id: string;
  name: string;
  path: string;
}

export interface RepositoryDependency {
  id: string;
  sourceFileId: string;
  targetFileId: string | null;
  specifier: string;
  kind: DependencyKind;
  isExternal: boolean;
  packageName: string | null;
  line: number;
  sourceFile: DependencyFile;
  targetFile: DependencyFile | null;
}

export interface DependencySummary {
  total: number;
  internal: number;
  external: number;
  unresolved: number;
}

export interface DependencyResponse {
  projectId: string;
  summary: DependencySummary;
  dependencies: RepositoryDependency[];
}

export interface AnalyzeDependencyResponse {
  projectId: string;
  totalDependencies: number;
  internalDependencies: number;
  externalDependencies: number;
  unresolvedDependencies: number;
  analyzedFiles: number;
}
