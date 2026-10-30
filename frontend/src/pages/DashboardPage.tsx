import { Link } from "react-router-dom";
import { FolderGit2, Network, Search, Workflow, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const stats = [
  { label: "Total Projects", value: "0", icon: FolderGit2 },
  { label: "Code Relationships", value: "0", icon: Network },
  { label: "Indexed Files", value: "0", icon: Search },
  { label: "Execution Flows", value: "0", icon: Workflow },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Understand and navigate your software projects.
          </p>
        </div>

        <Button asChild>
          <Link to="/projects/new">
            <Plus size={17} />
            Add project
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                </div>

                <div className="rounded-xl bg-primary/10 p-3">
                  <Icon className="size-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to Codebase GPS</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Start by importing your first repository. Codebase GPS will help you
            understand its structure, relationships, and execution flows.
          </p>

          <Button asChild>
            <Link to="/projects/new">
              <Plus size={16} />
              Import your first repository
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
