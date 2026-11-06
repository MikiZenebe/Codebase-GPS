export type ProjectSource = "UPLOAD" | "GITHUB";

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export type ProjectStatus =
  | "UPLOADING"
  | "IMPORTING"
  | "ANALYZING"
  | "READY"
  | "FAILED";

export type StatusFilter =
  | "ALL"
  | "UPLOADING"
  | "IMPORTING"
  | "ANALYZING"
  | "READY"
  | "FAILED";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  repositoryUrl: string | null;
  source: ProjectSource;
  status: ProjectStatus;
  branch?: string | null;
  rootPath?: string | null;
  fileCount?: number;
  language?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface GitHubRepositoryInput {
  repositoryUrl: string;
  branch?: string;
}

export interface UploadRepositoryInput {
  file: File;
  name?: string;
}

export interface RepositorySubmissionResponse {
  message: string;
  project: Project;
  jobId: string;
  status: "QUEUED";
}

export interface ProjectProgress {
  projectId: string;
  status: ProjectStatus;
  progress: number;
  queueState: string;
  attemptsMade: number;
}
