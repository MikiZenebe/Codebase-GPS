import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderGit2,
  Network,
  Search,
  Workflow,
  Settings,
  Compass,
} from "lucide-react";

const navigation = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Projects", path: "/projects", icon: FolderGit2 },
      { label: "Code Graph", path: "/code-graph", icon: Network },
      { label: "Code Search", path: "/code-search", icon: Search },
      { label: "Flows", path: "/flows", icon: Workflow },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Compass size={21} />
        </div>

        <div>
          <h1 className="font-bold tracking-tight">Codebase GPS</h1>
          <p className="text-xs text-muted-foreground">Navigate your code</p>
        </div>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto p-4">
        {navigation.map((group) => (
          <div key={group.title}>
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>

            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t p-4">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings size={18} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
