import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderGit2,
  Network,
  Search,
  Workflow,
  Settings,
  Compass,
  Cpu,
} from "lucide-react";
import { useGetProjectsQuery } from "../../services/projectApi";
import { cn } from "../../lib/utils";

interface NavigationItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
  shortcut?: string;
  isBeta?: boolean;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export function Sidebar() {
  const { data: projects = [] } = useGetProjectsQuery();

  const navigation: NavigationSection[] = [
    {
      title: "Workspace",
      items: [
        {
          label: "Dashboard",
          path: "/",
          icon: LayoutDashboard,
        },
        {
          label: "Projects",
          path: "/projects",
          icon: FolderGit2,
          badge: projects.length > 0 ? projects.length : undefined,
        },
      ],
    },
    {
      title: "Analysis & Graph",
      items: [
        {
          label: "Code Graph",
          path: "/code-graph",
          icon: Network,
          isBeta: true,
        },
        {
          label: "Code Search",
          path: "/code-search",
          icon: Search,
          shortcut: "⌘K",
        },
        {
          label: "Execution Flows",
          path: "/flows",
          icon: Workflow,
          isBeta: true,
        },
      ],
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-border/60 bg-sidebar/70 backdrop-blur-md md:flex select-none">
      {/* ── Brand Header ── */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 px-4">
        <NavLink
          to="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/25 ring-1 ring-primary/20">
            <Compass size={18} strokeWidth={2.25} />
            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-semibold tracking-tight text-foreground">
                Codebase GPS
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground/75 font-medium">
              Code Intelligence
            </span>
          </div>
        </NavLink>

        <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tracking-wide">
          BETA
        </span>
      </div>

      {/* ── Navigation List ── */}
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
        {navigation.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.title}
            </div>

            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            size={16}
                            strokeWidth={isActive ? 2.25 : 1.75}
                            className={cn(
                              "shrink-0 transition-transform duration-200 group-hover:scale-105",
                              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {/* Right side indicators */}
                        <div className="flex items-center gap-1.5">
                          {item.badge !== undefined && (
                            <span
                              className={cn(
                                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums leading-none",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}

                          {item.isBeta && (
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground/70 bg-muted/60 uppercase">
                              Preview
                            </span>
                          )}

                          {item.shortcut && (
                            <kbd className="hidden h-5 items-center gap-0.5 rounded border border-border/60 bg-muted/40 px-1.5 font-mono text-[10px] text-muted-foreground lg:inline-flex">
                              {item.shortcut}
                            </kbd>
                          )}
                        </div>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* ── System Health / Quick Widget ── */}
      <div className="p-3">
        <div className="rounded-xl border border-border/50 bg-card/60 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium text-foreground">
                Engine Active
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              AST v2.4
            </span>
          </div>

          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/80">
            Graph analysis and symbol indexing are ready.
          </p>

          <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Cpu size={11} /> Local runtime
            </span>
            <span className="font-medium text-foreground/80">0.4 ms lag</span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-border/50 p-3 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isActive
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )
          }
        >
          <div className="flex items-center gap-2.5">
            <Settings
              size={16}
              strokeWidth={1.75}
              className="shrink-0 transition-transform duration-300 ease-out group-hover:rotate-45"
            />
            <span>Settings</span>
          </div>

          <span className="text-[10px] font-mono text-muted-foreground/60">
            v0.1.0
          </span>
        </NavLink>
      </div>
    </aside>
  );
}
