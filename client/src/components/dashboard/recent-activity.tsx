import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/dashboard/activity"],
  });

  // Demo data for empty state
  const demoActivities = [
    {
      id: "1",
      status: "completed",
      platform: "tiktok",
      handle: "@creator_account",
      tagline: "SaaS Launch Hook",
      processedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: "2", 
      status: "processing",
      platform: "instagram",
      handle: "@brand_page",
      tagline: "B2B Pain Point Reel",
      processedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  ];

  const displayActivities = Array.isArray(activities) && activities.length > 0 ? activities : demoActivities;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (status: string) => {
    switch (status) {
      case "completed": return { icon: "fas fa-check", color: "chart-3" };
      case "processing": return { icon: "fas fa-robot", color: "primary" };
      case "failed": return { icon: "fas fa-exclamation-triangle", color: "destructive" };
      default: return { icon: "fas fa-clock", color: "muted" };
    }
  };

  const getActivityMessage = (activity: any) => {
    switch (activity.status) {
      case "completed":
        return `Post published successfully to ${activity.platform}`;
      case "processing":
        return `AI generated new content for ${activity.platform}`;
      case "failed":
        return `Post failed to publish to ${activity.platform}`;
      default:
        return `Activity on ${activity.platform}`;
    }
  };

  const getActivityDetails = (activity: any) => {
    const timeAgo = Math.floor((Date.now() - new Date(activity.processedAt).getTime()) / (1000 * 60));
    const timeText = timeAgo < 1 ? "Just now" : 
                     timeAgo === 1 ? "1 minute ago" : 
                     `${timeAgo} minutes ago`;

    if (activity.status === "failed" && activity.error) {
      return `${activity.handle} • ${activity.error} • ${timeText}`;
    }
    
    return `${activity.handle} • "${activity.tagline}" • ${timeText}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.map((activity: any) => {
            const { icon, color } = getActivityIcon(activity.status);
            
            return (
              <div 
                key={activity.id}
                className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg"
                data-testid={`activity-${activity.id}`}
              >
                <div className={`w-10 h-10 bg-${color}/10 rounded-lg flex items-center justify-center`}>
                  <i className={`${icon} text-${color}`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {getActivityMessage(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getActivityDetails(activity)}
                  </p>
                </div>
                <PlatformBadge platform={activity.platform} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
