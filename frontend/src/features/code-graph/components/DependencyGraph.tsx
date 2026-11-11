import { useEffect } from "react";

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import DependencyNode, { type DependencyGraphNode } from "./DependencyNode";

const nodeTypes = {
  dependency: DependencyNode,
};

interface Props {
  initialNodes: DependencyGraphNode[];
  initialEdges: Edge[];
  onSelectNode: (node: DependencyGraphNode) => void;
}

export default function DependencyGraph({
  initialNodes,
  initialEdges,
  onSelectNode,
}: Props) {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<DependencyGraphNode>(initialNodes);

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const handleNodeClick: NodeMouseHandler<DependencyGraphNode> = (_, node) => {
    onSelectNode(node);
  };

  return (
    <div className="h-full min-h-[600px] w-full overflow-hidden rounded-xl bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1,
        }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />

        <Controls />

        <MiniMap pannable zoomable nodeStrokeWidth={3} />
      </ReactFlow>
    </div>
  );
}
