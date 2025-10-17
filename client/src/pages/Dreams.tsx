/**
 * Dreams Journal Page - User's Dream History
 * 
 * Displays all saved dreams with their interpretations.
 * Premium feature - free users see upgrade prompt.
 * 
 * Features:
 * - Real-time dream list from database
 * - Search/filter functionality
 * - Click to view full dream details
 * - Empty state handling
 * - Premium gating for free users
 */

import { useState } from "react";
import { Search, Plus, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DreamCard from "@/components/DreamCard";
import EmptyState from "@/components/EmptyState";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface Dream {
  id: string;
  content: string;
  mood?: string | null;
  stressLevel?: string | null;
  dreamDate: string;
  createdAt: string;
}

export default function Dreams() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { isPremium, isLoading: authLoading } = useAuth();

  /**
   * Dreams Query - Fetch user's saved dreams
   * 
   * Fetches from /api/dreams endpoint (premium only).
   * Free users receive empty array from backend.
   */
  const { data: dreams = [], isLoading, error } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
    enabled: !authLoading, // Wait for auth to load first
  });

  /**
   * Search Filter
   * 
   * Client-side filtering of dreams by text content.
   * Case-insensitive search across dream content.
   */
  const filteredDreams = dreams.filter((dream) =>
    dream.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Format date for display
   * Converts ISO timestamp to readable format
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  /**
   * Loading State
   * Shows skeleton placeholders while fetching dreams
   */
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen pb-20 pt-6">
        <div className="px-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="w-12 h-12 rounded-full" />
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Free User State
   * Shows upgrade CTA for non-premium users
   */
  if (!isPremium) {
    return (
      <div className="min-h-screen pb-20 pt-6">
        <div className="px-6 space-y-6">
          <div>
            <h1 className="text-display font-bold">My Dreams</h1>
            <p className="text-body-sm text-muted-foreground mt-1">
              Save and revisit your dreams
            </p>
          </div>

          <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <Crown className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Unlock Your Dream Journal</h2>
            <p className="text-muted-foreground mb-6">
              Upgrade to Premium to save unlimited dreams, track patterns over time, 
              and unlock Deep Dive analysis with comprehensive insights.
            </p>
            <Button
              onClick={() => setLocation("/subscribe")}
              className="gap-2"
              data-testid="button-upgrade"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Button>
          </Card>

          <div className="mt-8 space-y-3">
            <p className="text-sm font-medium text-muted-foreground text-center">
              Premium Features Include:
            </p>
            <div className="space-y-2">
              {[
                "Save unlimited dream interpretations",
                "Access your full dream history",
                "Pattern recognition across dreams",
                "Deep Dive multi-perspective analysis",
                "Export and share interpretations"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Error State
   * Shows error message if dreams fetch fails
   */
  if (error) {
    return (
      <div className="min-h-screen pb-20 pt-6">
        <div className="px-6">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Unable to Load Dreams</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't fetch your dreams. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6">
      <div className="px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display font-bold">My Dreams</h1>
            <p className="text-body-sm text-muted-foreground mt-1">
              {dreams.length} {dreams.length === 1 ? 'dream' : 'dreams'} recorded
            </p>
          </div>
          <Button
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-add-dream"
            className="rounded-full w-12 h-12 bg-gradient-to-r from-primary to-[#764ba2]"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search your dreams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-body-sm"
            data-testid="input-search"
          />
        </div>

        {filteredDreams.length === 0 ? (
          <EmptyState type="dreams" onAction={() => setLocation("/")} />
        ) : (
          <div className="space-y-4">
            {filteredDreams.map((dream) => (
              <DreamCard
                key={dream.id}
                id={dream.id}
                text={dream.content}
                date={formatDate(dream.dreamDate)}
                // Note: DreamCard expects confidence and interpretation
                // These come from interpretations table, would need join query
                // For now, pass default values
                confidence={undefined}
                interpretation={undefined}
                onClick={() => setLocation(`/dream/${dream.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
