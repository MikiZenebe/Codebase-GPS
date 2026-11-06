import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  FileArchive,
  FolderGit2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useGetProjectsQuery } from "../services/projectApi";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useMemo, useState } from "react";
import { AiFillGithub } from "react-icons/ai";
import type { StatusFilter } from "../types/project";
import StatusBadge from "../components/shared/StatusBadge";
import StatCard from "../components/shared/StatCard";

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-4 p-5">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const {
    data: projects = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetProjectsQuery();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        (project.description || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      ready: projects.filter((p) => p.status === "READY").length,
      processing: projects.filter((p) =>
        ["UPLOADING", "IMPORTING", "ANALYZING"].includes(p.status),
      ).length,
      failed: projects.filter((p) => p.status === "FAILED").length,
    };
  }, [projects]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="mb-4 size-12 text-destructive" />

          <h2 className="text-lg font-semibold">Failed to load projects</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong while fetching your repositories.
          </p>

          <Button onClick={() => refetch()} className="mt-5">
            <RefreshCw size={16} className="mr-2" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>

          <p className="mt-2 text-muted-foreground">
            Manage and explore your imported repositories.
          </p>
        </div>

        <Button render={<Link to="/projects/new" />}>
          <Plus size={16} className="mr-2" />
          New project
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total projects"
          value={stats.total}
          icon={<FolderGit2 />}
        />
        <StatCard label="Ready" value={stats.ready} icon={<CheckCircle2 />} />
        <StatCard
          label="Processing"
          value={stats.processing}
          icon={<Loader2 />}
        />
        <StatCard label="Failed" value={stats.failed} icon={<AlertCircle />} />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as StatusFilter)
          }
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All statuses</option>
          <option value="UPLOADING">Uploading</option>
          <option value="IMPORTING">Importing</option>
          <option value="ANALYZING">Analyzing</option>
          <option value="READY">Ready</option>
          <option value="FAILED">Failed</option>
        </select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh projects"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Project List Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your repositories</h2>

        <p className="text-sm text-muted-foreground">
          {filteredProjects.length} of {projects.length} projects
        </p>
      </div>

      {/* Project Cards */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FolderGit2 className="mb-4 size-12 text-muted-foreground" />

            <h2 className="text-lg font-semibold">
              {projects.length === 0
                ? "No projects yet"
                : "No matching projects"}
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {projects.length === 0
                ? "Upload a ZIP repository or connect your GitHub account to get started."
                : "Try changing your search or status filter."}
            </p>

            {projects.length === 0 ? (
              <Button render={<Link to="/projects/new" />} className="mt-5">
                <Plus size={16} className="mr-2" />
                Add your first project
              </Button>
            ) : (
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                }}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group"
            >
              <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md">
                <CardContent className="space-y-4 p-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                      <FolderGit2 size={22} />
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="text-muted-foreground transition-colors group-hover:text-primary"
                    />
                  </div>

                  {/* Project Details */}
                  <div>
                    <h3 className="truncate font-semibold group-hover:text-primary">
                      {project.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                      {project.description || "No description provided."}
                    </p>
                  </div>

                  {/* Repository Source */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {project.source === "GITHUB" ? (
                      <AiFillGithub size={14} />
                    ) : (
                      <FileArchive size={14} />
                    )}

                    {project.source === "GITHUB"
                      ? "GitHub repository"
                      : "ZIP upload"}
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between border-t pt-3">
                    <StatusBadge status={project.status} />

                    <span className="text-xs text-muted-foreground">
                      View project
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
