export type RepositoryNodeType = 'FILE' | 'DIRECTORY';

export interface RepositoryFileNode {
  name: string;
  path: string;
  type: RepositoryNodeType;

  extension?: string;
  language?: string;

  size: number;
  modifiedAt?: string;

  children?: RepositoryFileNode[];
}

export interface RepositoryScanResult {
  rootPath: string;
  tree: RepositoryFileNode[];

  totalFiles: number;
  totalDirectories: number;
  totalSize: number;

  scannedAt: string;
  truncated: boolean;
}
