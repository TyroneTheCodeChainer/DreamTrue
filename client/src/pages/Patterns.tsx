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
      <div className="min-h-screen pb-20 pt-6">
        <EmptyState type="patterns" onAction={() => setLocation("/")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6">
      <div className="px-6 space-y-6">
        <div>
          <h1 className="text-display font-bold">Dream Patterns</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Discover themes in your subconscious
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            icon={Moon}
            value={stats.totalDreams}
            label="Total Dreams"
            gradient
          />
          <StatsCard
            icon={TrendingUp}
            value={`${stats.avgConfidence}%`}
            label="Pattern Clarity"
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
          <h3 className="text-display font-semibold mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            Most Common Symbols
          </h3>
          <div className="space-y-3">
            {topSymbols.map((symbol) => (
              <div
                key={symbol.name}
                className="flex items-center justify-between p-4 bg-muted rounded-lg hover-elevate"
              >
                <span className="capitalize font-medium text-body-sm">
                  {symbol.name.replace("_", " ")}
                </span>
                <Badge variant="secondary" className="text-sm py-1 px-3">{symbol.count}x</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <h3 className="text-display font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-primary" />
            Gentle Insights
          </h3>
          <div className="space-y-4">
            <p className="text-body-sm leading-relaxed text-foreground/90">
              You frequently dream about <strong>flying</strong>, which often
              indicates a desire for freedom or escape from daily pressures.
            </p>
            <p className="text-body-sm leading-relaxed text-foreground/90">
              Your dreams show <strong>78% pattern clarity</strong> on average,
              meaning the symbols and themes are quite distinct and meaningful.
            </p>
            <p className="text-body-sm leading-relaxed text-foreground/90">
              💡 Try journaling your emotional state before sleep to
              discover deeper connections.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
