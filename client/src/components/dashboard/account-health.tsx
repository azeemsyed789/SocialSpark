import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountHealth() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/accounts"],
  });

  // Demo data for empty state
  const demoAccounts = [
    { platform: "tiktok", handle: "@creator_account", healthStatus: "healthy" },
    { platform: "instagram", handle: "@brand_page", healthStatus: "caution" },
    { platform: "linkedin", handle: "Company Page", healthStatus: "healthy" },
  ];

  const displayAccounts = Array.isArray(accounts) && accounts.length > 0 ? accounts : demoAccounts;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-chart-3";
      case "caution": return "text-chart-4";
      case "error": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getHealthLabel = (status: string) => {
    switch (status) {
      case "healthy": return "Healthy";
      case "caution": return "Caution";
      case "error": return "Error";
      default: return "Unknown";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Account Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayAccounts.map((account: any, index: number) => (
            <div 
              key={account.id || index} 
              className="flex items-center justify-between"
              data-testid={`account-health-${account.platform}`}
            >
              <div className="flex items-center space-x-3">
                <PlatformBadge platform={account.platform} />
                <span className="text-sm text-foreground">
                  {account.handle}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <StatusDot 
                  status={account.healthStatus === "healthy" ? "posted" : 
                          account.healthStatus === "caution" ? "scheduled" : "failed"} 
                />
                <span className={`text-xs ${getHealthColor(account.healthStatus)}`}>
                  {getHealthLabel(account.healthStatus)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
