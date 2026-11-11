import {
  FileCode2,
  Package,
  CircleHelp,
  ArrowDownLeft,
  ArrowUpRight,
  X,
} from "lucide-react";

import type { DependencyGraphNode } from "./DependencyNode";
import type { RepositoryDependency } from "../../../types/dependency";

interface Props {
  node: DependencyGraphNode | null;
  dependencies: RepositoryDependency[];
  onClose: () => void;
}

export default function DependencyInspector({
  node,
  dependencies,
  onClose,
}: Props) {
  if (!node) return null;

  const Icon =
    node.data.category === "file"
      ? FileCode2
      : node.data.category === "package"
        ? Package
        : CircleHelp;

  const relatedDependencies = dependencies.filter((dependency) => {
    if (node.data.category === "file") {
      return (
        dependency.sourceFileId === node.id ||
        dependency.targetFileId === node.id
      );
    }

    if (node.data.category === "package") {
      return (
        dependency.isExternal &&
        (dependency.packageName || dependency.specifier) === node.data.label
      );
    }

    return (
      !dependency.isExternal &&
      !dependency.targetFileId &&
      dependency.specifier === node.data.label
    );
  });

  return (
    <aside className="flex h-full flex-col border-l bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="h-6 w-6 shrink-0 text-primary" />

          <div className="min-w-0">
            <h2 className="truncate font-semibold">{node.data.label}</h2>

            <p className="text-xs capitalize text-muted-foreground">
              {node.data.category}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspector"
          className="rounded-md p-2 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {node.data.path && (
          <section>
            <h3 className="mb-2 text-sm font-semibold">File path</h3>

            <code className="block break-all rounded-lg bg-muted p-3 text-xs">
              {node.data.path}
            </code>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted p-3">
            <ArrowDownLeft className="mb-2 h-4 w-4" />

            <p className="text-xl font-bold">{node.data.incoming}</p>

            <p className="text-xs text-muted-foreground">Incoming</p>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <ArrowUpRight className="mb-2 h-4 w-4" />

            <p className="text-xl font-bold">{node.data.outgoing}</p>

            <p className="text-xs text-muted-foreground">Outgoing</p>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">
            Dependency relationships
          </h3>

          {relatedDependencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No relationships found.
            </p>
          ) : (
            <div className="space-y-3">
              {relatedDependencies.map((dependency) => (
                <div key={dependency.id} className="rounded-lg border p-3">
                  <p className="break-all text-sm font-medium">
                    {dependency.specifier}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded bg-muted px-2 py-1 text-xs">
                      {dependency.kind}
                    </span>

                    <span className="rounded bg-muted px-2 py-1 text-xs">
                      Line {dependency.line}
                    </span>

                    <span className="rounded bg-muted px-2 py-1 text-xs">
                      {dependency.isExternal
                        ? "External"
                        : dependency.targetFileId
                          ? "Internal"
                          : "Unresolved"}
                    </span>
                  </div>

                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    {dependency.sourceFile.path}
                    {dependency.targetFile
                      ? ` → ${dependency.targetFile.path}`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
