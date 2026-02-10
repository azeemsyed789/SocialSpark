import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: string;
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const getPlatformConfig = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "tiktok":
        return { label: "TT", className: "tiktok" };
      case "instagram":
        return { label: "IG", className: "instagram" };
      case "youtube":
        return { label: "YT", className: "youtube" };
      case "linkedin":
        return { label: "LI", className: "linkedin" };
      case "discord":
        return { label: "DC", className: "discord" };
      default:
        return { label: "??", className: "default" };
    }
  };

  const config = getPlatformConfig(platform);

  return (
    <span 
      className={cn("platform-badge", config.className, className)}
      data-testid={`platform-badge-${platform}`}
    >
      {config.label}
    </span>
  );
}
