import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: string;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "status-scheduled";
      case "posted":
      case "completed":
        return "status-posted";
      case "failed":
      case "error":
        return "status-failed";
      case "draft":
      case "pending":
        return "status-draft";
      default:
        return "status-draft";
    }
  };

  return (
    <span 
      className={cn("status-dot", getStatusClass(status), className)}
      data-testid={`status-dot-${status}`}
    ></span>
  );
}
