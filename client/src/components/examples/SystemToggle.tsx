import { useState } from 'react';
import SystemToggle from '../SystemToggle';

export default function SystemToggleExample() {
  const [value, setValue] = useState<"rag" | "agentic">("rag");
  
  return (
    <div className="p-4">
      <SystemToggle value={value} onChange={setValue} />
      <p className="mt-4 text-sm text-muted-foreground text-center">
        Selected: {value}
      </p>
    </div>
  );
}
