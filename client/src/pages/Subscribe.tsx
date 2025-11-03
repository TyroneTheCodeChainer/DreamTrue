// From javascript_stripe blueprint
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Shield, Moon, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to Premium!",
        description: "Your subscription is now active. Enjoy Deep Dive analysis and dream storage!",
      });
      setLocation("/");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || !elements}
        className="w-full h-12 bg-gradient-to-r from-primary to-[#764ba2]"
        data-testid="button-confirm-payment"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Confirm Payment
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isConfigMissing, setIsConfigMissing] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect to login if not authenticated (from blueprint pageLevelUnauthorizedErrorHandling)
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Please Log In",
        description: "You need to be logged in to subscribe.",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    // Redirect if already premium
    if (user?.isPremium) {
      setLocation("/");
      return;
    }

    // Create subscription as soon as the page loads
    if (isAuthenticated && !isLoading) {
      apiRequest("POST", "/api/create-subscription")
        .then(async (res) => {
          const data = await res.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else if (data.errorType === 'config_missing' || data.errorType === 'stripe_config_error') {
            // Stripe not configured or invalid config - show friendly message
            console.warn("Stripe configuration issue:", data.devMessage || data.message);
            setIsConfigMissing(true);
          }
        })
        .catch(async (error) => {
          console.error("Failed to create subscription:", error);
          
          // Try to parse response body for error type
          let errorType = null;
          let errorMessage = "";
          try {
            // Check if error.response exists and has json method
            if (error.response && typeof error.response.json === 'function') {
              const errorData = await error.response.json();
              errorType = errorData.errorType;
              errorMessage = errorData.message || errorData.devMessage || "";
            } else {
              errorMessage = error.message || "";
            }
          } catch (parseError) {
            errorMessage = error.message || "";
          }
          
          // Check if it's a configuration error
          if (
            errorType === 'config_missing' || 
            errorType === 'stripe_config_error' ||
            errorMessage.includes("config") || 
            errorMessage.includes("STRIPE_PRICE_ID")
          ) {
            // Config error - show friendly UI
            console.warn("Stripe configuration error detected:", errorMessage);
            setIsConfigMissing(true);
          } else {
            // Other errors - show user-friendly message
            toast({
              title: "Unable to Load Subscription",
              description: "We're having trouble setting up your subscription. Please try again later or contact support.",
              variant: "destructive",
              duration: 8000,
            });
            setTimeout(() => setLocation("/"), 3000);
          }
        });
    }
  }, [user, setLocation, isAuthenticated, isLoading, toast]);

  // Show friendly message if Stripe isn't configured
  if (isConfigMissing) {
    return (
      <div className="min-h-screen bg-background p-4 pt-safe pb-safe">
        <div className="max-w-2xl mx-auto py-8">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
              <Moon className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Premium Coming Soon</h1>
            <p className="text-muted-foreground">
              We're setting up premium subscriptions and will notify you when they're available.
            </p>
          </div>

          <Card className="p-8 text-center">
            <p className="text-lg mb-4">
              Premium features are currently being configured. Check back soon!
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              In the meantime, enjoy unlimited Quick Insight interpretations completely free.
            </p>
            <Button 
              onClick={() => setLocation("/")}
              className="bg-gradient-to-r from-primary to-[#764ba2]"
              data-testid="button-back-home"
            >
              Back to Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading while fetching client secret
  if (!clientSecret) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" data-testid="loading-subscription"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pt-safe pb-safe">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Upgrade to Premium</h1>
          <p className="text-muted-foreground">
            Unlock Deep Dive analysis and persistent dream storage
          </p>
          <p className="text-sm text-primary mt-3 font-medium">
            Join 500+ users exploring their dreams with AI
          </p>
        </div>

        {/* Premium Features */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">What's Included</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Deep Dive Analysis</p>
                <p className="text-sm text-muted-foreground">Explore deeper meaning with comprehensive ~40 second interpretations</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Persistent Dream Storage</p>
                <p className="text-sm text-muted-foreground">Your dreams and interpretations are saved forever</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Pattern Tracking</p>
                <p className="text-sm text-muted-foreground">Discover recurring themes and symbols over time</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Everything in Free</p>
                <p className="text-sm text-muted-foreground">Quick Insight analysis, voice input, and more</p>
              </div>
            </li>
          </ul>
        </Card>

        {/* Deep Dive Comparison */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-center">See the Difference</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Free Quick Insight */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Quick Insight</p>
                  <p className="text-xs text-muted-foreground">Free (~10s)</p>
                </div>
              </div>
              <div className="text-xs space-y-2 text-muted-foreground">
                <p className="italic">"I was flying over a city at night, feeling peaceful but also uncertain..."</p>
                <div className="pt-2 border-t space-y-1">
                  <p className="font-medium text-foreground">Quick Analysis:</p>
                  <p>Flying often represents freedom and perspective. Night settings suggest exploring unconscious thoughts. The mixed emotions indicate you're processing both excitement and anxiety about new possibilities.</p>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">Freedom</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">Uncertainty</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Premium Deep Dive */}
            <Card className="p-4 border-primary/50 bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Deep Dive</p>
                  <p className="text-xs text-primary">Premium (~40s)</p>
                </div>
              </div>
              <div className="text-xs space-y-2">
                <p className="italic text-muted-foreground">"I was flying over a city at night, feeling peaceful but also uncertain..."</p>
                <div className="pt-2 border-t space-y-2">
                  <div>
                    <p className="font-medium">Psychological Analysis:</p>
                    <p className="text-muted-foreground">Flying dreams during transitions often reflect your subconscious processing autonomy vs. security. The nighttime city represents navigating complex social/career structures while maintaining emotional distance.</p>
                  </div>
                  <div>
                    <p className="font-medium">Cultural Context:</p>
                    <p className="text-muted-foreground">Cities symbolize collective consciousness; your aerial view suggests observer perspective rather than participant—common during major life decisions.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">Autonomy</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">Transition</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">Observer</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">Decision-making</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Deep Dive provides multi-perspective analysis with psychological, cultural, and symbolic insights
          </p>
        </div>

        {/* Pricing */}
        <Card className="p-6 mb-6 text-center">
          <p className="text-4xl font-bold mb-2">$9.99<span className="text-lg font-normal text-muted-foreground">/month</span></p>
          <p className="text-sm text-muted-foreground">Cancel anytime • Secure payment via Stripe</p>
        </Card>

        {/* Payment Form */}
        <Card className="p-6">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscribeForm />
          </Elements>
        </Card>

        {/* Privacy Note & Trust Signals */}
        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            <Shield className="w-4 h-4 inline mr-1" />
            Your payment information is secure and encrypted
          </p>
          
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-primary" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-primary" />
              <span>30-day guarantee</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-primary" />
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
