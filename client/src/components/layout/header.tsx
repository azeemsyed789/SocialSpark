import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {actions || (
            <Button 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              data-testid="button-new-campaign"
            >
              <i className="fas fa-plus mr-2"></i>
              New Campaign
            </Button>
          )}
          <div className="relative">
            <button 
              className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/70"
              data-testid="button-notifications"
            >
              <i className="fas fa-bell"></i>
            </button>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
          </div>
        </div>
      </div>
    </header>
  );
}
