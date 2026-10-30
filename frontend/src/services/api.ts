import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface HealthResponse {
  status: "ok" | "error";
  service: string;
  timestamp: string;
}

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const api = createApi({
  reducerPath: "codebaseApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
  }),
  tagTypes: ["Project", "Analysis"],
  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => "/health",
    }),
  }),
});

export const { useGetHealthQuery } = api;
