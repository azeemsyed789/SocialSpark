import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Calendar from "@/pages/calendar";
import Studio from "@/pages/studio";
import Queue from "@/pages/queue";
import Analytics from "@/pages/analytics";
import Templates from "@/pages/templates";
import Accounts from "@/pages/accounts";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import SchedulePostPage from "@/pages/schedule";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/studio" component={Studio} />
          <Route path="/queue" component={Queue} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/templates" component={Templates} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/settings" component={Settings} />
          <Route path="/schedule" component={SchedulePostPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
