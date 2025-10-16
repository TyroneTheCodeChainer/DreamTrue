import { Button } from "@/components/ui/button";
import sleepingMoon from "@assets/generated_images/Sleeping_moon_empty_state_a669b43f.png";
import constellation from "@assets/generated_images/Constellation_pattern_discovery_illustration_ca39edcb.png";

interface EmptyStateProps {
  type: "dreams" | "patterns";
  onAction?: () => void;
}

export default function EmptyState({ type, onAction }: EmptyStateProps) {
  const content = {
    dreams: {
      image: sleepingMoon,
      title: "No Dreams Recorded Yet",
      description: "Start your dream journal by analyzing your first dream!",
      action: "Analyze First Dream",
    },
    patterns: {
      image: constellation,
      title: "Not Enough Data",
      description: "Record more dreams to discover meaningful patterns.",
      action: "Add More Dreams",
    },
  };

  const { image, title, description, action } = content[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <img
        src={image}
        alt={title}
        className="w-32 h-32 mb-6 opacity-80"
      />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      {onAction && (
        <Button onClick={onAction} data-testid="button-empty-action">
          {action}
        </Button>
      )}
    </div>
  );
}
