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
        .then((data: any) => {
          // apiRequest already returns parsed JSON, not raw Response
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else if (data.errorType === 'config_missing') {
            // Stripe not configured - show helpful error
            toast({
              title: "Subscription Unavailable",
              description: "Stripe payment system is not yet configured. Please contact support.",
              variant: "destructive",
              duration: 10000,
            });
            setTimeout(() => setLocation("/"), 2000);
          }
        })
        .catch((error) => {
          console.error("Failed to create subscription:", error);
          
          // Error message from apiRequest
          const errorMessage = error.message || "Unable to set up subscription. Please try again later.";
          
          toast({
            title: "Subscription Error",
            description: errorMessage,
            variant: "destructive",
            duration: 8000,
          });
          
          // Redirect back to home after showing error
          setTimeout(() => setLocation("/"), 3000);
        });
    }
  }, [user, setLocation, isAuthenticated, isLoading, toast]);

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

        {/* Privacy Note */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Shield className="w-4 h-4 inline mr-1" />
          Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );
}
