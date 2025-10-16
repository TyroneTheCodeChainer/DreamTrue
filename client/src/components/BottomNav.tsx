import { Home, BookOpen, BarChart3, Settings } from "lucide-react";
import { useLocation, Link } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Dreams", path: "/dreams" },
    { icon: BarChart3, label: "Patterns", path: "/patterns" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-card-border safe-area-inset-bottom">
      <div className="flex justify-around items-center h-20 max-w-7xl mx-auto px-2">
        {tabs.map(({ icon: Icon, label, path }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <button
                data-testid={`nav-${label.toLowerCase()}`}
                className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] rounded-lg transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover-elevate"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? "mb-0.5" : "mb-1"}`} />
                <span className={`text-xs ${isActive ? "font-medium" : ""}`}>
                  {label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
