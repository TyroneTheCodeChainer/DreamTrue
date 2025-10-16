import { Badge } from "@/components/ui/badge";

interface ContextChipsProps {
  selected: {
    stress?: string;
    emotion?: string;
  };
  onSelect: (type: "stress" | "emotion", value: string) => void;
}

export default function ContextChips({ selected, onSelect }: ContextChipsProps) {
  const stressLevels = ["low", "medium", "high"];
  const emotions = ["calm", "anxious", "excited", "sad", "confused"];

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium mb-2 block">Stress Level</label>
        <div className="flex flex-wrap gap-2">
          {stressLevels.map((level) => (
            <Badge
              key={level}
              variant={selected.stress === level ? "default" : "outline"}
              className="cursor-pointer capitalize hover-elevate"
              onClick={() => onSelect("stress", level)}
              data-testid={`chip-stress-${level}`}
            >
              {level}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Emotional State</label>
        <div className="flex flex-wrap gap-2">
          {emotions.map((emotion) => (
            <Badge
              key={emotion}
              variant={selected.emotion === emotion ? "default" : "outline"}
              className="cursor-pointer capitalize hover-elevate"
              onClick={() => onSelect("emotion", emotion)}
              data-testid={`chip-emotion-${emotion}`}
            >
              {emotion}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
