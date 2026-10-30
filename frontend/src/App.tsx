import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Boxes,
  ChevronDown,
  CircleHelp,
  Code2,
  FileCode2,
  FolderGit2,
  GitBranch,
  LayoutDashboard,
  Network,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";

import { useGetHealthQuery } from "@/services/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Repositories", icon: FolderGit2 },
  { label: "Dependency map", icon: Network },
  { label: "Feature search", icon: Search },
  { label: "Onboarding guides", icon: FileCode2 },
];

const stats = [
  {
    label: "Repositories",
    value: "0",
    description: "Connect your first project",
    icon: FolderGit2,
  },
  {
    label: "Files indexed",
    value: "0",
    description: "Waiting for a repository",
    icon: FileCode2,
  },
  {
    label: "Dependencies",
    value: "0",
    description: "No graph generated yet",
    icon: GitBranch,
  },
];

const initialNodes: Node[] = [
  {
    id: "frontend",
    position: { x: 20, y: 35 },
    data: { label: "React frontend" },
    style: {
      background: "#172554",
      color: "#bfdbfe",
      border: "1px solid #3b82f6",
      borderRadius: 10,
      padding: 12,
      width: 155,
      fontSize: 12,
    },
  },
  {
    id: "api",
    position: { x: 250, y: 35 },
    data: { label: "NestJS API" },
    style: {
      background: "#312e81",
      color: "#ddd6fe",
      border: "1px solid #818cf8",
      borderRadius: 10,
      padding: 12,
      width: 155,
      fontSize: 12,
    },
  },
  {
    id: "service",
    position: { x: 250, y: 155 },
    data: { label: "Analysis service" },
    style: {
      background: "#064e3b",
      color: "#a7f3d0",
      border: "1px solid #10b981",
      borderRadius: 10,
      padding: 12,
      width: 155,
      fontSize: 12,
    },
  },
  {
    id: "database",
    position: { x: 490, y: 155 },
    data: { label: "Project database" },
    style: {
      background: "#422006",
      color: "#fde68a",
      border: "1px solid #f59e0b",
      borderRadius: 10,
      padding: 12,
      width: 155,
      fontSize: 12,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "frontend-api",
    source: "frontend",
    target: "api",
    animated: true,
  },
  {
    id: "api-service",
    source: "api",
    target: "service",
    animated: true,
  },
  {
    id: "service-database",
    source: "service",
    target: "database",
  },
];

export default function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    data: health,
    isLoading,
    isError,
    refetch,
  } = useGetHealthQuery(undefined, {
    pollingInterval: 30000,
  });

  const apiOnline = health?.status === "ok" && !isError;

  function navigateTo(page: string) {
    setActivePage(page);
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-5 md:hidden">
        <button
          onClick={() => navigateTo("Overview")}
          className="flex items-center gap-2.5 font-semibold tracking-tight"
          aria-label="Go to overview"
        >
          <span className="rounded-lg bg-primary p-2 text-primary-foreground">
            <Code2 size={19} />
          </span>
          <span>
            Codebase <span className="text-primary">GPS</span>
          </span>
        </button>

        <Button
          variant="outline"
          size="icon"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X /> : <Settings2 />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? "flex" : "hidden"
        } fixed inset-x-0 top-16 z-20 max-h-[calc(100vh-4rem)] flex-col overflow-y-auto border-b bg-card p-4 md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-60 md:border-r md:border-b-0`}
      >
        <button
          onClick={() => navigateTo("Overview")}
          className="mb-9 hidden items-center gap-2.5 px-2 text-left text-lg font-semibold tracking-tight md:flex"
        >
          <span className="rounded-lg bg-primary p-2 text-primary-foreground">
            <Code2 size={20} />
          </span>
          <span>
            Codebase <span className="text-primary">GPS</span>
          </span>
        </button>

        <p className="mb-3 px-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
          WORKSPACE
        </p>

        <Button variant="outline" className="mb-7 h-12 justify-start gap-3">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
              CG
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 text-left text-xs">My workspace</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>

        <p className="mb-3 px-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
          DEVELOPMENT
        </p>

        <nav className="grid gap-1.5" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => {
            const active = activePage === label;

            return (
              <Button
                key={label}
                variant={active ? "secondary" : "ghost"}
                className={`justify-start gap-3 text-xs ${
                  active
                    ? "font-semibold text-primary"
                    : "text-muted-foreground"
                }`}
                aria-current={active ? "page" : undefined}
                onClick={() => navigateTo(label)}
              >
                <Icon className="size-[18px]" />
                {label}
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto hidden pt-8 md:block">
          <Card className="mb-5 border-primary/15 bg-primary/[0.04] shadow-none">
            <CardContent className="p-4">
              <CircleHelp className="mb-3 size-5 text-primary" />
              <p className="text-xs font-semibold">New to Codebase GPS?</p>
              <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
                Understand your project, step by step.
              </p>
            </CardContent>
          </Card>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-xs text-muted-foreground"
            onClick={() => navigateTo("Settings")}
          >
            <Settings2 className="size-[18px]" />
            Settings
          </Button>

          <Separator className="my-4" />

          <div className="flex items-center gap-3 px-2 pb-2">
            <Avatar>
              <AvatarFallback className="bg-emerald-500/10 text-emerald-600">
                D
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-medium">Developer</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Local workspace
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 md:ml-60">
        <header className="sticky top-0 z-10 hidden h-16 items-center justify-between border-b bg-background/90 px-8 backdrop-blur-xl md:flex">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">Workspace</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium">{activePage}</span>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={
                apiOnline
                  ? "gap-2 border-emerald-500/30 text-emerald-600"
                  : "gap-2 border-amber-500/30 text-amber-600"
              }
              role="status"
              aria-live="polite"
            >
              <span
                className={`size-1.5 rounded-full ${
                  apiOnline ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {isLoading
                ? "Checking API"
                : apiOnline
                  ? "API connected"
                  : "API unavailable"}
            </Badge>

            <Button
              variant="outline"
              size="icon"
              aria-label="Retry API connection"
              onClick={() => refetch()}
            >
              <Activity />
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-5 sm:p-7 lg:p-9">
          {/* Welcome */}
          <section className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-primary">
                <ShieldCheck className="size-4" />
                YOUR CODE, MAPPED
              </div>

              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Understand your codebase.
              </h1>

              <p className="mt-3 max-w-xl text-xs leading-6 text-muted-foreground sm:text-sm">
                Explore how your application works, from the first request to
                the database.
              </p>
            </div>

            <Button onClick={() => navigateTo("Repositories")}>
              <Plus />
              Add repository
            </Button>
          </section>

          {isError && (
            <div
              role="alert"
              className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-300"
            >
              <Activity className="size-5 shrink-0" />
              <p className="flex-1">
                The API could not be reached. Check that NestJS is running on
                port 3000.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {activePage === "Overview" ? (
            <>
              {/* Statistics */}
              <section
                aria-label="Project statistics"
                className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
              >
                {stats.map(({ label, value, description, icon: Icon }) => (
                  <Card
                    key={label}
                    className="shadow-none transition-colors hover:border-primary/30"
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardDescription>{label}</CardDescription>
                      <Icon className="size-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-semibold tracking-tight">
                        {value}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </section>

              {/* Graph heading */}
              <section className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold sm:text-lg">
                    Architecture preview
                  </h2>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Your code relationships will appear here after analysis.
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => navigateTo("Dependency map")}
                >
                  Explore map <ArrowRight />
                </Button>
              </section>

              {/* Graph */}
              <Card className="overflow-hidden gap-0 py-0 shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-2.5 text-xs font-semibold">
                    <Network className="size-5 text-primary" />
                    Application architecture
                    <Badge
                      variant="secondary"
                      className="text-[9px] tracking-wider"
                    >
                      PREVIEW
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Drag nodes · Zoom · Pan
                  </span>
                </div>

                <div className="h-[320px] bg-muted/20 sm:h-[360px]">
                  <ReactFlow
                    nodes={initialNodes}
                    edges={initialEdges}
                    fitView
                    fitViewOptions={{ padding: 0.25 }}
                    nodesDraggable
                    nodesConnectable={false}
                    elementsSelectable
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background color="hsl(var(--border))" gap={22} />
                    <Controls />
                  </ReactFlow>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t px-4 py-4 text-[10px] text-muted-foreground sm:px-5">
                  {[
                    { label: "Frontend", color: "bg-blue-500" },
                    { label: "Backend", color: "bg-indigo-500" },
                    { label: "Services", color: "bg-emerald-500" },
                    { label: "Data", color: "bg-amber-500" },
                  ].map(({ label, color }) => (
                    <span key={label} className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${color}`} />
                      {label}
                    </span>
                  ))}

                  <span className="sm:ml-auto">
                    Illustrative graph — not analyzed source code
                  </span>
                </div>
              </Card>

              {/* Empty repository state */}
              <Card className="mt-5 shadow-none">
                <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div className="rounded-xl border bg-primary/5 p-3 text-primary">
                    <Upload className="size-5" />
                  </div>

                  <div className="flex-1">
                    <CardTitle className="text-sm">
                      Your first repository starts here
                    </CardTitle>
                    <CardDescription className="mt-2 text-xs leading-5">
                      Import a project to discover its files, functions, routes,
                      and dependencies.
                    </CardDescription>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => navigateTo("Repositories")}
                  >
                    View repositories <ArrowRight />
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="mx-auto mt-16 max-w-lg shadow-none sm:mt-24">
              <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                <div className="mb-5 rounded-xl border bg-primary/5 p-4 text-primary">
                  {activePage === "Repositories" ? (
                    <FolderGit2 className="size-7" />
                  ) : activePage === "Dependency map" ? (
                    <Network className="size-7" />
                  ) : activePage === "Feature search" ? (
                    <Search className="size-7" />
                  ) : activePage === "Onboarding guides" ? (
                    <BookOpen className="size-7" />
                  ) : (
                    <Boxes className="size-7" />
                  )}
                </div>

                <CardTitle className="text-xl">{activePage}</CardTitle>
                <CardDescription className="mt-3 max-w-sm text-xs leading-6">
                  This section will become functional in a later phase. Next,
                  we'll import and analyze a real repository.
                </CardDescription>

                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => navigateTo("Overview")}
                >
                  Back to overview
                </Button>
              </CardContent>
            </Card>
          )}

          <Separator className="mt-9" />

          <footer className="flex flex-wrap justify-between gap-3 py-5 text-[10px] text-muted-foreground">
            <span>Codebase GPS · Development preview</span>
            <span>{health?.service ?? "Waiting for API"}</span>
          </footer>

          {/* Mobile API status */}
          <div className="flex items-center gap-2 pb-4 text-xs md:hidden">
            <span
              className={`size-2 rounded-full ${
                apiOnline ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="text-muted-foreground">
              {isLoading
                ? "Checking API"
                : apiOnline
                  ? "API connected"
                  : "API unavailable"}
            </span>
            {!apiOnline && (
              <Button
                variant="link"
                size="sm"
                className="ml-auto"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
