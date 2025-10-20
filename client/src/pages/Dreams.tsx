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

interface DreamStats {
  count: number;
  limit: number | null;
  isPremium: boolean;
}

export default function Dreams() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { isPremium, isLoading: authLoading } = useAuth();

  /**
   * Dreams Query - Fetch user's saved dreams
   * 
   * NEW: All users can access saved dreams (free tier: max 3)
   */
  const { data: dreams = [], isLoading, error } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
    enabled: !authLoading,
  });

  /**
   * Dream Stats Query - Get count and limit info
   * 
   * Shows "2/3 dreams saved" for free users
   * Shows "Unlimited" for premium users
   */
  const { data: stats } = useQuery<DreamStats>({
    queryKey: ["/api/dreams/stats"],
    enabled: !authLoading,
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
   * NEW: All users can access Dreams page
   * Free users: See up to 3 dreams with upgrade CTA when limit reached
   * Premium users: Unlimited dreams
   */

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
              {stats?.limit ? (
                <span>
                  {stats.count}/{stats.limit} dreams saved
                  {stats.count >= stats.limit && <span className="text-amber-500 ml-1">• Limit reached</span>}
                </span>
              ) : (
                <span>{dreams.length} {dreams.length === 1 ? 'dream' : 'dreams'} recorded</span>
              )}
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

        {/* Upgrade CTA when free tier limit reached */}
        {stats && !stats.isPremium && stats.count >= (stats.limit || 3) && (
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">You've reached your 3 dream limit</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Upgrade to Premium for unlimited dream storage, Deep Dive analysis, and pattern tracking.
                </p>
                <Button
                  size="sm"
                  onClick={() => setLocation("/subscribe")}
                  data-testid="button-upgrade-dreams"
                  className="h-8"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          </Card>
        )}

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
