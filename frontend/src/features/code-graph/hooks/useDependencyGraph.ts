import { useMemo } from "react";

import { useGetProjectDependenciesQuery } from "../../../services/projectApi";

import { buildDependencyGraph } from "../utils/dependency-map.utils";
import type {
  DependencyFilter,
  DependencyKind,
} from "../../../types/dependency";

export function useDependencyGraph(
  projectId: string,
  filter: DependencyFilter,
  kindFilter: DependencyKind | "ALL" = "ALL",
) {
  const query = useGetProjectDependenciesQuery(projectId, {
    skip: !projectId,
  });

  const graph = useMemo(
    () => buildDependencyGraph(query.data?.dependencies ?? [], filter, kindFilter),
    [query.data?.dependencies, filter, kindFilter],
  );

  return {
    ...query,
    graph,
    summary: query.data?.summary,
    dependencies: query.data?.dependencies ?? [],
  };
}
