export interface Project {
  id: string;
  name: string;
  description: string | null;
  repositoryUrl: string | null;
  source: "UPLOAD" | "GITHUB";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

export interface GitHubRepositoryInput {
  repositoryUrl: string;
}

export interface UploadRepositoryInput {
  file: File;
}
