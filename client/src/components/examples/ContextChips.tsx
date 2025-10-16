import { useState } from 'react';
import ContextChips from '../ContextChips';

export default function ContextChipsExample() {
  const [selected, setSelected] = useState<{ stress?: string; emotion?: string }>({
    stress: 'medium',
    emotion: 'anxious'
  });
  
  const handleSelect = (type: "stress" | "emotion", value: string) => {
    setSelected(prev => ({ ...prev, [type]: value }));
  };
  
  return (
    <div className="p-4">
      <ContextChips selected={selected} onSelect={handleSelect} />
    </div>
  );
}
