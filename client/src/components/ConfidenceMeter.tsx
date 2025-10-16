import { useEffect, useState } from "react";

interface ConfidenceMeterProps {
  score: number;
  size?: number;
}

export default function ConfidenceMeter({
  score,
  size = 120,
}: ConfidenceMeterProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const increment = score / 30;
      const interval = setInterval(() => {
        setDisplayScore((prev) => {
          if (prev >= score) {
            clearInterval(interval);
            return score;
          }
          return Math.min(prev + increment, score);
        });
      }, 20);
      return () => clearInterval(interval);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - 16) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayScore / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return "hsl(var(--chart-3))";
    if (score >= 50) return "hsl(var(--chart-4))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold" data-testid="confidence-score">
          {Math.round(displayScore)}%
        </div>
        <div className="text-xs text-muted-foreground">Confidence</div>
      </div>
    </div>
  );
}
