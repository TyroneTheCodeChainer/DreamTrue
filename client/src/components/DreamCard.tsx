import { Moon, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DreamCardProps {
  id: string;
  text: string;
  date: string;
  confidence: number;
  interpretation?: string;
  onClick?: () => void;
}

export default function DreamCard({
  text,
  date,
  confidence,
  interpretation,
  onClick,
}: DreamCardProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "bg-chart-3";
    if (score >= 50) return "bg-chart-4";
    return "bg-destructive";
  };

  return (
    <Card
      onClick={onClick}
      data-testid="dream-card"
      className={`p-4 cursor-pointer hover-elevate active-elevate-2 border-l-4 ${getConfidenceColor(
        confidence
      )}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Moon className="w-4 h-4" />
          <span className="text-xs flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {date}
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {confidence}%
        </Badge>
      </div>
      <p className="text-sm line-clamp-2 mb-2">{text}</p>
      {interpretation && (
        <p className="text-xs text-muted-foreground line-clamp-2 italic">
          {interpretation}
        </p>
      )}
    </Card>
  );
}
