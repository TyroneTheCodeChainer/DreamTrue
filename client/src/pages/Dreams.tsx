import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DreamCard from "@/components/DreamCard";
import EmptyState from "@/components/EmptyState";
import { useLocation } from "wouter";

export default function Dreams() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const dreams = [
    {
      id: "1",
      text: "I was flying over my childhood home. The sky was bright blue and I felt incredibly free.",
      date: "Oct 15, 2025",
      confidence: 85,
      interpretation: "Flying dreams often represent feelings of freedom and empowerment.",
    },
    {
      id: "2",
      text: "Being chased through a dark forest by something I couldn't see. My legs felt heavy.",
      date: "Oct 14, 2025",
      confidence: 72,
      interpretation: "Chase dreams typically represent avoidance of something in waking life.",
    },
    {
      id: "3",
      text: "My teeth were falling out during an important meeting at work.",
      date: "Oct 13, 2025",
      confidence: 78,
    },
    {
      id: "4",
      text: "Swimming in a vast ocean with waves crashing over me.",
      date: "Oct 12, 2025",
      confidence: 65,
    },
  ];

  const filteredDreams = dreams.filter((dream) =>
    dream.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 pt-4">
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Dreams</h1>
          <Button
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-add-dream"
            className="rounded-full bg-gradient-to-r from-primary to-[#764ba2]"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search your dreams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        {filteredDreams.length === 0 ? (
          <EmptyState type="dreams" onAction={() => setLocation("/")} />
        ) : (
          <div className="space-y-3">
            {filteredDreams.map((dream) => (
              <DreamCard
                key={dream.id}
                {...dream}
                onClick={() => setLocation(`/dream/${dream.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
