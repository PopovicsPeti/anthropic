import { Loader2 } from "lucide-react";

export interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "call" | "partial-call" | "result";
  result?: unknown;
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const filePath = typeof args.path === "string" ? args.path : undefined;
  const filename = filePath ? filePath.replace(/\\/g, "/").split("/").pop() : undefined;
  const command = typeof args.command === "string" ? args.command : undefined;

  const withFile = (action: string) =>
    filename ? `${action} ${filename}` : action;

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return withFile("Creating");
      case "str_replace":
      case "insert":
        return withFile("Editing");
      case "view":
        return withFile("Reading");
      case "undo_edit":
        return withFile("Undoing edit in");
      default:
        return withFile("Working on");
    }
  }

  if (toolName === "file_manager") {
    switch (command) {
      case "rename":
        return withFile("Renaming");
      case "delete":
        return withFile("Deleting");
      default:
        return withFile("Managing");
    }
  }

  return "Working on files";
}

export function ToolCallBadge({ toolName, args, state, result }: ToolCallBadgeProps) {
  const label = getLabel(toolName, args);
  const isDone = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
