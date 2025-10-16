import StatsCard from '../StatsCard';
import { Moon, TrendingUp, Target, Star } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="p-4 grid grid-cols-2 gap-3">
      <StatsCard icon={Moon} value="24" label="Total Dreams" gradient />
      <StatsCard icon={TrendingUp} value="78%" label="Avg Confidence" gradient />
      <StatsCard icon={Target} value="12" label="High Confidence" />
      <StatsCard icon={Star} value="8" label="Unique Symbols" />
    </div>
  );
}
