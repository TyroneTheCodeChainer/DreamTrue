import { Moon, Sun, Bell, Database, Info, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen pb-20 pt-4">
      <div className="px-4 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">
                  Better for nighttime journaling
                </p>
              </div>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={toggleDarkMode}
              data-testid="switch-dark-mode"
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Dream journal reminders
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            data-testid="button-data"
          >
            <Database className="w-5 h-5" />
            <span>Manage Dream Data</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            data-testid="button-about"
          >
            <Info className="w-5 h-5" />
            <span>About DreamLens</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            data-testid="button-privacy"
          >
            <FileText className="w-5 h-5" />
            <span>Privacy Policy</span>
          </Button>
        </Card>

        <Card className="p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground text-center">
            DreamLens v1.0.0
          </p>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Research-backed AI dream interpretation
          </p>
        </Card>
      </div>
    </div>
  );
}
