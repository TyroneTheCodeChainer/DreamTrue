/**
 * Home Page - Dream Capture & AI Interpretation Interface
 * 
 * This is the primary user interface for dream capture and analysis.
 * Optimized for 3am usage with voice-first design and emotional support features.
 * 
 * Key Features:
 * - Voice recording (primary input method)
 * - Text input (alternative method)
 * - Optional context chips (stress level, emotions)
 * - Breathing exercise (nightmare support)
 * - AI-powered dream interpretation
 * - Premium feature gating
 * 
 * UX Design Principles:
 * - Immediate access (no hero image, straight to action)
 * - Large touch targets (3am fumbling-friendly)
 * - Calming colors (purple/pink gradient)
 * - Haptic feedback (tactile reassurance)
 * - Loading states (anxiety reduction)
 * 
 * Technical Stack:
 * - React hooks for state management
 * - TanStack Query for API mutations
 * - Wouter for routing
 * - Shadcn UI components
 * - Custom haptic feedback system
 */

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
  // Navigation hook (unused in current implementation, kept for future routing)
  const [, setLocation] = useLocation();
  
  /**
   * Authentication & Premium Status
   * 
   * useAuth hook provides:
   * - user: Full user object from database
   * - isAuthenticated: Boolean authentication state
   * - isPremium: Premium subscription status
   * - isLoading: Loading state for auth check
   * 
   * Why destructure only isPremium?
   * - Only premium status needed for UI conditional rendering
   * - Reduces unnecessary re-renders (other fields don't affect this component)
   * - Auth check happens at App.tsx level (redirects to Landing if not authenticated)
   */
  const { isPremium } = useAuth();
  
  // Toast notification system for user feedback
  const { toast } = useToast();
  
  /**
   * Local State Management
   * 
   * dreamText: User's dream description (from voice OR text input)
   * - Updated by VoiceInput component OR Textarea
   * - Validated before submission (min 10 chars)
   * - Never persisted locally (privacy by default)
   * 
   * context: Optional stress/emotion metadata
   * - Collapsed by default (reduce cognitive load)
   * - Helps AI provide more personalized interpretation
   * - Structure: { stress?: string, emotion?: string }
   * 
   * UI State Flags:
   * - showVoice: Controls VoiceInput modal visibility
   * - showContextChips: Toggles context selector accordion
   * - showBreathing: Controls BreathingExercise modal (nightmare support)
   */
  const [dreamText, setDreamText] = useState("");
  const [context, setContext] = useState<{ stress?: string; emotion?: string }>({});
  const [showVoice, setShowVoice] = useState(false);
  const [showContextChips, setShowContextChips] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);

  /**
   * Context Selection Handler
   * 
   * Updates context object with user-selected stress level or emotion.
   * Uses functional state update to preserve other context fields.
   * 
   * @param type - 'stress' or 'emotion' (determines which field to update)
   * @param value - Selected value from ContextChips component
   * 
   * Example flow:
   * 1. User clicks "High" stress chip
   * 2. Calls handleContextSelect('stress', 'high')
   * 3. Updates context to { ...prev, stress: 'high' }
   * 4. Context sent to AI with dream text
   */
  const handleContextSelect = (type: "stress" | "emotion", value: string) => {
    setContext((prev) => ({ ...prev, [type]: value }));
  };

  /**
   * AI Dream Interpretation Mutation
   * 
   * TanStack Query mutation for server-side dream analysis.
   * Handles the complete lifecycle of AI interpretation requests.
   * 
   * Architecture:
   * - Declarative API calls (vs imperative fetch)
   * - Automatic loading states (.isPending)
   * - Built-in error handling
   * - No manual loading/error state management
   * 
   * Why useMutation (not useQuery)?
   * - POST request (mutations modify server state)
   * - Not cacheable (each dream is unique)
   * - User-triggered (not automatic on mount)
   * - Side effects on success (toast, haptics, navigation)
   */
  const interpretMutation = useMutation({
    /**
     * Mutation Function - The Core API Call
     * 
     * Executes the HTTP POST request to /api/interpret endpoint.
     * 
     * @param data - Request payload
     *   - dreamText: User's dream description
     *   - context: Optional stress/emotion metadata
     *   - analysisType: 'quick_insight' or 'deep_dive'
     * 
     * @returns Parsed JSON response from server
     *   - interpretation: Main analysis text
     *   - symbols: Array of symbolic elements
     *   - emotions: Array of emotional themes
     *   - themes: Array of psychological themes
     *   - confidence: AI confidence score (0-100)
     *   - analysisType: Mode used for analysis
     * 
     * Error Handling:
     * - apiRequest throws on non-200 status codes
     * - Caught by onError handler (see below)
     * - Network errors also trigger onError
     * 
     * Performance:
     * - Quick Insight: ~5-15 seconds
     * - Deep Dive: ~15-30 seconds
     * - No timeout (let server/API handle limits)
     */
    mutationFn: async (data: { dreamText: string; context: any; analysisType: string }) => {
      const res = await apiRequest("POST", "/api/interpret", data);
      return await res.json();
    },
    
    /**
     * Success Handler - Post-Interpretation Actions
     * 
     * Executed when AI interpretation completes successfully.
     * Orchestrates user feedback and next steps.
     * 
     * @param data - Interpreted dream result from AI service
     * 
     * Success Flow:
     * 1. Log interpretation to console (debugging + user can inspect)
     * 2. Expose to window.__lastInterpretation (E2E testing + manual inspection)
     * 3. Show success toast with confidence score and theme count
     * 4. Trigger success haptic pattern (tactile positive feedback)
     * 5. [TODO] Navigate to results page or show results modal
     * 
     * Why expose to window?
     * - Enables Playwright E2E testing (window.evaluate() access)
     * - Allows manual debugging in browser console
     * - No production impact (overwritten on each interpretation)
     * - Not a security concern (interpretation already sent to client)
     * 
     * Toast Design:
     * - Title: Clear success message ("Dream Interpreted!")
     * - Description: Actionable info (confidence %, theme count)
     * - Duration: 5000ms (long enough to read, not annoying)
     * - Default variant (success green color)
     * 
     * Haptic Feedback:
     * - haptics.success() = [20ms, 50ms gap, 20ms] vibration pattern
     * - Provides tactile confirmation (important at 3am)
     * - Works on mobile devices with vibration support
     * - Gracefully degrades on unsupported devices
     * 
     * Future Enhancement:
     * - Navigate to /results page with interpretation data
     * - OR show modal overlay with interpretation
     * - Save to localStorage for non-premium users (temporary)
     * - Offer "Save Dream" action for premium users
     */
    onSuccess: (data) => {
      // Console logging with emoji for easy visual scanning in logs
      console.log("✨ Interpretation received:", data);
      
      // Global window exposure for testing and debugging
      // TypeScript: Cast to 'any' to bypass window type checking
      // Also includes dream text for Results page reference
      (window as any).__lastInterpretation = {
        ...data,
        dreamText, // Include original dream text for display
      };
      
      // User feedback: Success notification
      toast({
        title: "Dream Interpreted!",
        description: `Confidence: ${data.confidence}% • ${data.themes?.length || 0} themes identified`,
        duration: 5000, // 5 seconds (long enough to comprehend)
      });
      
      // Tactile feedback: Success vibration pattern
      haptics.success();
      
      // Navigate to results page to display full interpretation
      setLocation("/results");
    },
    
    /**
     * Error Handler - Failure Scenario Management
     * 
     * Executed when interpretation request fails.
     * Provides clear user feedback and debugging information.
     * 
     * @param error - Error object from failed mutation
     * 
     * Error Scenarios:
     * - 400: Invalid input (dream too short)
     * - 403: Premium feature accessed by free user
     * - 500: AI service error or server failure
     * - Network: Connection timeout, DNS failure
     * 
     * Error Flow:
     * 1. Log error to console with ❌ emoji (visual error marker)
     * 2. Show destructive toast with error message
     * 3. No haptic feedback (avoid negative reinforcement)
     * 
     * User Experience:
     * - Clear error message (from server or network stack)
     * - Destructive variant (red color indicates failure)
     * - 5 second duration (enough time to read and understand)
     * - No automatic retry (avoid API cost for invalid requests)
     * 
     * Why no haptic error feedback?
     * - Negative haptics can increase anxiety (bad for 3am users)
     * - Visual toast is sufficient for error communication
     * - Haptics reserved for positive reinforcement only
     * 
     * Debugging:
     * - Full error object logged to console
     * - Includes stack trace, status code, and message
     * - Server logs provide additional context
     * - Correlate with backend "Interpretation error:" logs
     */
    onError: (error: Error) => {
      // Console logging with emoji for visual error identification
      console.error("❌ Interpretation error:", error);
      
      // User feedback: Error notification
      toast({
        title: "Interpretation Failed",
        description: error.message, // Server provides user-friendly messages
        variant: "destructive", // Red/error styling
        duration: 5000,
      });
      
      // No haptic feedback on error (avoid negative reinforcement)
      // Visual feedback (red toast) is sufficient
    },
  });

  /**
   * Submit Handler - Initiate Dream Interpretation
   * 
   * Triggered when user clicks "Analyze My Dream" button.
   * Initiates the AI interpretation mutation.
   * 
   * Flow:
   * 1. Provide haptic feedback (button press confirmation)
   * 2. Trigger mutation with dream text, context, and analysis type
   * 3. Mutation handles loading state, API call, success/error
   * 
   * Why haptics.medium()?
   * - Provides tactile button press feedback
   * - 30ms vibration (noticeable but not jarring)
   * - Confirms action before ~10-30s wait for AI
   * - Important for accessibility and 3am UX
   * 
   * Analysis Type Logic:
   * - Free users: Always 'quick_insight' (backend validates)
   * - Premium users: Could choose 'deep_dive' (future enhancement)
   * - Current: Hardcoded 'quick_insight' for all (simplest MVP)
   * 
   * Future Enhancement:
   * - Add analysis type selector for premium users
   * - "Upgrade for Deep Dive" CTA for free users
   * - Remember user preference in localStorage
   */
  const handleSubmit = () => {
    // Tactile feedback for button press
    haptics.medium();
    
    // Initiate AI interpretation mutation
    interpretMutation.mutate({
      dreamText,    // Required: User's dream description
      context,      // Optional: Stress level and/or emotion
      analysisType: 'quick_insight', // Free tier analysis mode
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
