import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import type { DashboardMetricsResponse, PlatformMetricsResponse } from "@/types/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Analytics() {
  const { data: metrics, isLoading } = useQuery<DashboardMetricsResponse>({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/metrics");
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    }
  });
  const { data: platforms = [] } = useQuery<PlatformMetricsResponse[]>({
    queryKey: ["platform-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/overview");
      if (!res.ok) throw new Error("Failed to fetch platform metrics");
      return res.json();
    }
  });

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Analytics"
          description="Deep insights into your content performance and audience engagement."
          actions={
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-generate-report"
            >
              <i className="fas fa-chart-line mr-2"></i>
              Generate Report
            </Button>
          }
        />
        
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {isLoading ? (
            <div>Loading analytics...</div>
          ) : metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Posts</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{metrics.dailyPosts}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{metrics.engagementRate}%</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Market Fit Score</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{metrics.marketFitScore}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active Accounts</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{metrics.activeAccounts}</CardContent>
              </Card>
            </div>
          ) : (
            <div>No analytics data available.</div>
          )}
          <div>
            <h2 className="text-xl font-semibold mb-4">Platform Metrics</h2>
            <div className="w-full h-80 bg-card rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platforms} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalImpressions" fill="#6366f1" name="Impressions" />
                  <Bar dataKey="totalLikes" fill="#10b981" name="Likes" />
                  <Bar dataKey="totalComments" fill="#f59e42" name="Comments" />
                  <Bar dataKey="totalShares" fill="#f43f5e" name="Shares" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* You can add more charts or tables here for detailed analytics */}
          </div>
        </div>
      </main>
    </div>
  );
}
