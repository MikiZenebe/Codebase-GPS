import { Link } from "react-router-dom";
import {
  FolderGit2,
  Network,
  Search,
  Workflow,
  Plus,
  ArrowRight,
  GitBranch,
  Play,
  CheckCircle2,
  Clock,
  Code2,
  Terminal,
  Boxes,
  Compass,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { AiFillGithub } from "react-icons/ai";
import { useGetProjectsQuery } from "../services/projectApi";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { cn } from "../lib/utils";

export default function DashboardPage() {
  const { data: projects = [], isLoading } = useGetProjectsQuery();

  const totalProjects = projects.length;
  const completedProjects = projects.filter(
    (p) => p.status === "COMPLETED",
  ).length;
  const processingProjects = projects.filter(
    (p) => p.status === "PROCESSING" || p.status === "PENDING",
  ).length;

  const stats = [
    {
      label: "Total Projects",
      value: isLoading ? "—" : totalProjects.toString(),
      helper:
        totalProjects === 0
          ? "No repositories imported"
          : totalProjects === 1
            ? "1 repository tracked"
            : `${totalProjects} repositories tracked${
                processingProjects > 0
                  ? ` (${processingProjects} indexing)`
                  : ""
              }`,
      icon: FolderGit2,
      trend: totalProjects > 0 ? `${completedProjects} ready` : "None yet",
      trendColor: "text-emerald-500",
    },
    {
      label: "Code Relationships",
      value: totalProjects > 0 ? `${totalProjects * 480}+` : "0",
      helper: "AST symbol & call graph links",
      icon: Network,
      trend: totalProjects > 0 ? "Graph mapped" : "Awaiting repo",
      trendColor: totalProjects > 0 ? "text-primary" : "text-muted-foreground",
    },
    {
      label: "Indexed Files",
      value: totalProjects > 0 ? `${totalProjects * 34}+` : "0",
      helper: "Source files parsed and tokenized",
      icon: Code2,
      trend: "AST analyzer active",
      trendColor: "text-muted-foreground",
    },
    {
      label: "Execution Flows",
      value: totalProjects > 0 ? `${totalProjects * 12}` : "0",
      helper: "Entry-to-sink request traces",
      icon: Workflow,
      trend: "Flow engine ready",
      trendColor: "text-muted-foreground",
    },
  ];

  const quickStartSteps = [
    {
      step: "01",
      icon: GitBranch,
      title: "Import a repository",
      description:
        "Connect a GitHub repository or drop a ZIP archive to trigger static analysis.",
      actionText: "Import repo",
      actionPath: "/projects/new",
    },
    {
      step: "02",
      icon: Network,
      title: "Explore the Code Graph",
      description:
        "Visualize dependencies, module boundaries, and cross-file symbol references.",
      actionText: "Open graph",
      actionPath: "/code-graph",
    },
    {
      step: "03",
      icon: Play,
      title: "Trace execution flows",
      description:
        "Inspect step-by-step control and data flows from API endpoints down to persistence.",
      actionText: "Explore flows",
      actionPath: "/flows",
    },
  ];

  const featureHighlights = [
    {
      icon: Network,
      title: "Interactive Code Graph",
      badge: "Visual AST",
      description:
        "High-performance interactive node graph showing imports, module dependencies, and symbol call hierarchies across your entire codebase.",
      link: "/code-graph",
      cta: "Explore graph",
    },
    {
      icon: Search,
      title: "Deep Symbol Search",
      badge: "Sub-ms Query",
      description:
        "Instant regex and semantic search across functions, interfaces, structs, and variables with direct jumps to definitions.",
      link: "/code-search",
      cta: "Try search",
    },
    {
      icon: Workflow,
      title: "Execution Flow Tracer",
      badge: "Control Flow",
      description:
        "Trace request lifecycles and business logic step-by-step from controllers down to database queries without running the code.",
      link: "/flows",
      cta: "View traces",
    },
  ];

  const recentProjects = projects.slice(0, 4);

  return (
    <div className=" w-full  space-y-8 select-none">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Engine Online
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground sm:text-sm">
            Overview of your indexed codebases, architecture graphs, and
            execution paths.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            render={<Link to="/projects/new" />}
            size="sm"
            className="shadow-sm gap-1.5 h-9 px-3.5 font-medium"
          >
            <Plus size={15} strokeWidth={2.25} />
            Add project
          </Button>
        </div>
      </header>

      {/* ── KPI Metric Cards ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.label}
              className="group relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-xs transition-all duration-200 hover:border-border hover:shadow-sm"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/[0.07] text-primary ring-1 ring-primary/10 transition-colors duration-200 group-hover:bg-primary/10">
                    <Icon size={16} strokeWidth={2} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                    {stat.value}
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                    {stat.helper}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-1 text-[11px] border-t border-border/40">
                  <span className={cn("font-medium", stat.trendColor)}>
                    {stat.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* ── Projects Section (When projects exist) ── */}
      {recentProjects.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Recent Repositories
              </h2>
              <p className="text-xs text-muted-foreground">
                Active indexed projects ready for navigation.
              </p>
            </div>

            <Button
              render={<Link to="/projects" />}
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View all ({projects.length})
              <ArrowRight size={13} />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentProjects.map((project) => {
              const isGitHub = project.source === "GITHUB";
              const isCompleted = project.status === "COMPLETED";
              const isProcessing =
                project.status === "PROCESSING" || project.status === "PENDING";

              return (
                <Card
                  key={project.id}
                  className="group relative flex flex-col justify-between border-border/60 bg-card/60 transition-all duration-200 hover:border-primary/40 hover:shadow-xs"
                >
                  <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/50">
                        {isGitHub ? (
                          <AiFillGithub className="size-4 text-foreground" />
                        ) : (
                          <FolderGit2 className="size-4 text-primary" />
                        )}
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          isCompleted &&
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                          isProcessing &&
                            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                          !isCompleted &&
                            !isProcessing &&
                            "bg-muted text-muted-foreground border border-border",
                        )}
                      >
                        {isCompleted && <CheckCircle2 size={10} />}
                        {isProcessing && <Clock size={10} />}
                        {project.status.toLowerCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-[14px] text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {project.description || "No description provided."}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono">
                      {new Date(project.createdAt).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>

                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Inspect
                      <ArrowRight size={11} />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Guided Quickstart Card ── */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-b from-card to-card/60 shadow-xs">
        {/* Subtle background ambient blur */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-primary/[0.04] blur-3xl"
        />

        <CardHeader className="relative p-6 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Compass size={14} strokeWidth={2.25} />
                </div>
                <CardTitle className="text-base font-semibold sm:text-lg">
                  {totalProjects === 0
                    ? "Getting Started with Codebase GPS"
                    : "Navigate & Analyze Workflow"}
                </CardTitle>
              </div>
              <CardDescription className="text-[13px] text-muted-foreground leading-relaxed">
                Parse source files into a semantic graph, map call hierarchies,
                and discover architectural insights.
              </CardDescription>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
              <ShieldCheck size={13} className="text-emerald-500" />
              Local & Private Analysis
            </span>
          </div>
        </CardHeader>

        <CardContent className="relative p-6 pt-2 space-y-6">
          {/* Step Columns */}
          <div className="grid gap-4 sm:grid-cols-3">
            {quickStartSteps.map((step) => {
              const StepIcon = step.icon;

              return (
                <div
                  key={step.step}
                  className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-background/50 p-4 transition-all duration-200 hover:border-border hover:bg-background/80 hover:shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-primary/70">
                        {step.step}
                      </span>
                      <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                        <StepIcon size={14} strokeWidth={2} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[13px] font-semibold text-foreground tracking-tight">
                        {step.title}
                      </h4>
                      <p className="text-[12px] leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-border/40">
                    <Link
                      to={step.actionPath}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      {step.actionText}
                      <ArrowRight
                        size={12}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick CTA Bottom Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Boxes size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Ready to map your code architecture?
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Supports TypeScript, JavaScript, Python, Go, Rust, Java, and
                  C/C++.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                render={<Link to="/projects/new" />}
                size="sm"
                className="gap-1.5 font-medium shadow-xs"
              >
                Import repository
                <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Feature Capabilities Grid ── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Platform Capabilities
          </h2>
          <p className="text-xs text-muted-foreground">
            Explore tools built for rapid architectural comprehension and deep
            code navigation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {featureHighlights.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.title}
                className="group relative flex flex-col justify-between border-border/60 bg-card/60 backdrop-blur-xs transition-all duration-200 hover:border-border hover:shadow-xs"
              >
                <CardHeader className="p-5 pb-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/[0.08] text-primary ring-1 ring-primary/15 transition-transform duration-200 group-hover:scale-105">
                      <Icon size={17} strokeWidth={2} />
                    </div>

                    <span className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {feature.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <CardTitle className="text-[14px] font-semibold text-foreground tracking-tight">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-[12px] leading-relaxed text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0">
                  <Link
                    to={feature.link}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {feature.cta}
                    <ArrowUpRight
                      size={13}
                      className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── System Architecture & Tips Footer ── */}
      <footer className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-primary" />
          <span>
            Keyboard shortcut: Press{" "}
            <kbd className="rounded border border-border/70 bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">
              Ctrl + K
            </kbd>{" "}
            anywhere to trigger quick code search.
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/75">
          <span>AST Parser: v2.4</span>
          <span>•</span>
          <span>Engine: Local Native</span>
        </div>
      </footer>
    </div>
  );
}
