import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface ContextChipsProps {
  selected: {
    stress?: string;
    emotions?: string[];
    additionalContext?: string;
  };
  onSelect: (type: "stress" | "emotions" | "additionalContext", value: string) => void;
}

export default function ContextChips({ selected, onSelect }: ContextChipsProps) {
  const stressLevels = ["low", "medium", "high"];
  const emotionOptions = ["calm", "anxious", "excited", "sad", "confused"];

  const handleEmotionToggle = (emotion: string) => {
    const currentEmotions = selected.emotions || [];
    const newEmotions = currentEmotions.includes(emotion)
      ? currentEmotions.filter(e => e !== emotion)
      : [...currentEmotions, emotion];
    
    onSelect("emotions", newEmotions.join(','));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">How stressed were you?</label>
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
        <label className="text-sm font-medium mb-2 block">How did you feel? (select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {emotionOptions.map((emotion) => (
            <Badge
              key={emotion}
              variant={(selected.emotions || []).includes(emotion) ? "default" : "outline"}
              className="cursor-pointer capitalize hover-elevate"
              onClick={() => handleEmotionToggle(emotion)}
              data-testid={`chip-emotion-${emotion}`}
            >
              {emotion}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Additional context (optional)</label>
        <Textarea
          value={selected.additionalContext || ""}
          onChange={(e) => onSelect("additionalContext", e.target.value)}
          placeholder="e.g., 'Had a stressful day at work' or 'Recently moved to a new city'"
          className="min-h-[80px] text-sm resize-none"
          data-testid="input-additional-context"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Provide any relevant life events or feelings to improve interpretation accuracy
        </p>
      </div>
    </div>
  );
}
