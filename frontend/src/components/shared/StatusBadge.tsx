import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";

const statusStyles: Record<string, string> = {
  UPLOADING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IMPORTING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ANALYZING:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  READY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  const icons: Record<string, React.ReactNode> = {
    UPLOADING: <Loader2 size={13} className="animate-spin" />,
    IMPORTING: <Loader2 size={13} className="animate-spin" />,
    ANALYZING: <Loader2 size={13} className="animate-spin" />,
    READY: <CheckCircle2 size={13} />,
    FAILED: <AlertCircle size={13} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        statusStyles[status] || "bg-muted text-muted-foreground"
      }`}
    >
      {icons[status] || <Clock size={13} />}
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
}

export default StatusBadge;
