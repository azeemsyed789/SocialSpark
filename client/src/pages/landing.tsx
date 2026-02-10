import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20"></div>
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <i className="fas fa-robot text-primary-foreground text-2xl"></i>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Megatron
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The ultimate content automation platform for multi-platform social media publishing, 
              AI-powered content generation, and advanced performance analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
                onClick={() => {
                  if (process.env.NODE_ENV === 'development') {
                    window.location.href = "/dashboard";
                  } else {
                    window.location.href = "/api/login";
                  }
                }}
                data-testid="button-login"
              >
                <i className="fas fa-rocket mr-3"></i>
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-border hover:bg-muted/50 px-8 py-4 text-lg"
                data-testid="button-learn-more"
              >
                <i className="fas fa-play-circle mr-3"></i>
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Features Section */}
      <div className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for content automation
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From AI content generation to advanced analytics, Megatron handles every aspect 
              of your social media presence across all major platforms.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-brain text-primary text-xl"></i>
                </div>
                <CardTitle>AI Content Generation</CardTitle>
                <CardDescription>
                  Generate engaging captions, images, and videos using advanced AI models 
                  tailored for each platform.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-calendar-alt text-secondary text-xl"></i>
                </div>
                <CardTitle>Smart Scheduling</CardTitle>
                <CardDescription>
                  Automated content calendar with optimal posting times, drag-and-drop 
                  scheduling, and bulk import capabilities.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-chart-line text-chart-3 text-xl"></i>
                </div>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Deep insights with A/B testing, market fit scoring, and AI-generated 
                  weekly performance summaries.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-share-alt text-chart-4 text-xl"></i>
                </div>
                <CardTitle>Multi-Platform Publishing</CardTitle>
                <CardDescription>
                  Seamlessly publish to TikTok, Instagram, YouTube, LinkedIn, and Discord from one dashboard.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-chart-5/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-users text-chart-5 text-xl"></i>
                </div>
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Multi-tenant workspaces with role-based permissions, approval workflows, 
                  and white-label reporting.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-shield-alt text-primary text-xl"></i>
                </div>
                <CardTitle>Account Protection</CardTitle>
                <CardDescription>
                  Advanced proxy rotation, rate limiting, and health monitoring to protect 
                  your accounts from bans and restrictions.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
      {/* Pricing Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              No hidden fees. Cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>For individuals and small teams</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    3 social accounts
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    Unlimited scheduling
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    AI content generation
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>For growing teams and agencies</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    Everything in Starter
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    10 social accounts
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    Advanced analytics
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    Team collaboration
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    Everything in Pro
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    Multi-client management
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    White-label reports
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    Team permissions
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-chart-3 mr-3"></i>
                    Dedicated support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                if (process.env.NODE_ENV === 'development') {
                  window.location.href = "/dashboard";
                } else {
                  window.location.href = "/api/login";
                }
              }}
              data-testid="button-start-free"
            >
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </div>
      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-primary/20 to-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to automate your content?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators and agencies who trust Megatron to scale their social media presence.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
            onClick={() => {
              if (process.env.NODE_ENV === 'development') {
                window.location.href = "/dashboard";
              } else {
                window.location.href = "/api/login";
              }
            }}
            data-testid="button-get-started-cta"
          >
            <i className="fas fa-rocket mr-3"></i>
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
}
