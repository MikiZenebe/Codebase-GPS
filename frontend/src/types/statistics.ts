export interface RepositoryStatistics {
  project: {
    id: string;
    name: string;
  };

  overview: {
    totalFiles: number;
    totalDirectories: number;
    totalSizeBytes: string;
  };

  languages: {
    language: string;
    fileCount: number;
    percentage: number;
    sizeBytes: string;
  }[];

  extensions: {
    extension: string;
    fileCount: number;
    sizeBytes: string;
  }[];

  generatedAt: string;
}
