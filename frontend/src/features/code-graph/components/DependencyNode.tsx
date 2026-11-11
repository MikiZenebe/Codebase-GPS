import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import {
  FileCode2,
  Package,
  CircleHelp,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import type { DependencyNodeCategory } from "../../../types/dependency";

export interface DependencyGraphNodeData extends Record<string, unknown> {
  label: string;
  path?: string;
  category: DependencyNodeCategory;
  incoming: number;
  outgoing: number;
}

export type DependencyGraphNode = Node<DependencyGraphNodeData, "dependency">;

export default function DependencyNode({
  data,
  selected,
}: NodeProps<DependencyGraphNode>) {
  const isFile = data.category === "file";
  const isPackage = data.category === "package";

  const Icon = isFile ? FileCode2 : isPackage ? Package : CircleHelp;

  const color = isFile
    ? "text-blue-500"
    : isPackage
      ? "text-purple-500"
      : "text-amber-500";

  const border = isFile
    ? "border-blue-500/40"
    : isPackage
      ? "border-purple-500/40"
      : "border-amber-500/40";

  return (
    <div
      className={`
        w-[230px] rounded-xl border bg-card shadow-md
        transition-all
        ${border}
        ${selected ? "ring-2 ring-primary" : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-background !bg-primary"
      />

      <div className="flex items-start gap-3 p-3">
        <div className="rounded-lg bg-muted p-2">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" title={data.label}>
            {data.label}
          </p>

          {data.path && (
            <p
              className="mt-1 truncate text-xs text-muted-foreground"
              title={data.path}
            >
              {data.path}
            </p>
          )}

          <span className="mt-2 inline-block rounded-md bg-muted px-2 py-1 text-[10px] uppercase">
            {data.category}
          </span>
        </div>
      </div>

      <div className="flex justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ArrowDownLeft className="h-3 w-3" />
          {data.incoming} incoming
        </span>

        <span className="flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3" />
          {data.outgoing} outgoing
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-background !bg-primary"
      />
    </div>
  );
}
