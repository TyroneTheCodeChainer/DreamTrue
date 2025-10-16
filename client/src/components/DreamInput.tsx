import { Mic, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DreamInputProps {
  value: string;
  onChange: (value: string) => void;
  onVoiceInput?: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
}

export default function DreamInput({
  value,
  onChange,
  onVoiceInput,
  onSubmit,
  isLoading = false,
}: DreamInputProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your dream in detail... Include symbols, emotions, and any significant events."
          className="min-h-[120px] pr-12 text-base resize-none"
          data-testid="input-dream"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={onVoiceInput}
          data-testid="button-voice"
          className="absolute bottom-2 right-2 text-primary hover:bg-primary/10"
        >
          <Mic className="w-5 h-5" />
        </Button>
      </div>
      <Button
        onClick={onSubmit}
        disabled={!value.trim() || isLoading}
        data-testid="button-analyze"
        className="w-full bg-gradient-to-r from-primary to-[#764ba2] hover:opacity-90"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isLoading ? "Analyzing..." : "Analyze Dream"}
      </Button>
    </div>
  );
}
