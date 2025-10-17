import { useState } from "react";
import { Mic, Sparkles, Crown, ChevronDown, ChevronUp, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ContextChips from "@/components/ContextChips";
import VoiceInput from "@/components/VoiceInput";
import DreamCard from "@/components/DreamCard";
import BreathingExercise from "@/components/BreathingExercise";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { haptics } from "@/lib/haptics";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isPremium } = useAuth();
  const { toast } = useToast();
  const [dreamText, setDreamText] = useState("");
  const [context, setContext] = useState<{ stress?: string; emotion?: string }>({});
  const [showVoice, setShowVoice] = useState(false);
  const [showContextChips, setShowContextChips] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);

  const handleContextSelect = (type: "stress" | "emotion", value: string) => {
    setContext((prev) => ({ ...prev, [type]: value }));
  };

  const interpretMutation = useMutation({
    mutationFn: async (data: { dreamText: string; context: any; analysisType: string }) => {
      const res = await apiRequest("POST", "/api/interpret", data);
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Interpretation received:", data);
      toast({
        title: "Dream Interpreted!",
        description: `Confidence: ${data.confidence}%`,
      });
      // TODO: Navigate to results page or show results modal
    },
    onError: (error: Error) => {
      toast({
        title: "Interpretation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    haptics.medium();
    interpretMutation.mutate({
      dreamText,
      context,
      analysisType: 'quick_insight',
    });
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
    <div className="min-h-screen pb-20 bg-gradient-to-b from-background/95 via-background/90 to-secondary/10">
      {/* Immediate Capture - No Hero Image */}
      <div className="px-6 pt-8">
        {/* Simple Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-2">
            Capture Your Dream
          </h1>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {isPremium ? "Saved securely forever" : "Private analysis, ready when you are"}
          </p>
        </div>

        {/* PRIMARY ACTION: Giant Voice Button */}
        <div className="mb-6">
          <Button
            size="lg"
            onClick={() => {
              haptics.light();
              setShowVoice(true);
            }}
            data-testid="button-voice-primary"
            className="w-full h-24 bg-gradient-to-br from-primary via-secondary to-primary hover:opacity-90 text-xl font-medium shadow-xl"
          >
            <Mic className="w-10 h-10 mr-4" />
            Tap to Speak Your Dream
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            No typing needed • Perfect for 3am capture
          </p>

          {/* Calm-Down Option for Nightmare Scenarios */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              haptics.light();
              setShowBreathing(true);
            }}
            className="w-full mt-2 text-muted-foreground"
            data-testid="button-breathing"
          >
            <Wind className="w-4 h-4 mr-2" />
            I need a moment first
          </Button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">Or type below</span>
          </div>
        </div>

        {/* Text Input - Secondary, Clean */}
        <div className="bg-card border border-card-border rounded-2xl p-5 space-y-4 shadow-lg">
          <Textarea
            value={dreamText}
            onChange={(e) => setDreamText(e.target.value)}
            placeholder="What did you dream about? (symbols, emotions, key moments...)"
            className="min-h-[120px] text-base resize-none border-0 focus-visible:ring-1 bg-background"
            data-testid="input-dream"
          />
          
          {/* Optional Context - Collapsed by Default */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContextChips(!showContextChips)}
              className="w-full justify-between text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-context"
            >
              <span className="text-sm">Add context (optional)</span>
              {showContextChips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {showContextChips && (
              <div className="mt-3 pt-3 border-t border-border">
                <ContextChips selected={context} onSelect={handleContextSelect} />
              </div>
            )}
          </div>

          {/* Simple Analysis Info */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-foreground">
              <Sparkles className="w-4 h-4 inline mr-1.5 text-primary" />
              <strong>Quick Insight</strong> in ~10 seconds
            </p>
            {isPremium && (
              <p className="text-xs text-muted-foreground mt-1">
                You can request Deep Dive analysis after results
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!dreamText.trim() || interpretMutation.isPending}
            data-testid="button-analyze"
            className="w-full h-12 bg-gradient-to-r from-primary via-secondary to-primary hover:opacity-90 font-medium"
          >
            <Sparkles className={`w-5 h-5 mr-2 ${interpretMutation.isPending ? 'animate-spin' : ''}`} />
            {interpretMutation.isPending ? 'Analyzing...' : 'Analyze My Dream'}
          </Button>
        </div>

        {/* Recent Dreams - Only if Premium */}
        {isPremium && (
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
        )}

        {/* Free User: Upgrade Prompt */}
        {!isPremium && (
          <div className="mt-8 bg-gradient-to-br from-secondary/10 to-primary/10 border border-secondary/30 rounded-2xl p-6 text-center">
            <Crown className="w-12 h-12 mx-auto mb-3 text-secondary" />
            <h3 className="text-lg font-semibold mb-2">Save Your Dream Journey</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track patterns, revisit interpretations, unlock Deep Dive analysis
            </p>
            <Button
              onClick={() => setLocation("/subscribe")}
              className="bg-gradient-to-r from-primary via-secondary to-primary"
              data-testid="button-upgrade-home"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        )}
      </div>

      {showVoice && (
        <VoiceInput
          onTranscript={(text) => setDreamText(text)}
          onClose={() => setShowVoice(false)}
        />
      )}

      {showBreathing && (
        <BreathingExercise
          onComplete={() => {
            setShowBreathing(false);
            setShowVoice(true);
          }}
          onSkip={() => {
            setShowBreathing(false);
            setShowVoice(true);
          }}
        />
      )}
    </div>
  );
}
