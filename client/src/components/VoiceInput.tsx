import { Mic, Square, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onClose: () => void;
}

export default function VoiceInput({ onTranscript, onClose }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [waveAnimation, setWaveAnimation] = useState(false);

  useEffect(() => {
    if (isRecording) {
      setWaveAnimation(true);
    } else {
      setWaveAnimation(false);
    }
  }, [isRecording]);

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate recording
      setTimeout(() => {
        setTranscript("I was flying over my childhood home with incredible freedom, feeling weightless and powerful...");
      }, 1500);
    } else {
      setIsRecording(false);
    }
  };

  const handleDone = () => {
    if (transcript) {
      onTranscript(transcript);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-end">
      <Card className="w-full rounded-t-3xl p-8 space-y-6 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between">
          <h3 className="text-display font-semibold">Voice Capture</h3>
          <Button 
            variant="ghost" 
            className="h-12 px-4" 
            onClick={onClose}
            data-testid="button-cancel-voice"
          >
            Cancel
          </Button>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-body-sm text-muted-foreground">
            Speak naturally, we'll capture your dream
          </p>
          <p className="text-sm text-muted-foreground/80">
            Press once to start, again to stop
          </p>
        </div>

        <div className="flex flex-col items-center py-12">
          <div className="relative">
            {/* Pulse animation when recording */}
            {waveAnimation && (
              <>
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
              </>
            )}
            
            <Button
              size="icon"
              onClick={toggleRecording}
              data-testid="button-record"
              className={`w-24 h-24 rounded-full relative z-10 transition-all ${
                isRecording
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-gradient-to-r from-primary to-[#764ba2] hover:opacity-90"
              }`}
            >
              {isRecording ? (
                <Square className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </Button>
          </div>
          
          <p className="mt-6 text-body font-medium">
            {isRecording ? "Recording... Tap to stop" : "Tap to start recording"}
          </p>
        </div>

        {transcript && (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-5">
              <p className="text-body-sm leading-relaxed">{transcript}</p>
            </div>
            <Button
              onClick={handleDone}
              className="w-full h-12 bg-gradient-to-r from-primary to-[#764ba2] hover:opacity-90"
              data-testid="button-done-voice"
            >
              <Check className="w-5 h-5 mr-2" />
              Use This Recording
            </Button>
          </div>
        )}

        {/* Auto-save indicator */}
        {transcript && !isRecording && (
          <p className="text-center text-sm text-muted-foreground">
            ✓ Auto-saved
          </p>
        )}
      </Card>
    </div>
  );
}
