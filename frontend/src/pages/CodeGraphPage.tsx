import { useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Clock,
  FileCode2,
  Focus,
  FolderGit2,
  Loader2,
  Network,
  Package,
  Play,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import StatusBadge from "../components/shared/StatusBadge";

import {
  useAnalyzeProjectDependenciesMutation,
  useGetProjectByIdQuery,
  useGetProjectsQuery,
} from "../services/projectApi";

import { useDependencyGraph } from "../features/code-graph/hooks/useDependencyGraph";
import DependencyGraph from "../features/code-graph/components/DependencyGraph";
import DependencyInspector from "../features/code-graph/components/DependencyInspector";
import DependencyInsightsPanel from "../features/code-graph/components/DependencyInsightsPanel";
import { getNeighborhoodNodeIds } from "../features/code-graph/utils/dependency-insights.utils";

import type {
  DependencyFilter,
  DependencyKind,
} from "../types/dependency";

const filters: {
  label: string;
  value: DependencyFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Internal", value: "internal" },
  { label: "External", value: "external" },
  { label: "Unresolved", value: "unresolved" },
];

const kindOptions: { label: string; value: DependencyKind | "ALL" }[] = [
  { label: "All kinds", value: "ALL" },
  { label: "Imports", value: "IMPORT" },
  { label: "Exports", value: "EXPORT" },
  { label: "Require", value: "REQUIRE" },
  { label: "Dynamic imports", value: "DYNAMIC_IMPORT" },
];

export default function CodeGraphPage() {
  const { projectId: routeProjectId } = useParams<{
    projectId: string;
  }>();

  const isGlobalMode = !routeProjectId;

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DependencyFilter>("all");
  const [kindFilter, setKindFilter] = useState<DependencyKind | "ALL">("ALL");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isolateSelection, setIsolateSelection] = useState(false);

  const graphContainerRef = useRef<HTMLDivElement | null>(null);

  const { data: projects = [], isLoading: isLoadingProjects } =
    useGetProjectsQuery(undefined, {
      skip: !isGlobalMode,
    });

  const activeProjectId = useMemo(() => {
    if (routeProjectId) return routeProjectId;

    const paramId = searchParams.get("projectId");
    if (paramId && projects.some((p) => p.id === paramId)) {
      return paramId;
    }

    const readyProject = projects.find((p) => p.status === "READY");
    return readyProject?.id ?? projects[0]?.id ?? "";
  }, [routeProjectId, searchParams, projects]);

  const { data: singleProject } = useGetProjectByIdQuery(routeProjectId ?? "", {
    skip: !routeProjectId,
  });

  const activeProject = useMemo(() => {
    if (routeProjectId) return singleProject;
    return projects.find((p) => p.id === activeProjectId);
  }, [routeProjectId, singleProject, projects, activeProjectId]);

  const {
    data,
    graph,
    summary,
    dependencies,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDependencyGraph(activeProjectId, filter, kindFilter);

  const [analyzeDependencies, { isLoading: isAnalyzing }] =
    useAnalyzeProjectDependenciesMutation();

  const selectedNode = useMemo(
    () => graph.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [graph.nodes, selectedNodeId],
  );

  const neighborhoodIds = useMemo(() => {
    if (!selectedNode) return null;
    return getNeighborhoodNodeIds(selectedNode.id, graph.edges);
  }, [selectedNode, graph.edges]);

  const matchingIds = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return null;

    return new Set(
      graph.nodes
        .filter((node) =>
          `${node.data.label} ${node.data.path ?? ""}`
            .toLowerCase()
            .includes(query),
        )
        .map((node) => node.id),
    );
  }, [graph.nodes, search]);

  const { visibleNodes, visibleEdges } = useMemo(() => {
    const baseNodes =
      isolateSelection && neighborhoodIds
        ? graph.nodes.filter((node) => neighborhoodIds.has(node.id))
        : graph.nodes;

    const baseEdges =
      isolateSelection && neighborhoodIds
        ? graph.edges.filter(
            (edge) =>
              neighborhoodIds.has(edge.source) &&
              neighborhoodIds.has(edge.target),
          )
        : graph.edges;

    const nodes = baseNodes.map((node) => {
      const matchesSearch = !matchingIds || matchingIds.has(node.id);
      const matchesFocus =
        isolateSelection || !neighborhoodIds || neighborhoodIds.has(node.id);

      return {
        ...node,
        selected: node.id === selectedNodeId,
        style: {
          ...node.style,
          opacity: matchesSearch && matchesFocus ? 1 : 0.2,
        },
      };
    });

    const edges = baseEdges.map((edge) => {
      const matchesSearch =
        !matchingIds ||
        matchingIds.has(edge.source) ||
        matchingIds.has(edge.target);
      const matchesFocus =
        isolateSelection ||
        !selectedNodeId ||
        edge.source === selectedNodeId ||
        edge.target === selectedNodeId;

      return {
        ...edge,
        animated:
          Boolean(selectedNodeId) &&
          (edge.source === selectedNodeId || edge.target === selectedNodeId),
        style: {
          ...edge.style,
          opacity: matchesSearch && matchesFocus ? 1 : 0.12,
        },
      };
    });

    return { visibleNodes: nodes, visibleEdges: edges };
  }, [
    graph.nodes,
    graph.edges,
    matchingIds,
    neighborhoodIds,
    isolateSelection,
    selectedNodeId,
  ]);

  const handleProjectChange = (nextProjectId: string) => {
    setSelectedNodeId(null);
    setIsolateSelection(false);
    setSearch("");
    setSearchParams({ projectId: nextProjectId });
  };

  const handleAnalyze = async () => {
    if (!activeProjectId) return;

    try {
      await analyzeDependencies(activeProjectId).unwrap();
      setSelectedNodeId(null);
      setIsolateSelection(false);
    } catch (error) {
      console.error("Dependency analysis failed:", error);
    }
  };

  const handleFocusNodeId = (nodeId: string) => {
    const isCurrentlyVisible = graph.nodes.some((n) => n.id === nodeId);
    if (!isCurrentlyVisible) {
      setFilter("all");
      setKindFilter("ALL");
    }
    setSelectedNodeId(nodeId);
    graphContainerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  };

  const clearSelection = () => {
    setSelectedNodeId(null);
    setIsolateSelection(false);
  };

  if (isGlobalMode && isLoadingProjects) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-[520px] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (isGlobalMode && projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 rounded-xl bg-primary/10 p-3.5 text-primary">
            <Network className="size-8" />
          </div>
          <h1 className="text-xl font-semibold">No repositories to graph yet</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Import a GitHub repository or upload a ZIP archive first to explore
            its interactive dependency graph.
          </p>
          <Button render={<Link to="/projects/new" />} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Import repository
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!activeProjectId) {
    return <div className="p-8 text-destructive">Project ID is missing.</div>;
  }

  const isProjectProcessing =
    activeProject &&
    ["UPLOADING", "IMPORTING", "ANALYZING"].includes(activeProject.status);
  const isProjectFailed = activeProject?.status === "FAILED";

  const graphViewportKey = `${activeProjectId}-${filter}-${kindFilter}-${
    isolateSelection ? (selectedNodeId ?? "") : ""
  }`;

  const stats = summary
    ? [
        {
          label: "Total Dependencies",
          value: summary.total,
          icon: Network,
        },
        {
          label: "Internal",
          value: summary.internal,
          icon: FileCode2,
        },
        {
          label: "External",
          value: summary.external,
          icon: Package,
        },
        {
          label: "Unresolved",
          value: summary.unresolved,
          icon: AlertTriangle,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          {routeProjectId && (
            <Link
              to={`/projects/${routeProjectId}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to project
            </Link>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Code Graph
            </h1>

            {activeProject && <StatusBadge status={activeProject.status} />}
          </div>

          <p className="text-sm text-muted-foreground">
            Explore internal file dependencies, external packages, and module
            coupling across your repository.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isGlobalMode && projects.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <FolderGit2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  aria-label="Select repository"
                  value={activeProjectId}
                  onChange={(event) => handleProjectChange(event.target.value)}
                  className="h-8 max-w-[230px] rounded-lg border border-border bg-background pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                render={<Link to={`/projects/${activeProjectId}`} />}
                title="Open project details"
              >
                Project
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || Boolean(isProjectProcessing)}
          >
            {isAnalyzing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}

            {isAnalyzing ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-24 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
          <div className="h-[520px] animate-pulse rounded-xl bg-muted" />
        </div>
      ) : isError || !data || !summary ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
            <p className="font-medium text-destructive">
              Failed to load dependency graph.
            </p>
            <Button onClick={() => refetch()} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-lg bg-muted p-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div>
                      <p className="text-2xl font-bold tabular-nums">
                        {stat.value.toLocaleString()}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Search, category filters, kind filter & focus controls */}
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search files or packages..."
                    className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <select
                  aria-label="Filter by dependency kind"
                  value={kindFilter}
                  onChange={(event) => {
                    setKindFilter(
                      event.target.value as DependencyKind | "ALL",
                    );
                    clearSelection();
                  }}
                  className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {kindOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {filters.map((item) => (
                  <Button
                    key={item.value}
                    size="sm"
                    variant={filter === item.value ? "default" : "outline"}
                    onClick={() => {
                      setFilter(item.value);
                      clearSelection();
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {selectedNode && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Focus className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Focused on{" "}
                    <strong className="text-foreground">
                      {selectedNode.data.label}
                    </strong>{" "}
                    ({neighborhoodIds?.size ?? 1} connected nodes)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant={isolateSelection ? "default" : "outline"}
                    onClick={() => setIsolateSelection((prev) => !prev)}
                  >
                    {isolateSelection ? "Showing 1-hop only" : "Isolate 1-hop"}
                  </Button>

                  <Button size="xs" variant="ghost" onClick={clearSelection}>
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Graph */}
          <div ref={graphContainerRef}>
            {dependencies.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
                  {isProjectProcessing ? (
                    <>
                      <Loader2 className="h-11 w-11 animate-spin text-primary" />
                      <div>
                        <h2 className="font-semibold">
                          Repository is still processing
                        </h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          Dependency analysis will be available as soon as{" "}
                          {activeProject?.name ?? "this repository"} finishes
                          importing.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        render={<Link to={`/projects/${activeProjectId}`} />}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        View processing status
                      </Button>
                    </>
                  ) : isProjectFailed ? (
                    <>
                      <AlertCircle className="h-11 w-11 text-destructive" />
                      <div>
                        <h2 className="font-semibold">
                          Repository import failed
                        </h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          Cannot analyze dependencies because the project failed
                          during import.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        render={<Link to={`/projects/${activeProjectId}`} />}
                      >
                        Inspect project
                      </Button>
                    </>
                  ) : (
                    <>
                      <Network className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <h2 className="font-semibold">
                          No dependencies analyzed yet
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Run dependency analysis to generate your code graph.
                        </p>
                      </div>
                      <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                        <Play className="mr-2 h-4 w-4" />
                        Start Analysis
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : visibleNodes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  No dependencies match the selected filters.
                </CardContent>
              </Card>
            ) : (
              <div
                className={`grid min-h-[600px] overflow-hidden rounded-xl border ${
                  selectedNode
                    ? "lg:grid-cols-[minmax(0,1fr)_340px]"
                    : "grid-cols-1"
                }`}
              >
                <DependencyGraph
                  key={graphViewportKey}
                  initialNodes={visibleNodes}
                  initialEdges={visibleEdges}
                  onSelectNode={(node) => setSelectedNodeId(node.id)}
                  onClearSelection={clearSelection}
                />

                {selectedNode && (
                  <DependencyInspector
                    node={selectedNode}
                    dependencies={dependencies}
                    onClose={clearSelection}
                  />
                )}
              </div>
            )}
          </div>

          {dependencies.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">
                Showing {visibleNodes.length} of {graph.nodes.length} nodes and{" "}
                {visibleEdges.length} of {graph.edges.length} connections.
                {matchingIds && ` ${matchingIds.size} nodes match your search.`}
              </p>

              <DependencyInsightsPanel
                dependencies={dependencies}
                activeNodeId={selectedNodeId}
                onFocusNodeId={handleFocusNodeId}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
