import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import DreamInput from "@/components/DreamInput";
import SystemToggle from "@/components/SystemToggle";
import ContextChips from "@/components/ContextChips";
import VoiceInput from "@/components/VoiceInput";
import DreamCard from "@/components/DreamCard";
import heroImage from "@assets/generated_images/Purple_night_sky_hero_82505c89.png";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [dreamText, setDreamText] = useState("");
  const [system, setSystem] = useState<"rag" | "agentic">("rag");
  const [context, setContext] = useState<{ stress?: string; emotion?: string }>({});
  const [showVoice, setShowVoice] = useState(false);

  const handleContextSelect = (type: "stress" | "emotion", value: string) => {
    setContext((prev) => ({ ...prev, [type]: value }));
  };

  const handleSubmit = () => {
    console.log("Submitting dream:", { dreamText, system, context });
  };

  const recentDreams = [
    {
      id: "1",
      text: "Flying over mountains with incredible freedom",
      date: "Oct 15, 2025",
      confidence: 85,
      interpretation: "Represents liberation and overcoming obstacles",
    },
    {
      id: "2",
      text: "Being chased through a dark forest",
      date: "Oct 14, 2025",
      confidence: 72,
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="relative h-[40vh] overflow-hidden">
        <img
          src={heroImage}
          alt="Night sky"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
              Understand Your Dreams
            </h1>
            <p className="text-white/90 text-lg drop-shadow">
              AI-powered analysis with scientific insights
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-xl space-y-4">
          <DreamInput
            value={dreamText}
            onChange={setDreamText}
            onVoiceInput={() => setShowVoice(true)}
            onSubmit={handleSubmit}
          />
          
          <ContextChips selected={context} onSelect={handleContextSelect} />
          
          <div>
            <label className="text-sm font-medium mb-2 block">Analysis Type</label>
            <SystemToggle value={system} onChange={setSystem} />
            <p className="text-xs text-muted-foreground mt-2">
              {system === "rag"
                ? "Fast interpretation (~10 seconds)"
                : "Comprehensive multi-agent analysis (~40 seconds)"}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Dreams</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dreams")}
              data-testid="button-view-all"
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentDreams.map((dream) => (
              <DreamCard
                key={dream.id}
                {...dream}
                onClick={() => setLocation(`/dream/${dream.id}`)}
              />
            ))}
          </div>
        </div>
      </div>

      {showVoice && (
        <VoiceInput
          onTranscript={(text) => setDreamText(text)}
          onClose={() => setShowVoice(false)}
        />
      )}
    </div>
  );
}
