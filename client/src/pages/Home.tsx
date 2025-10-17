import { useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
      <div className="relative h-[35vh] overflow-hidden">
        <img
          src={heroImage}
          alt="Night sky"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div>
            <h1 className="text-display-lg font-bold text-white mb-2 drop-shadow-lg">
              Your Dreams Matter
            </h1>
            <p className="text-white/90 text-body drop-shadow">
              Gentle AI analysis with scientific insights
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 relative z-10">
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-xl space-y-6">
          {/* Privacy & Reassurance */}
          <div className="text-center space-y-1">
            <p className="text-body-sm text-muted-foreground">
              🔒 Your dreams are private and stored locally
            </p>
            <p className="text-sm text-muted-foreground/80">
              Take your time, every dream is valid
            </p>
          </div>

          {/* Primary Voice Capture */}
          <div className="space-y-3">
            <Button
              size="lg"
              onClick={() => setShowVoice(true)}
              data-testid="button-voice-primary"
              className="w-full h-14 bg-gradient-to-r from-primary to-[#764ba2] hover:opacity-90 text-body"
            >
              <Mic className="w-6 h-6 mr-3" />
              Quick Voice Capture
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Recommended for groggy minds
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or type it out</span>
            </div>
          </div>

          {/* Text Input - Secondary Option */}
          <div className="space-y-4">
            <Textarea
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder="Describe your dream... Include symbols, emotions, and significant events."
              className="min-h-[100px] text-body resize-none"
              data-testid="input-dream"
            />
            
            <ContextChips selected={context} onSelect={handleContextSelect} />
            
            <div>
              <label className="text-body-sm font-medium mb-3 block">Choose Your Interpretation Style</label>
              <SystemToggle value={system} onChange={setSystem} />
              <p className="text-sm text-muted-foreground mt-2">
                {system === "rag"
                  ? "Get quick reassurance in ~10 seconds"
                  : "Explore deeper meaning in ~40 seconds"}
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!dreamText.trim()}
              data-testid="button-analyze"
              className="w-full h-12 bg-gradient-to-r from-primary to-[#764ba2] hover:opacity-90"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Analyze Dream
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-display font-semibold">Recent Dreams</h2>
            <Button
              variant="ghost"
              className="h-12 px-4"
              onClick={() => setLocation("/dreams")}
              data-testid="button-view-all"
            >
              View All
            </Button>
          </div>
          <div className="space-y-4">
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
