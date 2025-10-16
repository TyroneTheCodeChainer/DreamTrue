import { useState } from 'react';
import DreamInput from '../DreamInput';

export default function DreamInputExample() {
  const [value, setValue] = useState('');
  
  return (
    <div className="p-4">
      <DreamInput
        value={value}
        onChange={setValue}
        onVoiceInput={() => console.log('Voice input clicked')}
        onSubmit={() => console.log('Submit clicked', value)}
      />
    </div>
  );
}
