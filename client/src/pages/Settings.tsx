import { Moon, Sun, Bell, Database, Info, FileText, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toggleTheme } from "@/lib/theme";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const handleToggleDarkMode = () => {
    const isDark = toggleTheme();
    setDarkMode(isDark);
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
            <span>About DreamLens</span>
          </Button>
        </Card>

        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3 mb-3">
            <Shield className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold text-body-sm mb-2">Your Privacy Matters</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All dreams are encrypted and stored locally on your device. 
                We never share your personal dream data with third parties.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-muted/50 text-center">
          <p className="text-body-sm text-muted-foreground">
            DreamLens v1.0.0
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Research-backed AI dream interpretation
          </p>
        </Card>
      </div>
    </div>
  );
}
