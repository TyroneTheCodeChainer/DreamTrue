import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wind, X } from "lucide-react";
import { haptics, sounds } from "@/lib/haptics";

interface BreathingExerciseProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function BreathingExercise({ onComplete, onSkip }: BreathingExerciseProps) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    // 4-7-8 breathing technique: Inhale 4s, Hold 7s, Exhale 8s
    const durations = { inhale: 4, hold: 7, exhale: 8 };
    const duration = durations[phase];

    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Move to next phase
      if (phase === "inhale") {
        setPhase("hold");
        setCount(7);
        haptics.breathe();
      } else if (phase === "hold") {
        setPhase("exhale");
        setCount(8);
        sounds.playBreathingBell();
      } else {
        // Complete cycle
        if (cycle < 2) {
          setPhase("inhale");
          setCount(4);
          setCycle(cycle + 1);
        } else {
          // Finished 3 cycles
          haptics.success();
          sounds.playComplete();
          setTimeout(onComplete, 500);
        }
      }
    }
  }, [count, phase, cycle, onComplete]);

  const getScaleValue = () => {
    if (phase === "inhale") {
      return 0.6 + (4 - count) * 0.1; // Scale from 0.6 to 1.0
    } else if (phase === "exhale") {
      return 1.0 - (8 - count) * 0.05; // Scale from 1.0 to 0.6
    }
    return 1.0; // Hold phase stays at 1.0
  };

  const getPhaseText = () => {
    if (phase === "inhale") return "Breathe In";
    if (phase === "hold") return "Hold";
    return "Breathe Out";
  };

  const getPhaseColor = () => {
    if (phase === "inhale") return "from-blue-500/20 to-primary/20";
    if (phase === "hold") return "from-primary/20 to-secondary/20";
    return "from-secondary/20 to-purple-500/20";
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkip}
          className="absolute top-4 right-4"
          data-testid="button-skip-breathing"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <Wind className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Take a Calming Breath</h2>
          <p className="text-sm text-muted-foreground">
            Let's calm your mind before capturing your dream
          </p>
        </div>

        {/* Breathing Animation Circle */}
        <div className="flex items-center justify-center mb-8">
          <div
            className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${getPhaseColor()} flex items-center justify-center transition-all duration-1000 ease-in-out`}
            style={{ transform: `scale(${getScaleValue()})` }}
          >
            <div className="text-center">
              <div className="text-6xl font-bold text-foreground mb-2">{count}</div>
              <div className="text-lg font-medium text-muted-foreground">{getPhaseText()}</div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= cycle ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={onSkip}
          className="w-full"
          data-testid="button-skip-to-recording"
        >
          Skip to Recording
        </Button>
      </Card>
    </div>
  );
}
