import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import Subscribe from "@/pages/Subscribe";
import Dreams from "@/pages/Dreams";
import DreamDetail from "@/pages/DreamDetail";
import Results from "@/pages/Results";
import Patterns from "@/pages/Patterns";
import Settings from "@/pages/Settings";
import BottomNav from "@/components/BottomNav";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { initializeTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  // From javascript_log_in_with_replit blueprint
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <Switch>
        <Route path="/">
          {isLoading || !isAuthenticated ? <Landing /> : <Home />}
        </Route>
        <Route path="/subscribe" component={Subscribe} />
        <Route path="/results" component={Results} />
        <Route path="/dreams" component={Dreams} />
        <Route path="/dream/:id" component={DreamDetail} />
        <Route path="/patterns" component={Patterns} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      {isAuthenticated && <BottomNav />}
    </>
  );
}

export default function App() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
