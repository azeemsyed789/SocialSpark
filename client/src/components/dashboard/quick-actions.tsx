import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Link href="/studio">
            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="quick-action-generate"
            >
              <i className="fas fa-paint-brush mr-2"></i>
              Generate Content
            </Button>
          </Link>
          
          <Link href="/calendar">
            <Button 
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
              data-testid="quick-action-schedule"
            >
              <i className="fas fa-calendar-plus mr-2"></i>
              Schedule Post
            </Button>
          </Link>
          
          <Link href="/analytics">
            <Button 
              variant="outline"
              className="w-full border-border hover:bg-muted/50"
              data-testid="quick-action-ab-test"
            >
              <i className="fas fa-flask mr-2"></i>
              Create A/B Test
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
