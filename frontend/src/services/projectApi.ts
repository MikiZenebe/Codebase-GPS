import { api } from "./api";

import type {
  Project,
  ProjectProgress,
  GitHubRepositoryInput,
  UploadRepositoryInput,
  RepositorySubmissionResponse,
  PaginatedResponse,
} from "../types/project";

export const projectApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all projects
    getProjects: builder.query<Project[], void>({
      query: () => "/projects",
      transformResponse: (response: PaginatedResponse<Project>) => response.data,
      providesTags: [{ type: "Project", id: "LIST" }],
    }),

    // Upload repository ZIP
    uploadRepository: builder.mutation<
      RepositorySubmissionResponse,
      UploadRepositoryInput
    >({
      query: ({ file, name }) => {
        const formData = new FormData();

        formData.append("file", file);

        if (name?.trim()) {
          formData.append("name", name.trim());
        }

        return {
          url: "/projects/upload",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),

    // Connect GitHub repository
    connectGitHub: builder.mutation<
      RepositorySubmissionResponse,
      GitHubRepositoryInput
    >({
      query: (body) => ({
        url: "/projects/github",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),

    // Get project details
    getProjectById: builder.query<Project, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Project", id }],
    }),

    // Get background processing progress
    getProjectProgress: builder.query<ProjectProgress, string>({
      query: (id) => `/projects/${id}/progress`,
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetProjectsQuery,
  useUploadRepositoryMutation,
  useConnectGitHubMutation,
  useGetProjectByIdQuery,
  useGetProjectProgressQuery,
} = projectApi;
