import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: "fas fa-chart-line" },
  { name: "Calendar", href: "/calendar", icon: "fas fa-calendar-alt" },
  { name: "Studio", href: "/studio", icon: "fas fa-paint-brush" },
  { name: "Queue", href: "/queue", icon: "fas fa-list" },
  { name: "Analytics", href: "/analytics", icon: "fas fa-chart-bar" },
  { name: "Templates", href: "/templates", icon: "fas fa-file-alt" },
  { name: "Accounts", href: "/accounts", icon: "fas fa-users" },
  { name: "Schedule Post", href: "/schedule", icon: "fas fa-clock" }, // Added link
  { name: "Settings", href: "/settings", icon: "fas fa-cog" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Megatron</h1>
            <p className="text-xs text-muted-foreground">Content Automation</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <i className={`${item.icon} w-5`}></i>
                <span className="font-medium">{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <i className="fas fa-user text-primary-foreground text-sm"></i>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {user?.firstName || user?.email || "User"}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.organization?.billingPlan === "agency" ? "Agency Plan" :
               user?.organization?.billingPlan === "pro" ? "Pro Plan" : "Free Plan"}
            </p>
          </div>
          <button 
            onClick={() => window.location.href = "/api/logout"}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-logout"
          >
            <i className="fas fa-sign-out-alt text-sm"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
