import dagre from "@dagrejs/dagre";

import { MarkerType, type Edge, type Node } from "@xyflow/react";

import type {
  RepositoryDependency,
  DependencyFilter,
  DependencyNodeCategory,
} from "../../../types/dependency";

import type { DependencyGraphNodeData } from "../components/DependencyNode";

export type DependencyGraphNode = Node<DependencyGraphNodeData, "dependency">;

interface GraphResult {
  nodes: DependencyGraphNode[];
  edges: Edge[];
}

const NODE_WIDTH = 230;
const NODE_HEIGHT = 105;

export function buildDependencyGraph(
  dependencies: RepositoryDependency[],
  filter: DependencyFilter = "all",
): GraphResult {
  const nodeMap = new Map<string, DependencyGraphNode>();

  const edgeMap = new Map<
    string,
    {
      source: string;
      target: string;
      count: number;
      kinds: Set<string>;
    }
  >();

  const ensureNode = (
    id: string,
    label: string,
    category: DependencyNodeCategory,
    path?: string,
  ) => {
    if (nodeMap.has(id)) return;

    nodeMap.set(id, {
      id,
      type: "dependency",
      position: { x: 0, y: 0 },
      data: {
        label,
        path,
        category,
        incoming: 0,
        outgoing: 0,
      },
    });
  };

  for (const dependency of dependencies) {
    const category: DependencyFilter = dependency.isExternal
      ? "external"
      : dependency.targetFileId
        ? "internal"
        : "unresolved";

    if (filter !== "all" && filter !== category) {
      continue;
    }

    const sourceId = dependency.sourceFileId;

    ensureNode(
      sourceId,
      dependency.sourceFile.name,
      "file",
      dependency.sourceFile.path,
    );

    let targetId: string;

    if (dependency.isExternal) {
      const packageName = dependency.packageName || dependency.specifier;

      targetId = `package:${packageName}`;

      ensureNode(targetId, packageName, "package");
    } else if (dependency.targetFileId && dependency.targetFile) {
      targetId = dependency.targetFileId;

      ensureNode(
        targetId,
        dependency.targetFile.name,
        "file",
        dependency.targetFile.path,
      );
    } else {
      targetId = `unresolved:${dependency.specifier}`;

      ensureNode(targetId, dependency.specifier, "unresolved");
    }

    const edgeKey = `${sourceId}->${targetId}`;

    const existing = edgeMap.get(edgeKey);

    if (existing) {
      existing.count++;
      existing.kinds.add(dependency.kind);
    } else {
      edgeMap.set(edgeKey, {
        source: sourceId,
        target: targetId,
        count: 1,
        kinds: new Set([dependency.kind]),
      });
    }
  }

  const edges: Edge[] = [];

  for (const [key, edge] of edgeMap) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);

    if (!source || !target) continue;

    source.data.outgoing += edge.count;
    target.data.incoming += edge.count;

    edges.push({
      id: key,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      label: edge.count > 1 ? `${edge.count} imports` : [...edge.kinds][0],
      style: {
        strokeWidth: 1.7,
      },
      labelStyle: {
        fontSize: 10,
      },
    });
  }

  // Automatic left-to-right layout.
  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));

  graph.setGraph({
    rankdir: "LR",
    nodesep: 65,
    ranksep: 110,
    marginx: 40,
    marginy: 40,
  });

  for (const node of nodeMap.values()) {
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  const nodes = Array.from(nodeMap.values()).map((node) => {
    const position = graph.node(node.id);

    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes, edges };
}
