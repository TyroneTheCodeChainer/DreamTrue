import { Moon, Sun, Bell, Database, Info, FileText, Shield, Crown, LogOut, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { toggleTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const { user, isPremium, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect to home if not authenticated (from blueprint pageLevelUnauthorizedErrorHandling)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Please Log In",
        description: "You need to be logged in to access settings.",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const handleToggleDarkMode = () => {
    const isDark = toggleTheme();
    setDarkMode(isDark);
  };

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/cancel-subscription");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Subscription Canceled",
        description: "Your premium subscription has been canceled. You'll retain access until the end of your billing period.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen pb-20 pt-6">
      <div className="px-6 space-y-6">
        <div>
          <h1 className="text-display font-bold">Settings</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Customize your dream journaling experience
          </p>
        </div>

        {/* Account & Subscription Section */}
        <Card className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-body">
                  {user?.firstName || user?.email || "Account"}
                </p>
                {isPremium && (
                  <Badge className="bg-gradient-to-r from-primary to-[#764ba2]">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {isPremium ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  You have access to Deep Dive analysis and persistent dream storage
                </p>
                <Button
                  variant="outline"
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="w-full"
                  data-testid="button-cancel-subscription"
                >
                  {cancelSubscriptionMutation.isPending ? "Canceling..." : "Cancel Subscription"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3 flex items-start gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Quick Insight analysis available • Upgrade to save your dream journey and unlock Deep Dive</span>
                </p>
                <Button
                  onClick={() => setLocation("/subscribe")}
                  className="w-full bg-gradient-to-r from-primary via-secondary to-primary"
                  data-testid="button-upgrade-settings"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </>
            )}
          </div>
        </Card>

        <Card className="p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {darkMode ? (
                <Moon className="w-6 h-6 text-primary" />
              ) : (
                <Sun className="w-6 h-6 text-primary" />
              )}
              <div className="flex-1">
                <p className="font-medium text-body-sm">Dark Mode</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Auto-enabled at night (8PM-7AM)
                </p>
              </div>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={handleToggleDarkMode}
              data-testid="switch-dark-mode"
              className="shrink-0"
            />
          </div>

          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <Bell className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-body-sm">Dream Reminders</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Gentle bedtime journaling prompts
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
                className="shrink-0"
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-4 h-14 text-body-sm"
            data-testid="button-data"
          >
            <Database className="w-6 h-6" />
            <span>Manage Dream Data</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-4 h-14 text-body-sm"
            data-testid="button-privacy"
          >
            <Shield className="w-6 h-6" />
            <span>Privacy & Security</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-4 h-14 text-body-sm"
            data-testid="button-about"
          >
            <Info className="w-6 h-6" />
            <span>About DreamTrue</span>
          </Button>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-secondary/5 to-primary/5 border-secondary/20">
          <div className="flex items-start gap-3 mb-3">
            <Shield className="w-6 h-6 text-secondary shrink-0" />
            <div>
              <h3 className="font-semibold text-body-sm mb-2">Your Privacy Matters</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isPremium 
                  ? "Premium dreams are encrypted and stored securely in your private account. We never share your personal dream data with third parties."
                  : "Your dream analysis is private. Free tier dreams are analyzed securely but not saved. Upgrade for permanent storage."
                }
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-muted/50 text-center">
          <p className="text-body-sm text-muted-foreground">
            DreamTrue v1.0.0
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Research-backed AI dream interpretation
          </p>
        </Card>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
