import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardMetricsResponse } from '../../types/api';

export function MetricsGrid() {
  const { data: metrics, isLoading } = useQuery<DashboardMetricsResponse>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-12 w-12 rounded-lg mb-4" />
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      title: "Daily Posts",
      value: metrics?.dailyPosts || 0,
      trend: metrics?.trends?.dailyPosts || 0,
      icon: "fas fa-paper-plane",
      color: "primary",
    },
    {
      title: "Engagement Rate",
      value: `${((metrics?.engagementRate || 0) * 100).toFixed(1)}%`,
      trend: metrics?.trends?.engagementRate || 0,
      icon: "fas fa-heart",
      color: "secondary",
    },
    {
      title: "Market Fit Score",
      value: metrics?.marketFitScore || 0,
      trend: metrics?.trends?.marketFitScore || 0,
      icon: "fas fa-target",
      color: "chart-3",
    },
    {
      title: "Active Accounts",
      value: metrics?.activeAccounts || 0,
      trend: metrics?.trends?.activeAccounts || 0,
      icon: "fas fa-users",
      color: "chart-4",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => (
        <Card 
          key={metric.title}
          className="metric-card p-6 rounded-lg border border-border cursor-pointer hover:shadow-lg transition-shadow"
          data-testid={`metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 bg-${metric.color}/10 rounded-lg flex items-center justify-center`}>
              <i className={`${metric.icon} text-${metric.color} text-xl`}></i>
            </div>
            <span className={`text-xs bg-${metric.color}/10 text-${metric.color} px-2 py-1 rounded-full`}>
              {metric.trend > 0 ? '+' : ''}{metric.trend}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1" data-testid={`value-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
            {metric.value}
          </h3>
          <p className="text-sm text-muted-foreground">{metric.title}</p>
        </Card>
      ))}
    </div>
  );
}
