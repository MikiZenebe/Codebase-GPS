export type DependencyKind = 'IMPORT' | 'EXPORT' | 'REQUIRE' | 'DYNAMIC_IMPORT';

export interface DetectedDependency {
  sourceFileId: string;
  targetFileId: string | null;
  specifier: string;
  kind: DependencyKind;
  isExternal: boolean;
  packageName: string | null;
  line: number;
}

export interface DependencyAnalysisResult {
  projectId: string;
  totalDependencies: number;
  internalDependencies: number;
  externalDependencies: number;
  unresolvedDependencies: number;
  analyzedFiles: number;
}
