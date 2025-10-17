/**
 * VoiceInput Component - Real-time Speech Recognition
 * 
 * Implements browser-based speech-to-text using Web Speech API.
 * Provides real-time transcription with visual feedback and error handling.
 * 
 * Key Features:
 * - Web Speech API integration (Chrome, Safari, Edge)
 * - Real-time transcript updates
 * - Browser compatibility detection
 * - Graceful error handling and user feedback
 * - Visual recording indicators
 * - Haptic and audio feedback
 * 
 * Browser Support:
 * - Chrome/Edge: Full support
 * - Safari: Supported with webkit prefix
 * - Firefox: Limited/no support
 * - Mobile: Good support on iOS/Android Chrome
 */

import { Mic, Square, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { haptics, sounds } from "@/lib/haptics";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onClose: () => void;
}

/**
 * Type definition for Web Speech API
 * Handles both standard and webkit-prefixed versions
 */
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export default function VoiceInput({ onTranscript, onClose }: VoiceInputProps) {
  /**
   * Component State
   * 
   * isRecording: Active recording status
   * transcript: Accumulated speech-to-text result
   * waveAnimation: Visual pulse animation toggle
   * error: Error message for unsupported browsers or permission issues
   * isProcessing: Intermediate state while recognition starts
   */
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [waveAnimation, setWaveAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Speech Recognition Instance Reference
   * 
   * Persists across renders using useRef to avoid recreation.
   * Stores the active SpeechRecognition object for lifecycle management.
   */
  const recognitionRef = useRef<any>(null);

  /**
   * Browser Compatibility Check
   * 
   * Web Speech API availability varies by browser:
   * - window.SpeechRecognition: Standard (Chrome, Edge)
   * - window.webkitSpeechRecognition: Webkit (Safari)
   * 
   * Returns constructor if available, null otherwise
   * 
   * Note: Cast to 'any' to bypass TypeScript errors since
   * SpeechRecognition is not in standard Window type definitions
   */
  const getSpeechRecognition = () => {
    const win = window as any;
    if ('SpeechRecognition' in window) {
      return win.SpeechRecognition;
    } else if ('webkitSpeechRecognition' in window) {
      return win.webkitSpeechRecognition;
    }
    return null;
  };

  /**
   * Wave Animation Effect
   * 
   * Synchronizes visual pulse with recording state.
   * Provides clear visual feedback that mic is active.
   */
  useEffect(() => {
    setWaveAnimation(isRecording);
  }, [isRecording]);

  /**
   * Cleanup Effect
   * 
   * Ensures speech recognition is properly stopped
   * when component unmounts to prevent memory leaks
   * and orphaned recording sessions.
   */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  /**
   * Recording Toggle Handler
   * 
   * Manages start/stop of speech recognition.
   * Handles browser compatibility, permissions, and errors.
   * 
   * Start Flow:
   * 1. Check browser support
   * 2. Initialize SpeechRecognition with config
   * 3. Set up event handlers
   * 4. Request microphone permission
   * 5. Start listening
   * 
   * Stop Flow:
   * 1. Stop recognition
   * 2. Finalize transcript
   * 3. Update UI state
   */
  const toggleRecording = async () => {
    if (!isRecording) {
      // === START RECORDING ===
      
      const SpeechRecognition = getSpeechRecognition();
      
      // Check browser support
      if (!SpeechRecognition) {
        setError("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
        return;
      }

      try {
        // Initialize recognition instance
        const recognition = new SpeechRecognition();
        
        /**
         * Speech Recognition Configuration
         * 
         * continuous: Keep listening until manually stopped
         * interimResults: Show real-time partial results (better UX)
         * lang: English US (can be made configurable)
         * maxAlternatives: Number of result alternatives (1 for performance)
         */
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        /**
         * Result Handler
         * 
         * Fires on each speech recognition update (partial or final).
         * Concatenates results to build complete transcript.
         * 
         * @param event - Contains speech recognition results
         */
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          // Process all results from this recognition session
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcriptPiece = result[0].transcript;

            if (result.isFinal) {
              // Final result: Add to permanent transcript
              finalTranscript += transcriptPiece + ' ';
            } else {
              // Interim result: Show in real-time but don't save yet
              interimTranscript += transcriptPiece;
            }
          }

          // Update transcript with final results, preserving whitespace
          if (finalTranscript) {
            setTranscript(prev => {
              // If there's previous text, add space separator before new text
              const newText = prev ? `${prev} ${finalTranscript}`.trim() : finalTranscript.trim();
              return newText;
            });
          }
        };

        /**
         * Error Handler
         * 
         * Handles various speech recognition errors:
         * - no-speech: User didn't speak (timeout)
         * - audio-capture: No microphone available
         * - not-allowed: Permission denied
         * - network: Network error (cloud-based recognition)
         * 
         * @param event - Contains error type and message
         */
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          
          let errorMessage = 'An error occurred with speech recognition.';
          
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone found. Please connect a microphone.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone permission denied. Please allow microphone access.';
              break;
            case 'network':
              errorMessage = 'Network error. Please check your connection.';
              break;
          }
          
          setError(errorMessage);
          setIsRecording(false);
          setIsProcessing(false);
        };

        /**
         * End Handler
         * 
         * Fires when recognition stops (manually or automatically).
         * Cleans up state and finalizes transcript.
         */
        recognition.onend = () => {
          setIsRecording(false);
          setIsProcessing(false);
        };

        /**
         * Start Handler
         * 
         * Fires when recognition actually begins listening.
         * Confirms mic access granted and recording active.
         */
        recognition.onstart = () => {
          setIsProcessing(false);
          setIsRecording(true);
        };

        // Store reference for cleanup
        recognitionRef.current = recognition;

        // Start recognition
        haptics.medium();
        sounds.playRecordStart();
        setIsProcessing(true);
        setError(null);
        recognition.start();

      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setError('Failed to start recording. Please try again.');
        setIsProcessing(false);
      }

    } else {
      // === STOP RECORDING ===
      
      if (recognitionRef.current) {
        haptics.medium();
        sounds.playComplete();
        recognitionRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  /**
   * Done Handler
   * 
   * Confirms transcript and passes to parent component.
   * Closes modal and triggers success haptic.
   */
  const handleDone = () => {
    haptics.success();
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
        
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" data-testid="alert-voice-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
              disabled={isProcessing}
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
          
          <p className="mt-6 text-body font-medium" data-testid="text-recording-status">
            {isProcessing 
              ? "Initializing..." 
              : isRecording 
                ? "Recording... Tap to stop" 
                : "Tap to start recording"}
          </p>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-5" data-testid="container-transcript">
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
            ✓ Captured
          </p>
        )}
      </Card>
    </div>
  );
}
