import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AccountsResponse } from "../types/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { ContentCalendar } from "@/components/dashboard/content-calendar";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { AccountHealth } from "@/components/dashboard/account-health";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function Dashboard() {
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const { data: accounts, isLoading } = useQuery<AccountsResponse>({
    queryKey: ["/api/accounts"],
  });

  const platforms = [
    { name: "Facebook", id: "facebook" },
    { name: "Instagram", id: "instagram" },
    { name: "TikTok", id: "tiktok" },
    { name: "LinkedIn", id: "linkedin" },
    { name: "Google", id: "google" },
    { name: "Discord", id: "discord" },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard"
          description="Welcome back! Here's what's happening with your campaigns."
          actions={
            <Button onClick={() => setIsAccountsModalOpen(true)} className="bg-primary text-primary-foreground">
              <i className="fas fa-users mr-2"></i>
              Connected Accounts
            </Button>
          }
        />
        
        <Dialog open={isAccountsModalOpen} onOpenChange={setIsAccountsModalOpen}>
          <DialogContent>
            <DialogTitle>Connected Accounts</DialogTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {platforms.map(platform => {
                const count = accounts?.filter(acc => acc.platform === platform.id).length || 0;
                return (
                  <Button
                    key={platform.id}
                    variant={selectedPlatform === platform.id ? "default" : "outline"}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className="w-full flex flex-col items-center"
                  >
                    <span className="font-bold mb-1">{platform.name}</span>
                    <span className="text-xs text-muted-foreground">{count} connected</span>
                  </Button>
                );
              })}
            </div>
            {selectedPlatform && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">{platforms.find(p => p.id === selectedPlatform)?.name} Accounts</h4>
                {isLoading ? (
                  <div className="text-muted-foreground">Loading...</div>
                ) : (
                  accounts?.filter(acc => acc.platform === selectedPlatform).length === 0 ? (
                    <div className="text-muted-foreground">No accounts connected</div>
                  ) : (
                    <ul className="space-y-2">
                      {accounts?.filter(acc => acc.platform === selectedPlatform).map(acc => (
                        <li key={acc.id} className="flex items-center justify-between bg-muted rounded px-3 py-2">
                          <span className="font-mono text-xs">{acc.handle}</span>
                          <span className="text-xs text-muted-foreground">{acc.status}</span>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Connected Accounts Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {platforms.map(platform => (
                  <div key={platform.id} className="bg-card rounded-lg p-4 shadow-sm">
                    <div className="font-bold mb-2">{platform.name}</div>
                    {isLoading ? (
                      <div className="text-muted-foreground text-sm">Loading...</div>
                    ) : (
                      <div>
                        {accounts?.filter(acc => acc.platform === platform.id).length === 0 ? (
                          <div className="text-muted-foreground text-sm">No accounts connected</div>
                        ) : (
                          accounts?.filter(acc => acc.platform === platform.id).map(acc => (
                            <div key={acc.id} className="mb-2">
                              <span className="font-mono text-xs bg-muted px-2 py-1 rounded mr-2">{acc.handle}</span>
                              <span className="text-xs text-muted-foreground">{acc.status}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <MetricsGrid />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <div className="lg:col-span-2">
                <ContentCalendar />
              </div>
              
              <div className="space-y-6">
                <QuickActions />
                <AccountHealth />
              </div>
            </div>
            
            <div className="mt-8">
              <RecentActivity />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
