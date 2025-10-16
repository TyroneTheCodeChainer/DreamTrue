import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card } from "@/components/ui/card";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onClose: () => void;
}

export default function VoiceInput({ onTranscript, onClose }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTranscript("I was flying over my childhood home...");
    } else {
      onTranscript(transcript);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end">
      <Card className="w-full rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Voice Input</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
        
        <div className="flex flex-col items-center py-8">
          <Button
            size="icon"
            onClick={toggleRecording}
            data-testid="button-record"
            className={`w-20 h-20 rounded-full ${
              isRecording
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {isRecording ? (
              <Square className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            {isRecording ? "Tap to stop recording" : "Tap to start recording"}
          </p>
        </div>

        {transcript && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm">{transcript}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
