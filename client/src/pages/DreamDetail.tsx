import { ArrowLeft, Share2, Sparkles, ChevronDown, ChevronUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Dream {
  id: string;
  userId: string;
  content: string;
  mood?: string | null;
  stressLevel?: string | null;
  dreamDate: string;
  createdAt: string;
}

interface Interpretation {
  id: string;
  dreamId: string;
  interpretation: string;
  symbols: string[];
  emotions: string[];
  themes: string[];
  confidence: number;
  analysisType: string;
  citations?: any[];
  createdAt: string;
}

export default function DreamDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const dreamId = params.id;
  const [showSymbols, setShowSymbols] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  const { data: dream, isLoading: dreamLoading } = useQuery<Dream>({
    queryKey: ["/api/dreams", dreamId],
    enabled: !!dreamId,
  });

  const { data: interpretations = [], isLoading: interpretationsLoading } = useQuery<Interpretation[]>({
    queryKey: ["/api/dreams", dreamId, "interpretations"],
    enabled: !!dreamId,
  });

  const latestInterpretation = interpretations.length > 0 ? interpretations[0] : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  if (dreamLoading || interpretationsLoading) {
    return (
      <div className="min-h-screen pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="h-12 w-12"
              onClick={() => setLocation("/dreams")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <Skeleton className="h-4 w-32" />
            <Button variant="ghost" className="h-12 w-12" data-testid="button-share">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!dream || !latestInterpretation) {
    return (
      <div className="min-h-screen pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="h-12 w-12"
              onClick={() => setLocation("/dreams")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </div>
        </div>
        <div className="px-6 py-6">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Dream Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This dream could not be loaded. It may have been deleted.
            </p>
            <Button onClick={() => setLocation("/dreams")}>
              Back to Dreams
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="h-12 w-12"
            onClick={() => setLocation("/dreams")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <span className="text-body-sm text-muted-foreground">
            {formatDate(dream.dreamDate)}
          </span>
          <Button variant="ghost" className="h-12 w-12" data-testid="button-share">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="text-center">
          <p className="text-body-sm text-muted-foreground">
            Remember: Dreams are symbolic, not literal predictions
          </p>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <h2 className="text-display font-semibold mb-3">Your Dream</h2>
              <p className="text-body leading-relaxed text-foreground/90">{dream.content}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ConfidenceMeter score={latestInterpretation.confidence} size={100} showLabel={false} />
              <p className="text-xs text-muted-foreground text-center mt-1">
                How clear the<br/>patterns are
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-display font-semibold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              What It Means
            </h3>
            {latestInterpretation.analysisType === 'quick_insight' && (
              <Badge variant="secondary" className="text-xs">
                Quick Insight
              </Badge>
            )}
          </div>
          <p className="text-body leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {latestInterpretation.interpretation}
          </p>
        </Card>

        {latestInterpretation.symbols && latestInterpretation.symbols.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowSymbols(!showSymbols)}
              className="w-full flex items-center justify-between p-5 bg-card border border-card-border rounded-xl hover-elevate active-elevate-2"
              data-testid="button-toggle-symbols"
            >
              <span className="text-body font-medium">Key Symbols</span>
              {showSymbols ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {showSymbols && (
              <Card className="p-6 animate-in slide-in-from-top duration-200">
                <div className="flex flex-wrap gap-2">
                  {latestInterpretation.symbols.map((symbol, idx) => (
                    <Badge key={idx} variant="default" className="capitalize text-sm py-1 px-3">
                      {symbol.replace("_", " ").replace("-", " ")}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {latestInterpretation.emotions && latestInterpretation.emotions.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Emotional Themes</h3>
            <div className="flex flex-wrap gap-2">
              {latestInterpretation.emotions.map((emotion, idx) => (
                <Badge key={idx} variant="outline" className="capitalize">
                  {emotion}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {latestInterpretation.themes && latestInterpretation.themes.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowThemes(!showThemes)}
              className="w-full flex items-center justify-between p-5 bg-card border border-card-border rounded-xl hover-elevate active-elevate-2"
              data-testid="button-toggle-themes"
            >
              <span className="text-body font-medium">Psychological Themes</span>
              {showThemes ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {showThemes && (
              <Card className="p-6 animate-in slide-in-from-top duration-200">
                <ul className="space-y-2">
                  {latestInterpretation.themes.map((theme, idx) => (
                    <li key={idx} className="text-body-sm flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {theme}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {latestInterpretation.citations && latestInterpretation.citations.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowSources(!showSources)}
              className="w-full flex items-center justify-between p-5 bg-card border border-card-border rounded-xl hover-elevate active-elevate-2"
              data-testid="button-toggle-sources"
            >
              <span className="text-body font-medium">Research Sources</span>
              {showSources ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {showSources && (
              <Card className="p-6 animate-in slide-in-from-top duration-200">
                <ul className="space-y-3">
                  {latestInterpretation.citations.map((citation: any, idx) => (
                    <li key={idx} className="text-body-sm text-muted-foreground flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      <div>
                        <p className="font-medium text-foreground">{citation.text || 'Research citation'}</p>
                        {citation.excerpt && (
                          <p className="text-xs mt-1 italic">{citation.excerpt}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {latestInterpretation.analysisType === 'quick_insight' && (
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Unlock Deep Dive Analysis</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Get comprehensive multi-perspective interpretations with Jungian, Freudian, and neuroscience insights.
                  Plus, save unlimited dreams to your journal.
                </p>
                <Button
                  size="sm"
                  onClick={() => setLocation("/subscribe")}
                  data-testid="button-upgrade-deepdive"
                  className="h-8"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Button
          className="w-full h-12 bg-gradient-to-r from-primary to-[#764ba2]"
          data-testid="button-reanalyze"
          onClick={() => setLocation("/")}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Analyze Another Dream
        </Button>
      </div>
    </div>
  );
}
