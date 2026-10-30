import { api } from "./api";
import type {
  Project,
  GitHubRepositoryInput,
  UploadRepositoryInput,
} from "../types/project";

export const projectApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => "/projects",
      providesTags: ["Project"],
    }),

    uploadRepository: builder.mutation<Project, UploadRepositoryInput>({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: "/projects/upload",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Project"],
    }),

    connectGitHub: builder.mutation<Project, GitHubRepositoryInput>({
      query: (body) => ({
        url: "/projects/github",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Project"],
    }),

    getProjectById: builder.query<Project, string>({
      query: (id) => `/projects/${id}`,
      providesTags: ["Project"],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useUploadRepositoryMutation,
  useConnectGitHubMutation,
  useGetProjectByIdQuery,
} = projectApi;
