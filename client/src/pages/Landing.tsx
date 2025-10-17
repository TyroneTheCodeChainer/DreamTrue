import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Moon, Sparkles, Lock, Mic, Clock, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background/95 to-primary/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/90 to-background/95" />
        
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-6">
              <Moon className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Understand Your Dreams
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Capture your dreams with voice, discover what they mean, and unlock patterns in your subconscious — all from your bedside.
            </p>
            
            <Button
              onClick={() => window.location.href = "/api/login"}
              size="lg"
              className="h-14 px-8 text-lg bg-gradient-to-r from-primary via-secondary to-primary hover:opacity-90"
              data-testid="button-get-started"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • Voice-first design
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6 hover-elevate">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Voice-First Capture</h3>
            <p className="text-muted-foreground">
              No typing at 3am. Just tap and speak your dream while the details are fresh.
            </p>
          </Card>

          <Card className="p-6 hover-elevate">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Insights</h3>
            <p className="text-muted-foreground">
              Get quick reassurance in 10 seconds with our Quick Insight analysis.
            </p>
          </Card>

          <Card className="p-6 hover-elevate">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Private & Secure</h3>
            <p className="text-muted-foreground">
              Your dreams are personal. Everything is encrypted and stored safely.
            </p>
          </Card>
        </div>

        {/* Pricing Comparison */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Choose Your Experience</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <Card className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <p className="text-4xl font-bold">$0</p>
                <p className="text-muted-foreground mt-2">Perfect to start</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Quick Insight analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mic className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Voice input for easy capture</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Lock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Dreams disappear when app closes</span>
                </li>
              </ul>
              
              <Button
                onClick={() => window.location.href = "/api/login"}
                variant="outline"
                className="w-full"
                data-testid="button-start-free"
              >
                Start Free
              </Button>
            </Card>

            {/* Premium Plan */}
            <Card className="p-8 border-primary relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Popular
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <p className="text-4xl font-bold">$9.99</p>
                <p className="text-muted-foreground mt-2">per month</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="font-medium">Quick Insight + Deep Dive</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="font-medium">Persistent dream storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="font-medium">Pattern tracking over time</span>
                </li>
                <li className="flex items-start gap-2">
                  <Moon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="font-medium">Unlimited interpretations</span>
                </li>
              </ul>
              
              <Button
                onClick={() => window.location.href = "/api/login"}
                className="w-full bg-gradient-to-r from-primary via-secondary to-primary"
                data-testid="button-start-premium"
              >
                Start Premium
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to explore your dreams?</h2>
        <p className="text-muted-foreground mb-8">Join thousands discovering what their dreams mean</p>
        <Button
          onClick={() => window.location.href = "/api/login"}
          size="lg"
          className="h-14 px-8 text-lg bg-gradient-to-r from-primary via-secondary to-primary"
          data-testid="button-cta"
        >
          Get Started Now
        </Button>
      </div>
    </div>
  );
}
