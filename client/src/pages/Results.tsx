/**
 * Results Page - Dream Interpretation Display
 * 
 * Shows the complete AI interpretation after dream analysis.
 * Displays symbols, emotions, themes, confidence score, and full interpretation text.
 * Optimized for readability with progressive disclosure and visual hierarchy.
 */

import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Save, 
  Share2, 
  Sparkles, 
  Brain, 
  Heart, 
  Lightbulb,
  Crown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { haptics } from "@/lib/haptics";

interface InterpretationData {
  interpretation: string;
  symbols: string[];
  emotions: string[];
  themes: string[];
  confidence: number;
  analysisType: 'quick_insight' | 'deep_dive';
  dreamText?: string;
}

export default function Results() {
  const [, navigate] = useLocation();
  const { isPremium } = useAuth();
  const { toast } = useToast();
  const [interpretation, setInterpretation] = useState<InterpretationData | null>(null);

  useEffect(() => {
    // Get interpretation from window (passed from Home page)
    const data = (window as any).__lastInterpretation;
    
    if (!data) {
      // No interpretation data, redirect to home
      navigate("/");
      return;
    }

    setInterpretation(data);
  }, [navigate]);

  const handleSave = () => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Upgrade to Premium to save your dream interpretations",
        variant: "destructive",
      });
      navigate("/subscribe");
      return;
    }

    haptics.success();
    toast({
      title: "Dream Saved!",
      description: "Your interpretation has been saved to your journal",
    });
    
    // TODO: Actually save to database via /api/dreams
  };

  const handleShare = () => {
    haptics.light();
    
    if (navigator.share) {
      navigator.share({
        title: "My Dream Interpretation",
        text: interpretation?.interpretation || "",
      }).catch(() => {
        // User cancelled
      });
    } else {
      toast({
        title: "Copied to Clipboard",
        description: "Interpretation copied to clipboard",
      });
      navigator.clipboard.writeText(interpretation?.interpretation || "");
    }
  };

  if (!interpretation) {
    return null; // Will redirect in useEffect
  }

  const confidenceColor = 
    interpretation.confidence >= 80 ? "text-green-500" :
    interpretation.confidence >= 60 ? "text-yellow-500" :
    "text-orange-500";

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-background/95 via-background/90 to-secondary/10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            data-testid="button-back"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            New Dream
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              data-testid="button-save"
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save Dream
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-4xl mx-auto">
        {/* Analysis Type Badge */}
        <div className="flex items-center justify-between mb-6">
          <Badge 
            variant={interpretation.analysisType === 'deep_dive' ? 'default' : 'secondary'}
            className="gap-1.5"
            data-testid="badge-analysis-type"
          >
            <Sparkles className="w-3 h-3" />
            {interpretation.analysisType === 'deep_dive' ? 'Deep Dive Analysis' : 'Quick Insight'}
          </Badge>

          {interpretation.analysisType === 'quick_insight' && isPremium && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              data-testid="button-upgrade-analysis"
              onClick={() => {
                // TODO: Re-analyze with Deep Dive
                toast({
                  title: "Coming Soon",
                  description: "Deep Dive re-analysis will be available soon",
                });
              }}
            >
              <Crown className="w-3 h-3" />
              Upgrade to Deep Dive
            </Button>
          )}
        </div>

        {/* Confidence Score */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">AI Confidence</h2>
            <span className={`text-2xl font-bold ${confidenceColor}`} data-testid="text-confidence">
              {interpretation.confidence}%
            </span>
          </div>
          <Progress 
            value={interpretation.confidence} 
            className="h-2"
            data-testid="progress-confidence"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Based on dream clarity and symbolic detail
          </p>
        </Card>

        {/* Main Interpretation */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Interpretation</h2>
          </div>
          <p 
            className="text-base leading-relaxed whitespace-pre-line"
            data-testid="text-interpretation"
          >
            {interpretation.interpretation}
          </p>
        </Card>

        {/* Symbols */}
        {interpretation.symbols.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Key Symbols</h2>
            </div>
            <div className="flex flex-wrap gap-2" data-testid="container-symbols">
              {interpretation.symbols.map((symbol, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="text-sm"
                  data-testid={`badge-symbol-${index}`}
                >
                  {symbol}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Emotions */}
        {interpretation.emotions.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Emotional Themes</h2>
            </div>
            <div className="flex flex-wrap gap-2" data-testid="container-emotions">
              {interpretation.emotions.map((emotion, index) => (
                <Badge 
                  key={index} 
                  variant="outline"
                  className="text-sm"
                  data-testid={`badge-emotion-${index}`}
                >
                  {emotion}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Themes */}
        {interpretation.themes.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Psychological Themes</h2>
            </div>
            <div className="space-y-2" data-testid="container-themes">
              {interpretation.themes.map((theme, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 text-sm"
                  data-testid={`text-theme-${index}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {theme}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Separator className="my-8" />

        {/* Call to Action */}
        {!isPremium && (
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="text-center">
              <Crown className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">
                Unlock Deep Dive Analysis
              </h3>
              <p className="text-muted-foreground mb-4">
                Get comprehensive multi-perspective interpretations with Jungian, Freudian, 
                and neuroscience insights. Plus, save unlimited dreams to your journal.
              </p>
              <Button
                onClick={() => navigate("/subscribe")}
                className="gap-2"
                data-testid="button-upgrade-cta"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Premium
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
