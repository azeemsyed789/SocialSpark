import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlan = user?.organization?.billingPlan || "free";
  const planConfig = {
    free: {
      name: "Free",
      price: "$0",
      features: ["10 posts/day", "1 workspace", "Basic analytics", "Community support"]
    },
    pro: {
      name: "Pro", 
      price: "$29",
      features: ["Unlimited posts", "AI content generation", "A/B testing", "Market fit scoring"]
    },
    agency: {
      name: "Agency",
      price: "$149", 
      features: ["Everything in Pro", "Multi-client management", "White-label reports", "Team permissions"]
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Settings"
          description="Manage your account, organization, and platform preferences."
        />
        
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
              <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
              <TabsTrigger value="integrations" data-testid="tab-integrations">Integrations</TabsTrigger>
              <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        defaultValue={user?.firstName || ""} 
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        defaultValue={user?.lastName || ""} 
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      defaultValue={user?.email || ""} 
                      data-testid="input-email"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                  <CardDescription>
                    Manage your organization details and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input 
                      id="orgName" 
                      defaultValue={user?.organization?.name || "My Organization"} 
                      data-testid="input-org-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="america/new_york">
                      <SelectTrigger data-testid="select-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="america/new_york">Eastern Time (ET)</SelectItem>
                        <SelectItem value="america/chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="america/denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="america/los_angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Preferences</CardTitle>
                  <CardDescription>
                    Configure default settings for content generation and scheduling.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-generate hashtags</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically suggest relevant hashtags for new content
                      </p>
                    </div>
                    <Switch defaultChecked data-testid="switch-auto-hashtags" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>FOMO tone</Label>
                      <p className="text-sm text-muted-foreground">
                        Include fear-of-missing-out elements in generated content
                      </p>
                    </div>
                    <Switch data-testid="switch-fomo-tone" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Smart scheduling</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically optimize posting times based on audience engagement
                      </p>
                    </div>
                    <Switch defaultChecked data-testid="switch-smart-scheduling" />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isLoading}
                  data-testid="button-save-general"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </TabsContent>

            {/* Billing Settings */}
            <TabsContent value="billing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    Manage your subscription and billing information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold">{planConfig[currentPlan as keyof typeof planConfig].name} Plan</h3>
                        <Badge variant="outline" className="capitalize">{currentPlan}</Badge>
                      </div>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {planConfig[currentPlan as keyof typeof planConfig].price}
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        {planConfig[currentPlan as keyof typeof planConfig].features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <i className="fas fa-check text-chart-3 mr-2"></i>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {currentPlan !== "agency" && (
                      <Button data-testid="button-upgrade-plan">
                        <i className="fas fa-arrow-up mr-2"></i>
                        Upgrade Plan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                  <CardDescription>
                    Track your current usage against plan limits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Posts this month</span>
                      <span>847 / {currentPlan === "free" ? "300" : "Unlimited"}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: currentPlan === "free" ? "85%" : "45%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>AI generations</span>
                      <span>156 / {currentPlan === "free" ? "0" : "Unlimited"}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: currentPlan === "free" ? "0%" : "25%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Workspaces</span>
                      <span>1 / {currentPlan === "free" ? "1" : "Unlimited"}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-chart-3 h-2 rounded-full" style={{ width: "100%" }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {currentPlan !== "free" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Billing Information</CardTitle>
                    <CardDescription>
                      Update your payment method and billing address.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <i className="fab fa-cc-visa text-2xl text-primary"></i>
                          <div>
                            <p className="font-medium">Visa ending in 4242</p>
                            <p className="text-sm text-muted-foreground">Expires 12/25</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" data-testid="button-update-payment">
                          Update
                        </Button>
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <Button variant="outline" data-testid="button-download-invoices">
                        <i className="fas fa-download mr-2"></i>
                        Download Invoices
                      </Button>
                      <Button variant="outline" data-testid="button-cancel-subscription">
                        Cancel Subscription
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>
                    Choose which email notifications you'd like to receive.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: "post-success", label: "Post published successfully", description: "Get notified when posts are published" },
                    { id: "post-failed", label: "Post failed", description: "Get notified when posts fail to publish" },
                    { id: "account-health", label: "Account health alerts", description: "Get notified about account connection issues" },
                    { id: "ab-test-results", label: "A/B test results", description: "Get notified when A/B tests conclude" },
                    { id: "weekly-summary", label: "Weekly performance summary", description: "Receive AI-generated weekly reports" },
                    { id: "billing-updates", label: "Billing and subscription updates", description: "Important billing notifications" }
                  ].map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{notification.label}</Label>
                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                      </div>
                      <Switch 
                        defaultChecked={notification.id !== "weekly-summary"} 
                        data-testid={`switch-${notification.id}`}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>In-App Notifications</CardTitle>
                  <CardDescription>
                    Configure notifications that appear within the application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: "real-time-updates", label: "Real-time updates", description: "Show live notifications for ongoing activities" },
                    { id: "browser-notifications", label: "Browser notifications", description: "Allow browser push notifications" },
                    { id: "sound-alerts", label: "Sound alerts", description: "Play sounds for important notifications" }
                  ].map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{notification.label}</Label>
                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                      </div>
                      <Switch 
                        defaultChecked={notification.id === "real-time-updates"} 
                        data-testid={`switch-${notification.id}`}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integration Settings */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage your API keys for external services.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Gemini AI", status: "connected", masked: "sk-...HQ4A" },
                    { name: "HeyGen", status: "connected", masked: "hg-...2k4B" },
                    { name: "Buffer Webhook", status: "connected", masked: "https://hook.us2.make.com/..." },
                    { name: "Stable Diffusion", status: "not-connected", masked: null }
                  ].map((integration) => (
                    <div key={integration.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${integration.status === "connected" ? "bg-chart-3" : "bg-muted"}`}></div>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          {integration.masked && (
                            <p className="text-sm text-muted-foreground font-mono">{integration.masked}</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-${integration.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {integration.status === "connected" ? "Update" : "Connect"}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Webhook Settings</CardTitle>
                  <CardDescription>
                    Configure webhooks for external integrations and automations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input 
                      id="webhook-url" 
                      placeholder="https://your-webhook-endpoint.com/megatron"
                      data-testid="input-webhook-url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Webhook Events</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "post.published", "post.failed", "account.health_changed", 
                        "ab_test.completed", "campaign.started", "campaign.completed"
                      ].map((event) => (
                        <div key={event} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id={event} 
                            className="rounded" 
                            data-testid={`checkbox-${event}`}
                          />
                          <Label htmlFor={event} className="text-sm font-mono">{event}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                  <CardDescription>
                    Manage your authentication settings and security preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <Badge variant="outline">Not Enabled</Badge>
                    </div>
                    <Button className="mt-3" variant="outline" data-testid="button-enable-2fa">
                      <i className="fas fa-shield-alt mr-2"></i>
                      Enable 2FA
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Session Management</p>
                        <p className="text-sm text-muted-foreground">Manage your active sessions across devices</p>
                      </div>
                    </div>
                    <Button className="mt-3" variant="outline" data-testid="button-manage-sessions">
                      <i className="fas fa-laptop mr-2"></i>
                      Manage Sessions
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data & Privacy</CardTitle>
                  <CardDescription>
                    Control your data privacy and account security settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Activity logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Log account activity for security monitoring
                      </p>
                    </div>
                    <Switch defaultChecked data-testid="switch-activity-logging" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Analytics collection</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anonymous usage analytics to improve the platform
                      </p>
                    </div>
                    <Switch defaultChecked data-testid="switch-analytics-collection" />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-export-data">
                      <i className="fas fa-download mr-2"></i>
                      Export Account Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-destructive" data-testid="button-delete-account">
                      <i className="fas fa-trash mr-2"></i>
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
