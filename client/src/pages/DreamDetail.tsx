import { ArrowLeft, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import { useLocation } from "wouter";

export default function DreamDetail() {
  const [, setLocation] = useLocation();

  const dream = {
    text: "I was flying over my childhood home. The sky was bright blue and I felt incredibly free and happy. I could control my direction by thinking about where I wanted to go.",
    date: "October 15, 2025",
    confidence: 85,
    interpretation:
      "Flying dreams often represent feelings of freedom, empowerment, and transcendence of limitations. The controlled, positive nature of this flying experience suggests confidence and optimism. Research indicates flying dreams correlate with positive emotional states and feelings of mastery.",
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
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dreams")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground">{dream.date}</span>
          <Button variant="ghost" size="icon" data-testid="button-share">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">Dream Description</h2>
              <p className="text-foreground/90 leading-relaxed">{dream.text}</p>
            </div>
            <ConfidenceMeter score={dream.confidence} size={100} />
          </div>
        </Card>

        <Tabs defaultValue="interpretation" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="interpretation">Analysis</TabsTrigger>
            <TabsTrigger value="symbols">Symbols</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="interpretation" className="space-y-4 mt-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Primary Interpretation
              </h3>
              <p className="text-foreground/90 leading-relaxed mb-4">
                {dream.interpretation}
              </p>
              
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-3">Alternative Interpretations</h4>
                <ul className="space-y-2">
                  {dream.alternatives.map((alt, i) => (
                    <li key={i} className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/30">
                      {alt}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="symbols" className="space-y-3 mt-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Identified Symbols</h3>
              <div className="flex flex-wrap gap-2">
                {dream.symbols.map((symbol) => (
                  <Badge key={symbol} variant="secondary" className="capitalize">
                    {symbol.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-3 mt-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Research Sources</h3>
              <ul className="space-y-2">
                {dream.sources.map((source, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {source}
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>
        </Tabs>

        <Button
          className="w-full bg-gradient-to-r from-primary to-[#764ba2]"
          data-testid="button-reanalyze"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Re-analyze Dream
        </Button>
      </div>
    </div>
  );
}
