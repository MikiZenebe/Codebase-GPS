import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  RefreshCw,
  Search,
  Network,
  FileCode2,
  Package,
  AlertTriangle,
  Play,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

import { useAnalyzeProjectDependenciesMutation } from "../services/projectApi";

import { useDependencyGraph } from "../features/code-graph/hooks/useDependencyGraph";

import DependencyGraph from "../features/code-graph/components/DependencyGraph";

import DependencyInspector from "../features/code-graph/components/DependencyInspector";

import type { DependencyGraphNode } from "../features/code-graph/components/DependencyNode";
import type { DependencyFilter } from "../types/dependency";

const filters: {
  label: string;
  value: DependencyFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Internal", value: "internal" },
  { label: "External", value: "external" },
  { label: "Unresolved", value: "unresolved" },
];

export default function CodeGraphPage() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<DependencyFilter>("all");

  const [selectedNode, setSelectedNode] = useState<DependencyGraphNode | null>(
    null,
  );

  const {
    data,
    graph,
    summary,
    dependencies,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDependencyGraph(projectId ?? "", filter);

  const [analyzeDependencies, { isLoading: isAnalyzing }] =
    useAnalyzeProjectDependenciesMutation();

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

  const visibleNodes = useMemo(
    () =>
      graph.nodes.map((node) => ({
        ...node,
        style: {
          ...node.style,
          opacity: !matchingIds || matchingIds.has(node.id) ? 1 : 0.2,
        },
      })),
    [graph.nodes, matchingIds],
  );

  const visibleEdges = useMemo(
    () =>
      graph.edges.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          opacity:
            !matchingIds ||
            matchingIds.has(edge.source) ||
            matchingIds.has(edge.target)
              ? 1
              : 0.12,
        },
      })),
    [graph.edges, matchingIds],
  );

  const handleAnalyze = async () => {
    if (!projectId) return;

    try {
      await analyzeDependencies(projectId).unwrap();

      setSelectedNode(null);
    } catch (error) {
      console.error("Dependency analysis failed:", error);
    }
  };

  if (!projectId) {
    return <div className="p-8 text-destructive">Project ID is missing.</div>;
  }

  if (isLoading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading dependency graph...
      </div>
    );
  }

  if (isError || !data || !summary) {
    return (
      <div className="space-y-4 p-8">
        <p className="text-destructive">Failed to load dependency graph.</p>

        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  const stats = [
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
  ];

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to project
          </Link>

          <h1 className="text-2xl font-bold tracking-tight">Code Graph</h1>

          <p className="text-sm text-muted-foreground">
            Explore relationships between repository files and packages.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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

          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}

            {isAnalyzing ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>
      </div>

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
                  <p className="text-2xl font-bold">
                    {stat.value.toLocaleString()}
                  </p>

                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search files or packages..."
            className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button
              key={item.value}
              size="sm"
              variant={filter === item.value ? "default" : "outline"}
              onClick={() => {
                setFilter(item.value);
                setSelectedNode(null);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Graph */}
      {dependencies.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[350px] flex-col items-center justify-center gap-4 text-center">
            <Network className="h-12 w-12 text-muted-foreground" />

            <div>
              <h2 className="font-semibold">No dependencies analyzed yet</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Run dependency analysis to generate your code graph.
              </p>
            </div>

            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              <Play className="mr-2 h-4 w-4" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      ) : graph.nodes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No dependencies match the selected filter.
          </CardContent>
        </Card>
      ) : (
        <div
          className={`grid min-h-[600px] overflow-hidden rounded-xl border ${
            selectedNode ? "lg:grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1"
          }`}
        >
          <DependencyGraph
            initialNodes={visibleNodes}
            initialEdges={visibleEdges}
            onSelectNode={setSelectedNode}
          />

          {selectedNode && (
            <DependencyInspector
              node={selectedNode}
              dependencies={dependencies}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {graph.nodes.length} nodes and {graph.edges.length} connections.
        {matchingIds && ` ${matchingIds.size} nodes match your search.`}
      </p>
    </div>
  );
}
