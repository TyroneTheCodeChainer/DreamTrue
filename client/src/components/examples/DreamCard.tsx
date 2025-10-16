import DreamCard from '../DreamCard';

export default function DreamCardExample() {
  return (
    <div className="p-4 space-y-4">
      <DreamCard
        id="1"
        text="I was flying over my childhood home. The sky was bright blue and I felt incredibly free."
        date="Oct 15, 2025"
        confidence={85}
        interpretation="Flying dreams often represent feelings of freedom and empowerment."
        onClick={() => console.log('Dream card clicked')}
      />
      <DreamCard
        id="2"
        text="Being chased through a dark forest by something I couldn't see. My legs felt heavy."
        date="Oct 14, 2025"
        confidence={65}
        onClick={() => console.log('Dream card clicked')}
      />
    </div>
  );
}
