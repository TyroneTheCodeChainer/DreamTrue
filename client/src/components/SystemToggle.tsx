import { Zap, Brain } from "lucide-react";

interface SystemToggleProps {
  value: "rag" | "agentic";
  onChange: (value: "rag" | "agentic") => void;
}

export default function SystemToggle({ value, onChange }: SystemToggleProps) {
  return (
    <div className="bg-muted rounded-lg p-1 flex gap-1">
      <button
        onClick={() => onChange("rag")}
        data-testid="toggle-rag"
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
          value === "rag"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover-elevate"
        }`}
      >
        <Zap className="w-4 h-4" />
        Quick RAG
      </button>
      <button
        onClick={() => onChange("agentic")}
        data-testid="toggle-agentic"
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
          value === "agentic"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover-elevate"
        }`}
      >
        <Brain className="w-4 h-4" />
        Deep Analysis
      </button>
    </div>
  );
}
