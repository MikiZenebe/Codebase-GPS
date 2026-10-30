import { Bell, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="md:hidden font-bold">Codebase GPS</div>

        <div className="hidden items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 md:flex">
          <Search size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Search codebase...
          </span>
          <kbd className="ml-8 rounded border px-1.5 text-xs">Ctrl K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Bell size={18} />
        </Button>

        <Button render={<Link to="/projects/new" />} size="sm">
          <Plus size={16} />
          New project
        </Button>
      </div>
    </header>
  );
}
