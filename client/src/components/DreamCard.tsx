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
    if (score >= 80) return "border-l-chart-3";
    if (score >= 50) return "border-l-chart-4";
    return "border-l-destructive";
  };

  return (
    <Card
      onClick={onClick}
      data-testid="dream-card"
      className={`p-5 cursor-pointer hover-elevate active-elevate-2 border-l-4 ${getConfidenceColor(
        confidence
      )}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Moon className="w-5 h-5" />
          <span className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {date}
          </span>
        </div>
        <Badge variant="secondary" className="text-sm py-1 px-3">
          {confidence}%
        </Badge>
      </div>
      <p className="text-body-sm line-clamp-2 mb-2 leading-relaxed">{text}</p>
      {interpretation && (
        <p className="text-sm text-muted-foreground line-clamp-2 italic leading-relaxed">
          {interpretation}
        </p>
      )}
    </Card>
  );
}
