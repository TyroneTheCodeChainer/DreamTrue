import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Dreams from "@/pages/Dreams";
import DreamDetail from "@/pages/DreamDetail";
import Patterns from "@/pages/Patterns";
import Settings from "@/pages/Settings";
import BottomNav from "@/components/BottomNav";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { initializeTheme } from "@/lib/theme";

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dreams" component={Dreams} />
        <Route path="/dream/:id" component={DreamDetail} />
        <Route path="/patterns" component={Patterns} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
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
