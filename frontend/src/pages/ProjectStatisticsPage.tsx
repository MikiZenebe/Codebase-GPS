import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Files,
  Folder,
  HardDrive,
  Code2,
  FileCode2,
  RefreshCw,
} from "lucide-react";
import { useGetProjectStatisticsQuery } from "../services/projectApi";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

function formatBytes(bytes: string | number): string {
  const value = Number(bytes);

  if (!Number.isFinite(value) || value < 0) {
    return "Unknown";
  }

  if (value === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );

  return `${(value / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

export default function ProjectStatisticsPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const { data, isLoading, isFetching, isError, refetch } =
    useGetProjectStatisticsQuery(projectId ?? "", {
      skip: !projectId,
    });

  if (!projectId) {
    return <div className="p-6 text-red-500">Project ID is missing.</div>;
  }

  if (isLoading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading repository statistics...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-red-500">Failed to load repository statistics.</p>

        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  const { project, overview, languages, extensions } = data;

  const stats = [
    {
      title: "Total Files",
      value: overview.totalFiles.toLocaleString(),
      icon: Files,
      description: "Files scanned",
    },
    {
      title: "Directories",
      value: overview.totalDirectories.toLocaleString(),
      icon: Folder,
      description: "Directories scanned",
    },
    {
      title: "Repository Size",
      value: formatBytes(overview.totalSizeBytes),
      icon: HardDrive,
      description: "Total file size",
    },
    {
      title: "Languages",
      value: languages.length.toString(),
      icon: Code2,
      description: "Languages detected",
    },
  ];

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to project
          </Link>

          <h1 className="text-2xl font-bold tracking-tight">
            Repository Statistics
          </h1>

          <p className="text-sm text-muted-foreground">
            Overview of {project.name}
          </p>
        </div>

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
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>

                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Language Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Language Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">
            Programming languages detected in your repository.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {languages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No programming languages detected.
            </p>
          ) : (
            languages.map((language) => (
              <div key={language.language} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{language.language}</span>

                  <span className="text-muted-foreground">
                    {language.percentage.toFixed(1)}%{" · "}
                    {language.fileCount} files
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, language.percentage),
                      )}%`,
                    }}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  {formatBytes(language.sizeBytes)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* File Extensions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode2 className="h-5 w-5" />
            File Extensions
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Breakdown of file types in the repository.
          </p>
        </CardHeader>

        <CardContent>
          {extensions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No file extensions found.
            </p>
          ) : (
            <div className="space-y-3">
              {extensions.map((extension) => (
                <div
                  key={extension.extension}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileCode2 className="h-5 w-5 text-muted-foreground" />

                    <span className="font-medium">
                      {extension.extension || "No extension"}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {extension.fileCount} files
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatBytes(extension.sizeBytes)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="text-xs text-muted-foreground">
        Statistics generated: {new Date(data.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
