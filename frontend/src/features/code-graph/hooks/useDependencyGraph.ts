import { useMemo } from "react";

import { useGetProjectDependenciesQuery } from "../../../services/projectApi";

import { buildDependencyGraph } from "../utils/dependency-map.utils";
import type { DependencyFilter } from "../../../types/dependency";

export function useDependencyGraph(
  projectId: string,
  filter: DependencyFilter,
) {
  const query = useGetProjectDependenciesQuery(projectId, {
    skip: !projectId,
  });

  const graph = useMemo(
    () => buildDependencyGraph(query.data?.dependencies ?? [], filter),
    [query.data?.dependencies, filter],
  );

  return {
    ...query,
    graph,
    summary: query.data?.summary,
    dependencies: query.data?.dependencies ?? [],
  };
}
