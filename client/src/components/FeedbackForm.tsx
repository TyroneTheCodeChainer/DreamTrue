/**
 * FeedbackForm Component - User Feedback Collection
 * 
 * Allows users to rate their dream interpretations for quality evaluation.
 * Part of AIE8 Dimension 6: Evaluation & Monitoring.
 * 
 * Features:
 * - Thumbs up/down quick feedback
 * - 1-5 star rating
 * - 3 quality dimensions (clarity, accuracy, usefulness)
 * - Optional text feedback
 * - Duplicate feedback prevention
 * - Update existing feedback capability
 * 
 * Data collected is used for:
 * - RAGAS evaluation metrics
 * - A/B testing comparisons
 * - Fine-tuning dataset curation (4+ stars)
 * - Quality monitoring over time
 */

import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { haptics } from "@/lib/haptics";

interface FeedbackFormProps {
  interpretationId: string;
  onSubmit?: () => void;
}

export default function FeedbackForm({ interpretationId, onSubmit }: FeedbackFormProps) {
  const { toast } = useToast();
  
  // Feedback state
  const [thumbsUp, setThumbsUp] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [clarityRating, setClarityRating] = useState<number>(0);
  const [accuracyRating, setAccuracyRating] = useState<number>(0);
  const [usefulnessRating, setUsefulnessRating] = useState<number>(0);
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingFeedbackId, setExistingFeedbackId] = useState<string | null>(null);

  /**
   * Submit Feedback Mutation
   * 
   * Sends user feedback to /api/feedback endpoint.
   * Handles both creation and updating of feedback.
   */
  const feedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      if (existingFeedbackId) {
        // Update existing feedback
        const res = await apiRequest("PUT", `/api/feedback/${existingFeedbackId}`, data);
        return await res.json();
      } else {
        // Create new feedback
        const res = await apiRequest("POST", "/api/feedback", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      setSubmitted(true);
      haptics.success();
      toast({
        title: "Thank You!",
        description: "Your feedback helps us improve dream interpretations",
        duration: 3000,
      });
      onSubmit?.();
    },
    onError: (error: any) => {
      // Check if feedback already exists
      if (error.message?.includes("Feedback already exists") || error.message?.includes("409")) {
        // Extract feedback ID from error if available
        const match = error.message?.match(/\/api\/feedback\/([a-f0-9-]+)/);
        if (match) {
          setExistingFeedbackId(match[1]);
        }
        toast({
          title: "Update Your Feedback",
          description: "You've already rated this interpretation. Your new rating will update your previous feedback.",
          duration: 5000,
        });
      } else {
        toast({
          title: "Feedback Failed",
          description: error.message || "Failed to submit feedback",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmitFeedback = () => {
    // Validate: at least one feedback field must be provided
    if (thumbsUp === null && rating === 0 && !feedbackText && 
        clarityRating === 0 && accuracyRating === 0 && usefulnessRating === 0) {
      toast({
        title: "No Feedback Provided",
        description: "Please provide at least one rating or comment",
        variant: "destructive",
      });
      return;
    }

    haptics.medium();

    const feedbackData: any = {
      interpretationId,
    };

    if (thumbsUp !== null) feedbackData.thumbsUp = thumbsUp;
    if (rating > 0) feedbackData.rating = rating;
    if (feedbackText.trim()) feedbackData.feedbackText = feedbackText.trim();
    if (clarityRating > 0) feedbackData.clarityRating = clarityRating;
    if (accuracyRating > 0) feedbackData.accuracyRating = accuracyRating;
    if (usefulnessRating > 0) feedbackData.usefulnessRating = usefulnessRating;

    feedbackMutation.mutate(feedbackData);
  };

  const handleStarClick = (value: number) => {
    haptics.light();
    setRating(value === rating ? 0 : value);
  };

  const handleDimensionRating = (dimension: 'clarity' | 'accuracy' | 'usefulness', value: number) => {
    haptics.light();
    if (dimension === 'clarity') {
      setClarityRating(value === clarityRating ? 0 : value);
    } else if (dimension === 'accuracy') {
      setAccuracyRating(value === accuracyRating ? 0 : value);
    } else if (dimension === 'usefulness') {
      setUsefulnessRating(value === usefulnessRating ? 0 : value);
    }
  };

  const handleThumbsUp = () => {
    haptics.light();
    setThumbsUp(thumbsUp === true ? null : true);
  };

  const handleThumbsDown = () => {
    haptics.light();
    setThumbsUp(thumbsUp === false ? null : false);
  };

  if (submitted && !existingFeedbackId) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h3 className="text-lg font-semibold mb-1">Feedback Received!</h3>
          <p className="text-sm text-muted-foreground">
            Thank you for helping us improve dream interpretations
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-primary/20">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Rate This Interpretation</h3>
          <p className="text-sm text-muted-foreground">
            Your feedback helps us improve AI accuracy
          </p>
        </div>

        {/* Quick Thumbs Up/Down */}
        <div className="flex gap-3 justify-center">
          <Button
            variant={thumbsUp === true ? "default" : "outline"}
            size="lg"
            onClick={handleThumbsUp}
            data-testid="button-thumbs-up"
            className="flex-1 max-w-[200px] gap-2"
          >
            <ThumbsUp className="w-5 h-5" />
            Helpful
          </Button>
          <Button
            variant={thumbsUp === false ? "default" : "outline"}
            size="lg"
            onClick={handleThumbsDown}
            data-testid="button-thumbs-down"
            className="flex-1 max-w-[200px] gap-2"
          >
            <ThumbsDown className="w-5 h-5" />
            Not Helpful
          </Button>
        </div>

        <Separator />

        {/* Star Rating */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Overall Rating</Label>
          <div className="flex gap-2 justify-center" data-testid="container-star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                data-testid={`button-star-${star}`}
                className="transition-opacity hover:opacity-80"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating 
                      ? "fill-yellow-500 text-yellow-500" 
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {rating === 5 ? "Excellent!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Needs Improvement"}
            </p>
          )}
        </div>

        {/* Detailed Ratings (Optional) */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetailedRatings(!showDetailedRatings)}
            data-testid="button-toggle-detailed-ratings"
            className="w-full"
          >
            {showDetailedRatings ? "Hide" : "Show"} Detailed Ratings (Optional)
          </Button>

          {showDetailedRatings && (
            <div className="space-y-4 pt-2">
              {/* Clarity Rating */}
              <div className="space-y-2">
                <Label className="text-sm">Clarity</Label>
                <div className="flex gap-2" data-testid="container-clarity-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleDimensionRating('clarity', star)}
                      data-testid={`button-clarity-${star}`}
                      className="transition-opacity hover:opacity-80"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= clarityRating 
                            ? "fill-blue-500 text-blue-500" 
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Accuracy Rating */}
              <div className="space-y-2">
                <Label className="text-sm">Accuracy</Label>
                <div className="flex gap-2" data-testid="container-accuracy-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleDimensionRating('accuracy', star)}
                      data-testid={`button-accuracy-${star}`}
                      className="transition-opacity hover:opacity-80"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= accuracyRating 
                            ? "fill-green-500 text-green-500" 
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Usefulness Rating */}
              <div className="space-y-2">
                <Label className="text-sm">Usefulness</Label>
                <div className="flex gap-2" data-testid="container-usefulness-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleDimensionRating('usefulness', star)}
                      data-testid={`button-usefulness-${star}`}
                      className="transition-opacity hover:opacity-80"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= usefulnessRating 
                            ? "fill-purple-500 text-purple-500" 
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Text Feedback (Optional) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Additional Comments (Optional)
          </Label>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What did you find helpful or what could be improved?"
            className="min-h-[100px]"
            maxLength={500}
            data-testid="textarea-feedback"
          />
          <p className="text-xs text-muted-foreground text-right">
            {feedbackText.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmitFeedback}
          disabled={feedbackMutation.isPending}
          data-testid="button-submit-feedback"
          className="w-full"
          size="lg"
        >
          {feedbackMutation.isPending ? "Submitting..." : existingFeedbackId ? "Update Feedback" : "Submit Feedback"}
        </Button>
      </div>
    </Card>
  );
}
