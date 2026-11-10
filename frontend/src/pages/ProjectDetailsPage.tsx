import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  FolderGit2,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Network,
  Files,
  Search,
  GitBranch,
  RefreshCw,
  Code2,
  Sparkles,
} from "lucide-react";

import { useGetProjectByIdQuery } from "../services/projectApi";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { AiFillGithub } from "react-icons/ai";

const processingStatuses = ["UPLOADING", "IMPORTING", "ANALYZING"];

function getStatusDescription(status: string) {
  switch (status) {
    case "UPLOADING":
      return "Uploading repository files...";
    case "IMPORTING":
      return "Importing repository into Codebase GPS...";
    case "ANALYZING":
      return "Analyzing repository structure...";
    case "READY":
      return "Your repository is ready for exploration.";
    case "FAILED":
      return "Repository processing failed. Please check the import.";
    default:
      return "Waiting for repository processing...";
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    UPLOADING:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    IMPORTING:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    ANALYZING:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    READY:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const icons: Record<string, React.ReactNode> = {
    UPLOADING: <Loader2 size={14} className="animate-spin" />,
    IMPORTING: <Loader2 size={14} className="animate-spin" />,
    ANALYZING: <Loader2 size={14} className="animate-spin" />,
    READY: <CheckCircle2 size={14} />,
    FAILED: <AlertCircle size={14} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
        styles[status] || "bg-muted text-muted-foreground"
      }`}
    >
      {icons[status] || <Clock size={14} />}
      {status.replace("_", " ")}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />

      <div className="h-32 animate-pulse rounded-xl bg-muted" />

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams();

  const {
    data: project,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetProjectByIdQuery(projectId!, {
    skip: !projectId,
    pollingInterval: 5000,
    skipPollingIfUnfocused: true,
  });

  if (!projectId) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="mx-auto mb-4 size-10 text-destructive" />
        <h2 className="text-xl font-semibold">Invalid project ID</h2>
        <Link
          to="/projects"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !project) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="mb-4 size-12 text-destructive" />

          <h2 className="text-lg font-semibold">Unable to load project</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            The project could not be found or the server is unavailable.
          </p>

          <div className="mt-5 flex gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw size={16} className="mr-2" />
              Try again
            </Button>

            <Button render={<Link to="/projects" />}>Back to projects</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isProcessing = processingStatuses.includes(project.status);
  const isReady = project.status === "READY";
  const isFailed = project.status === "FAILED";

  const source = project.source;

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to projects
      </Link>

      {/* Project Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <FolderGit2 size={30} />
          </div>

          <div className="min-w-0">
            <h1 className="break-words text-3xl font-bold tracking-tight">
              {project.name}
            </h1>

            <p className="mt-2 text-muted-foreground">
              {project.description || "Repository overview"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge status={project.status} />

              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {source === "GITHUB" ? (
                  <AiFillGithub size={14} />
                ) : (
                  <FileArchive size={14} />
                )}

                {source === "GITHUB" ? "GitHub repository" : "ZIP upload"}
              </span>

              <span className="text-xs text-muted-foreground">
                Project ID: {project.id}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Link to={`/projects/${projectId}/statistics`}>
            <Button>View Repository Statistics</Button>
          </Link>
        </div>
      </div>

      {/* Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles size={18} className="text-primary" />
            Repository processing
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">
                {isReady
                  ? "Analysis completed"
                  : isFailed
                    ? "Processing failed"
                    : "Processing your repository"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {getStatusDescription(project.status)}
              </p>
            </div>

            <StatusBadge status={project.status} />
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
              </div>

              <p className="text-xs text-muted-foreground">
                Processing is in progress. The page checks for updates
                automatically.
              </p>
            </div>
          )}

          {isReady && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2 size={18} />
              Your repository is ready for exploration.
            </div>
          )}

          {isFailed && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              Processing did not complete successfully. Check the backend logs
              for the failure reason.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repository Overview */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Repository overview</h2>

          <p className="text-sm text-muted-foreground">
            Explore the structure and architecture of your codebase.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <OverviewCard
            icon={<Files size={22} />}
            title="File Explorer"
            description="Browse the files and folders in your repository."
            disabled={!isReady}
          />

          <OverviewCard
            icon={<Network size={22} />}
            title="Dependency Map"
            description="Visualize connections between modules and files."
            disabled={!isReady}
          />

          <OverviewCard
            icon={<Search size={22} />}
            title="Feature Search"
            description="Find code by describing what a feature does."
            disabled={!isReady}
          />

          <OverviewCard
            icon={<GitBranch size={22} />}
            title="Request Flow"
            description="Trace requests through routes, services and database models."
            disabled={!isReady}
          />

          <OverviewCard
            icon={<Code2 size={22} />}
            title="Codebase Explorer"
            description="Understand how different parts of your application work."
            disabled={!isReady}
          />

          <OverviewCard
            icon={<Sparkles size={22} />}
            title="Onboarding Guide"
            description="Generate a guide to help developers understand this project."
            disabled={!isReady}
          />
        </div>
      </section>

      {/* Future Analysis Results */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Analysis results</h2>

          <p className="text-sm text-muted-foreground">
            Repository analysis data will appear here.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <FolderGit2 className="mb-4 size-10 text-muted-foreground" />

            <h3 className="font-semibold">
              {isReady
                ? "Analysis dashboard coming next"
                : "Waiting for repository analysis"}
            </h3>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {isReady
                ? "Your repository is ready. We'll connect the file scanner, dependency analyzer and request-flow engine in Phase 4."
                : "Once repository processing finishes, analysis results will be available here."}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function OverviewCard({
  icon,
  title,
  description,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled: boolean;
}) {
  return (
    <Card
      className={`h-full transition ${
        disabled ? "opacity-60" : "hover:border-primary hover:shadow-sm"
      }`}
    >
      <CardContent className="space-y-3 p-5">
        <div className="w-fit rounded-lg bg-primary/10 p-2.5 text-primary">
          {icon}
        </div>

        <div>
          <h3 className="font-semibold">{title}</h3>

          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <span className="text-xs font-medium text-muted-foreground">
          {disabled ? "Available after processing" : "Coming in Phase 4"}
        </span>
      </CardContent>
    </Card>
  );
}
