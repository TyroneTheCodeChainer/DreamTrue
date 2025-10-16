import StatsCard from "@/components/StatsCard";
import EmptyState from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Moon, TrendingUp, Target, Star, Lightbulb } from "lucide-react";
import { useLocation } from "wouter";

export default function Patterns() {
  const [, setLocation] = useLocation();

  const hasData = true;

  const stats = {
    totalDreams: 24,
    avgConfidence: 78,
    highConfidence: 12,
    uniqueSymbols: 18,
  };

  const topSymbols = [
    { name: "flying", count: 8 },
    { name: "water", count: 6 },
    { name: "chase", count: 5 },
    { name: "teeth", count: 4 },
    { name: "house", count: 3 },
  ];

  if (!hasData) {
    return (
      <div className="min-h-screen pb-20 pt-4">
        <EmptyState type="patterns" onAction={() => setLocation("/")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-4">
      <div className="px-4 space-y-6">
        <h1 className="text-2xl font-bold">Dream Patterns</h1>

        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            icon={Moon}
            value={stats.totalDreams}
            label="Total Dreams"
            gradient
          />
          <StatsCard
            icon={TrendingUp}
            value={`${stats.avgConfidence}%`}
            label="Avg Confidence"
            gradient
          />
          <StatsCard
            icon={Target}
            value={stats.highConfidence}
            label="High Confidence"
          />
          <StatsCard
            icon={Star}
            value={stats.uniqueSymbols}
            label="Unique Symbols"
          />
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Most Common Symbols
          </h3>
          <div className="space-y-3">
            {topSymbols.map((symbol) => (
              <div
                key={symbol.name}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <span className="capitalize font-medium">
                  {symbol.name.replace("_", " ")}
                </span>
                <Badge variant="secondary">{symbol.count}x</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            AI Insights
          </h3>
          <div className="space-y-3">
            <p className="text-sm text-foreground/80">
              You frequently dream about <strong>flying</strong>, which often
              indicates a desire for freedom or escape from daily pressures.
            </p>
            <p className="text-sm text-foreground/80">
              Your average confidence score of <strong>78%</strong> suggests
              clear symbolic patterns in your dreams.
            </p>
            <p className="text-sm text-foreground/80">
              Consider keeping track of your emotional state before sleep to
              discover deeper connections.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
