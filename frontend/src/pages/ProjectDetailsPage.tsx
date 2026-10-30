import { useParams } from "react-router-dom";
import { useGetProjectByIdQuery } from "../services/projectApi";

export default function ProjectDetailsPage() {
  const { projectId } = useParams();

  const {
    data: project,
    isLoading,
    isError,
  } = useGetProjectByIdQuery(projectId!, {
    skip: !projectId,
  });

  if (isLoading) return <p>Loading project...</p>;

  if (isError || !project) {
    return <p>Unable to load project.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{project.name}</h1>
      <p className="text-muted-foreground">
        {project.description || "Repository overview"}
      </p>
      <p>Analysis status: {project.status}</p>
    </div>
  );
}
