import { ArrowLeft, Share2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import { useLocation } from "wouter";
import { useState } from "react";

export default function DreamDetail() {
  const [, setLocation] = useLocation();
  const [showSymbols, setShowSymbols] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const dream = {
    text: "I was flying over my childhood home. The sky was bright blue and I felt incredibly free and happy. I could control my direction by thinking about where I wanted to go.",
    date: "October 15, 2025",
    confidence: 85,
    interpretation:
      "Flying dreams often represent feelings of freedom, empowerment, and transcendence of limitations. The controlled, positive nature of this flying experience suggests confidence and optimism in your current life situation.",
    symbols: ["flying", "childhood home", "sky", "freedom", "control"],
    sources: [
      "Contemporary sleep research",
      "Lucid dreaming studies",
      "Positive psychology research",
    ],
    alternatives: [
      "Desire for escape from current responsibilities",
      "Processing recent achievement or success",
      "Exploring creative potential and possibilities",
    ],
    actionableInsights: [
      "This dream suggests you're in a positive mental state - embrace it",
      "Consider journaling about areas where you feel most empowered",
      "Reflect on childhood memories that bring you joy",
    ],
  };

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
          <span className="text-body-sm text-muted-foreground">{dream.date}</span>
          <Button variant="ghost" className="h-12 w-12" data-testid="button-share">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Reassurance Message */}
        <div className="text-center">
          <p className="text-body-sm text-muted-foreground">
            Remember: Dreams are symbolic, not literal predictions
          </p>
        </div>

        {/* Dream Text with Pattern Clarity */}
        <Card className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <h2 className="text-display font-semibold mb-3">Your Dream</h2>
              <p className="text-body leading-relaxed text-foreground/90">{dream.text}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ConfidenceMeter score={dream.confidence} size={100} showLabel={false} />
              <p className="text-xs text-muted-foreground text-center mt-1">
                How clear the<br/>patterns are
              </p>
            </div>
          </div>
        </Card>

        {/* Primary Interpretation - Always Visible */}
        <Card className="p-6">
          <h3 className="text-display font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            What It Means
          </h3>
          <p className="text-body leading-relaxed text-foreground/90">
            {dream.interpretation}
          </p>
        </Card>

        {/* Actionable Insights - Highlighted */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="text-display font-semibold mb-4">What You Can Do</h3>
          <ul className="space-y-3">
            {dream.actionableInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <span className="text-body-sm leading-relaxed flex-1">{insight}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Progressive Disclosure - Collapsible Sections */}
        <div className="space-y-3">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="w-full flex items-center justify-between p-5 bg-card border border-card-border rounded-xl hover-elevate active-elevate-2"
            data-testid="button-toggle-alternatives"
          >
            <span className="text-body font-medium">Other Interpretations</span>
            {showAlternatives ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {showAlternatives && (
            <Card className="p-6 animate-in slide-in-from-top duration-200">
              <ul className="space-y-3">
                {dream.alternatives.map((alt, i) => (
                  <li key={i} className="text-body-sm text-muted-foreground pl-4 border-l-2 border-primary/30 leading-relaxed">
                    {alt}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <button
            onClick={() => setShowSymbols(!showSymbols)}
            className="w-full flex items-center justify-between p-5 bg-card border border-card-border rounded-xl hover-elevate active-elevate-2"
            data-testid="button-toggle-symbols"
          >
            <span className="text-body font-medium">Symbols Found</span>
            {showSymbols ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {showSymbols && (
            <Card className="p-6 animate-in slide-in-from-top duration-200">
              <div className="flex flex-wrap gap-2">
                {dream.symbols.map((symbol) => (
                  <Badge key={symbol} variant="secondary" className="capitalize text-sm py-1 px-3">
                    {symbol.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

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
                {dream.sources.map((source, i) => (
                  <li key={i} className="text-body-sm text-muted-foreground flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {source}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <Button
          className="w-full h-12 bg-gradient-to-r from-primary to-[#764ba2]"
          data-testid="button-reanalyze"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Get Another Interpretation
        </Button>
      </div>
    </div>
  );
}
