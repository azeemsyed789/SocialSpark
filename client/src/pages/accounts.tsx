import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OAuthConnectDialog } from "@/components/oauth/oauth-connect-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { StatusDot } from "@/components/ui/status-dot";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AccountsResponse, DisplayAccount } from '../types/api';


export default function Accounts() {
  const [isOAuthDialogOpen, setIsOAuthDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: accounts, isLoading } = useQuery<AccountsResponse>({
    queryKey: ["/api/accounts"],
  });



  // Demo accounts for empty state
  const demoAccounts = [
    {
      id: "demo-1",
      platform: "tiktok",
      handle: "@creator_account",
      status: "active",
      healthStatus: "healthy",
      lastHealthCheck: new Date().toISOString(),
      features: "Scheduling, Analytics"
    },
    {
      id: "demo-2",
      platform: "instagram", 
      handle: "@brand_page",
      status: "active",
      healthStatus: "caution",
      lastHealthCheck: new Date().toISOString(),
      features: "Stories, Insights"
    },
    {
      id: "demo-3",
      platform: "linkedin",
      handle: "Company Page",
      status: "active", 
      healthStatus: "healthy",
      lastHealthCheck: new Date().toISOString(),
      features: "Recruiting, B2B"
    },
    {
      id: "demo-4",
      platform: "youtube",
      handle: "Tutorial Channel",
      status: "inactive",
      healthStatus: "unknown",
      lastHealthCheck: null,
      features: "Video, Monetization"
    },
  ];

  const displayAccounts = accounts && accounts.length > 0 ? accounts : demoAccounts;
  const filteredAccounts = displayAccounts?.filter((account: DisplayAccount) =>
    account.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-chart-3 text-white";
      case "inactive": return "bg-muted text-muted-foreground";
      case "error": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy": return "text-chart-3";
      case "caution": return "text-chart-4";
      case "error": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getHealthLabel = (health: string) => {
    switch (health) {
      case "healthy": return "Healthy";
      case "caution": return "Caution";
      case "error": return "Error";
      default: return "Unknown";
    }
  };

  const platforms = [
    { name: "TikTok", id: "tiktok", icon: "fab fa-tiktok" },
    { name: "Instagram", id: "instagram", icon: "fab fa-instagram" },
    { name: "Facebook", id: "facebook", icon: "fab fa-facebook" },
  ];

  // Supported platforms
  const supportedPlatforms = [
    { id: "tiktok", name: "TikTok" },
    { id: "instagram", name: "Instagram" },
    { id: "facebook", name: "Facebook" },
    { id: "linkedin", name: "LinkedIn" },
    { id: "discord", name: "Discord" },
    { id: "google", name: "Google" },
    { id: "youtube", name: "YouTube" }
  ];

  // Compute connected account counts per platform
  const accountCounts: Record<string, number> = {};
  for (const platform of supportedPlatforms) {
    accountCounts[platform.id] = displayAccounts.filter(acc => acc.platform === platform.id).length;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Accounts"
          description="Manage and monitor your connected social media accounts."
          actions={
            <Button 
              onClick={() => setIsOAuthDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-connect-account"
            >
              <i className="fas fa-plus mr-2"></i>
              Connect Account
            </Button>
          }
        />
        
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-accounts"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-12" />
                      <div>
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {filteredAccounts?.length === 0 ? (
                <div className="text-center py-20">
                  <i className="fas fa-users text-6xl text-muted-foreground mb-4"></i>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No accounts found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm ? "Try adjusting your search terms." : "Connect your first social media account to get started."}
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setIsOAuthDialogOpen(true)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-connect-first-account"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Connect Account
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAccounts?.map((account: DisplayAccount) => (
                    <Card 
                      key={account.id}
                      className="hover:shadow-lg transition-shadow"
                      data-testid={`account-card-${account.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <PlatformBadge platform={account.platform} />
                            <div>
                              <CardTitle className="text-base">{account.handle}</CardTitle>
                              <CardDescription className="capitalize">{account.platform}</CardDescription>
                            </div>
                          </div>
                          <Badge className={getStatusColor(account.status)}>{account.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Health Status</span>
                            <div className="flex items-center space-x-2">
                              <StatusDot 
                                status={(account.healthStatus || "unknown") === "healthy" ? "posted" : 
                                        (account.healthStatus || "unknown") === "caution" ? "scheduled" : "failed"} 
                              />
                              <span className={`text-sm ${getHealthColor(account.healthStatus || "unknown")}`}>
                                {getHealthLabel(account.healthStatus || "unknown")}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Last Check</span>
                            <span className="text-sm text-foreground">
                              {account.lastHealthCheck ? 
                                new Date(account.lastHealthCheck).toLocaleDateString() : 
                                "Never"
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Features</span>
                            <span className="text-sm text-foreground">
                              {account.features ? account.features.split(',').map(f => <Badge key={f} className="mx-1">{f.trim()}</Badge>) : '—'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 pt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              data-testid={`button-test-${account.id}`}
                            >
                              <i className="fas fa-heart-pulse mr-2"></i>
                              Test Connection
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`button-settings-${account.id}`}
                            >
                              <i className="fas fa-cog"></i>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Account Statistics */}
          {displayAccounts?.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-foreground mb-6">Account Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-check text-chart-3"></i>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {displayAccounts.filter((a: DisplayAccount) => a.status === "active").length}
                        </p>
                        <p className="text-sm text-muted-foreground">Active Accounts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-heart text-chart-4"></i>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {displayAccounts.filter((a: DisplayAccount) => (a.healthStatus || "unknown") === "healthy").length}
                        </p>
                        <p className="text-sm text-muted-foreground">Healthy Accounts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-share-alt text-secondary"></i>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {new Set(displayAccounts.map((a: DisplayAccount) => a.platform)).size}
                        </p>
                        <p className="text-sm text-muted-foreground">Platforms</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-destructive"></i>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {displayAccounts.filter((a: DisplayAccount) => (a.healthStatus || "unknown") === "error").length}
                        </p>
                        <p className="text-sm text-muted-foreground">Need Attention</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <OAuthConnectDialog 
        open={isOAuthDialogOpen}
        onOpenChange={setIsOAuthDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
          toast({
            title: "Success!",
            description: "Account connected successfully with OAuth"
          });
        }}
        accountCounts={accountCounts}
        accounts={displayAccounts}
      />
    </div>
  );
}
