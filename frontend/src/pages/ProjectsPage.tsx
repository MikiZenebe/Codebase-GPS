import { Link } from "react-router-dom";
import { FolderGit2, Plus } from "lucide-react";
import { useGetProjectsQuery } from "../services/projectApi";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function ProjectsPage() {
  const { data: projects = [], isLoading, isError } = useGetProjectsQuery();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading projects...</p>;
  }

  if (isError) {
    return <p className="text-destructive">Failed to load projects.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your imported repositories.
          </p>
        </div>

        <Button render={<Link to="/projects/new" />}>
          <Plus size={16} />
          New project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FolderGit2 className="mb-4 size-12 text-muted-foreground" />

            <h2 className="text-lg font-semibold">No projects yet</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Upload a repository or connect GitHub to get started.
            </p>

            <Button render={<Link to="/projects/new" />} className="mt-5">
              Add your first project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="transition hover:border-primary">
                <CardContent className="space-y-3 p-5">
                  <FolderGit2 className="size-6 text-primary" />

                  <h2 className="font-semibold">{project.name}</h2>

                  <p className="text-sm text-muted-foreground">
                    {project.description || "No description"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {project.status}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
