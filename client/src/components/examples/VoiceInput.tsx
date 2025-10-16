import { useState } from 'react';
import VoiceInput from '../VoiceInput';
import { Button } from '@/components/ui/button';

export default function VoiceInputExample() {
  const [showVoice, setShowVoice] = useState(false);
  
  return (
    <div className="p-4">
      <Button onClick={() => setShowVoice(true)}>Open Voice Input</Button>
      {showVoice && (
        <VoiceInput
          onTranscript={(text) => console.log('Transcript:', text)}
          onClose={() => setShowVoice(false)}
        />
      )}
    </div>
  );
}
