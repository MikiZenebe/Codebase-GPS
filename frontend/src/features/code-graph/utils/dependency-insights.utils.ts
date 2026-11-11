import type { Edge } from "@xyflow/react";
import type {
  DependencyFile,
  DependencyKind,
  RepositoryDependency,
} from "../../../types/dependency";

export interface HubFileStat {
  file: DependencyFile;
  incoming: number;
  outgoing: number;
}

export interface ExternalPackageStat {
  name: string;
  nodeId: string;
  importCount: number;
  fileCount: number;
  kinds: DependencyKind[];
}

export interface UnresolvedImportStat {
  id: string;
  nodeId: string;
  specifier: string;
  kind: DependencyKind;
  line: number;
  sourceFile: DependencyFile;
}

export interface CircularDependency {
  id: string;
  files: DependencyFile[];
}

export function computeHubFiles(
  dependencies: RepositoryDependency[],
  limit = 6,
): { mostImported: HubFileStat[]; highestFanOut: HubFileStat[] } {
  const stats = new Map<string, HubFileStat>();

  const ensureFile = (file: DependencyFile) => {
    let entry = stats.get(file.id);
    if (!entry) {
      entry = { file, incoming: 0, outgoing: 0 };
      stats.set(file.id, entry);
    }
    return entry;
  };

  for (const dep of dependencies) {
    const source = ensureFile(dep.sourceFile);
    source.outgoing += 1;

    if (!dep.isExternal && dep.targetFileId && dep.targetFile) {
      const target = ensureFile(dep.targetFile);
      target.incoming += 1;
    }
  }

  const all = Array.from(stats.values());

  const mostImported = all
    .filter((item) => item.incoming > 0)
    .sort((a, b) => b.incoming - a.incoming || b.outgoing - a.outgoing)
    .slice(0, limit);

  const highestFanOut = all
    .filter((item) => item.outgoing > 0)
    .sort((a, b) => b.outgoing - a.outgoing || b.incoming - a.incoming)
    .slice(0, limit);

  return { mostImported, highestFanOut };
}

export function computeExternalPackages(
  dependencies: RepositoryDependency[],
): ExternalPackageStat[] {
  const pkgMap = new Map<
    string,
    {
      name: string;
      importCount: number;
      fileIds: Set<string>;
      kinds: Set<DependencyKind>;
    }
  >();

  for (const dep of dependencies) {
    if (!dep.isExternal) continue;

    const name = dep.packageName || dep.specifier;
    let entry = pkgMap.get(name);
    if (!entry) {
      entry = {
        name,
        importCount: 0,
        fileIds: new Set(),
        kinds: new Set(),
      };
      pkgMap.set(name, entry);
    }

    entry.importCount += 1;
    entry.fileIds.add(dep.sourceFileId);
    entry.kinds.add(dep.kind);
  }

  return Array.from(pkgMap.values())
    .map((entry) => ({
      name: entry.name,
      nodeId: `package:${entry.name}`,
      importCount: entry.importCount,
      fileCount: entry.fileIds.size,
      kinds: Array.from(entry.kinds),
    }))
    .sort((a, b) => b.importCount - a.importCount || a.name.localeCompare(b.name));
}

export function computeUnresolvedImports(
  dependencies: RepositoryDependency[],
): UnresolvedImportStat[] {
  return dependencies
    .filter((dep) => !dep.isExternal && !dep.targetFileId)
    .map((dep) => ({
      id: dep.id,
      nodeId: `unresolved:${dep.specifier}`,
      specifier: dep.specifier,
      kind: dep.kind,
      line: dep.line,
      sourceFile: dep.sourceFile,
    }))
    .sort(
      (a, b) =>
        a.sourceFile.path.localeCompare(b.sourceFile.path) || a.line - b.line,
    );
}

/**
 * Finds simple directed cycles among internal repository files using
 * Tarjan's SCC decomposition followed by bounded canonical DFS.
 */
export function detectCircularDependencies(
  dependencies: RepositoryDependency[],
  maxCycles = 20,
): CircularDependency[] {
  const adj = new Map<string, Set<string>>();
  const fileById = new Map<string, DependencyFile>();
  const cycles: CircularDependency[] = [];
  const seenSelfLoops = new Set<string>();

  for (const dep of dependencies) {
    if (dep.isExternal || !dep.targetFileId || !dep.targetFile) continue;

    fileById.set(dep.sourceFileId, dep.sourceFile);
    fileById.set(dep.targetFileId, dep.targetFile);

    if (dep.sourceFileId === dep.targetFileId) {
      if (!seenSelfLoops.has(dep.sourceFileId) && cycles.length < maxCycles) {
        seenSelfLoops.add(dep.sourceFileId);
        cycles.push({
          id: `${dep.sourceFileId}->${dep.sourceFileId}`,
          files: [dep.sourceFile, dep.sourceFile],
        });
      }
      continue;
    }

    let targets = adj.get(dep.sourceFileId);
    if (!targets) {
      targets = new Set();
      adj.set(dep.sourceFileId, targets);
    }
    targets.add(dep.targetFileId);
  }

  // Tarjan's Strongly Connected Components to prune DAG nodes in O(V + E).
  let indexCounter = 0;
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  const strongConnect = (v: string) => {
    indices.set(v, indexCounter);
    lowlink.set(v, indexCounter);
    indexCounter += 1;
    stack.push(v);
    onStack.add(v);

    for (const w of adj.get(v) ?? []) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    if (lowlink.get(v) === indices.get(v)) {
      const component: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        component.push(w);
      } while (w !== v);

      if (component.length > 1) {
        sccs.push(component);
      }
    }
  };

  for (const nodeId of adj.keys()) {
    if (!indices.has(nodeId)) {
      strongConnect(nodeId);
    }
  }

  const MAX_CYCLE_DEPTH = 8;

  for (const component of sccs) {
    if (cycles.length >= maxCycles) break;
    const sccSet = new Set(component);
    const sorted = [...component].sort();

    for (const startId of sorted) {
      if (cycles.length >= maxCycles) break;

      const path = [startId];
      const inPath = new Set([startId]);

      const dfs = (currentId: string) => {
        if (cycles.length >= maxCycles || path.length > MAX_CYCLE_DEPTH) {
          return;
        }

        const neighbors = Array.from(adj.get(currentId) ?? [])
          .filter((n) => sccSet.has(n) && n >= startId)
          .sort();

        for (const nextId of neighbors) {
          if (cycles.length >= maxCycles) return;

          if (nextId === startId && path.length >= 2) {
            const files = [...path, startId]
              .map((id) => fileById.get(id))
              .filter((f): f is DependencyFile => Boolean(f));

            cycles.push({
              id: path.join("->"),
              files,
            });
          } else if (!inPath.has(nextId)) {
            inPath.add(nextId);
            path.push(nextId);
            dfs(nextId);
            path.pop();
            inPath.delete(nextId);
          }
        }
      };

      dfs(startId);
    }
  }

  return cycles;
}

export function getNeighborhoodNodeIds(
  nodeId: string,
  edges: Edge[],
): Set<string> {
  const neighbors = new Set<string>([nodeId]);
  for (const edge of edges) {
    if (edge.source === nodeId) {
      neighbors.add(edge.target);
    } else if (edge.target === nodeId) {
      neighbors.add(edge.source);
    }
  }
  return neighbors;
}

