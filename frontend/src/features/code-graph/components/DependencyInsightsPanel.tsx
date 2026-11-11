import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileCode2,
  GitCompareArrows,
  Package,
  Repeat2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";
import type { RepositoryDependency } from "../../../types/dependency";
import {
  computeExternalPackages,
  computeHubFiles,
  computeUnresolvedImports,
  detectCircularDependencies,
} from "../utils/dependency-insights.utils";

type InsightTab = "hubs" | "packages" | "cycles" | "unresolved";

interface DependencyInsightsPanelProps {
  dependencies: RepositoryDependency[];
  activeNodeId?: string | null;
  onFocusNodeId: (nodeId: string) => void;
}

export default function DependencyInsightsPanel({
  dependencies,
  activeNodeId,
  onFocusNodeId,
}: DependencyInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<InsightTab>("hubs");

  const { mostImported, highestFanOut } = useMemo(
    () => computeHubFiles(dependencies),
    [dependencies],
  );
  const externalPackages = useMemo(
    () => computeExternalPackages(dependencies),
    [dependencies],
  );
  const unresolvedImports = useMemo(
    () => computeUnresolvedImports(dependencies),
    [dependencies],
  );
  const cycles = useMemo(
    () => detectCircularDependencies(dependencies),
    [dependencies],
  );

  const tabs: {
    id: InsightTab;
    label: string;
    count: number;
    icon: typeof GitCompareArrows;
    tone?: string;
  }[] = [
    {
      id: "hubs",
      label: "Hub Files",
      count: mostImported.length + highestFanOut.length,
      icon: GitCompareArrows,
    },
    {
      id: "packages",
      label: "External Packages",
      count: externalPackages.length,
      icon: Package,
    },
    {
      id: "cycles",
      label: "Circular Deps",
      count: cycles.length,
      icon: Repeat2,
      tone: cycles.length > 0 ? "text-amber-500" : "text-emerald-500",
    },
    {
      id: "unresolved",
      label: "Unresolved",
      count: unresolvedImports.length,
      icon: AlertTriangle,
      tone: unresolvedImports.length > 0 ? "text-amber-500" : undefined,
    },
  ];

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            Architecture Insights
          </CardTitle>
          <CardDescription className="text-xs">
            Click any file, package, or import to highlight and inspect it in
            the graph above.
          </CardDescription>
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/60 bg-muted/40 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  size={13}
                  className={cn(!isActive && tab.tone ? tab.tone : undefined)}
                />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums leading-none",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {activeTab === "hubs" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Most Imported */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ArrowDownLeft size={13} className="text-blue-500" />
                  Most Imported Files
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Core shared modules
                </span>
              </div>

              {mostImported.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
                  No internal file imports found.
                </p>
              ) : (
                <div className="space-y-2">
                  {mostImported.map((item) => (
                    <button
                      key={`in-${item.file.id}`}
                      type="button"
                      onClick={() => onFocusNodeId(item.file.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40",
                        activeNodeId === item.file.id &&
                          "border-primary bg-primary/5",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FileCode2
                          size={15}
                          className="shrink-0 text-blue-500"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">
                            {item.file.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {item.file.path}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="secondary" className="tabular-nums">
                          {item.incoming} in
                        </Badge>
                        <Badge variant="outline" className="tabular-nums">
                          {item.outgoing} out
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Highest Fan-Out */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ArrowUpRight size={13} className="text-primary" />
                  Highest Outgoing Imports
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Orchestrators & entrypoints
                </span>
              </div>

              {highestFanOut.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
                  No outgoing imports found.
                </p>
              ) : (
                <div className="space-y-2">
                  {highestFanOut.map((item) => (
                    <button
                      key={`out-${item.file.id}`}
                      type="button"
                      onClick={() => onFocusNodeId(item.file.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40",
                        activeNodeId === item.file.id &&
                          "border-primary bg-primary/5",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FileCode2
                          size={15}
                          className="shrink-0 text-blue-500"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">
                            {item.file.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {item.file.path}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="secondary" className="tabular-nums">
                          {item.outgoing} out
                        </Badge>
                        <Badge variant="outline" className="tabular-nums">
                          {item.incoming} in
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "packages" && (
          <div>
            {externalPackages.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                No external package imports detected.
              </p>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {externalPackages.map((pkg) => (
                  <button
                    key={pkg.nodeId}
                    type="button"
                    onClick={() => onFocusNodeId(pkg.nodeId)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40",
                      activeNodeId === pkg.nodeId &&
                        "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Package
                        size={15}
                        className="shrink-0 text-purple-500"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">
                          {pkg.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Used in {pkg.fileCount}{" "}
                          {pkg.fileCount === 1 ? "file" : "files"}
                        </p>
                      </div>
                    </div>

                    <Badge variant="secondary" className="shrink-0 tabular-nums">
                      {pkg.importCount}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "cycles" && (
          <div>
            {cycles.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>
                  No circular dependencies detected across internal repository
                  files.
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cycles.map((cycle, idx) => (
                  <div
                    key={`${cycle.id}-${idx}`}
                    className="flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
                  >
                    <Repeat2
                      size={14}
                      className="mr-1 shrink-0 text-amber-500"
                    />
                    {cycle.files.map((file, fileIdx) => (
                      <div
                        key={`${file.id}-${fileIdx}`}
                        className="flex items-center gap-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => onFocusNodeId(file.id)}
                          title={file.path}
                          className={cn(
                            "rounded-md border bg-background px-2 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary",
                            activeNodeId === file.id &&
                              "border-primary text-primary",
                          )}
                        >
                          {file.name}
                        </button>
                        {fileIdx < cycle.files.length - 1 && (
                          <ArrowRight
                            size={12}
                            className="text-muted-foreground"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "unresolved" && (
          <div>
            {unresolvedImports.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>All internal import specifiers resolved cleanly.</span>
              </div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {unresolvedImports.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onFocusNodeId(item.nodeId)}
                    className={cn(
                      "flex w-full flex-col justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 sm:flex-row sm:items-center",
                      activeNodeId === item.nodeId &&
                        "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AlertTriangle
                        size={15}
                        className="shrink-0 text-amber-500"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-semibold">
                          {item.specifier}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {item.sourceFile.path}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge variant="outline">{item.kind}</Badge>
                      <Badge variant="secondary" className="tabular-nums">
                        Line {item.line}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

