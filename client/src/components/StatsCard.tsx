import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  gradient?: boolean;
}

export default function StatsCard({
  icon: Icon,
  value,
  label,
  gradient = false,
}: StatsCardProps) {
  return (
    <Card
      className={`p-4 text-center ${
        gradient
          ? "bg-gradient-to-br from-primary to-[#764ba2] text-primary-foreground border-0"
          : ""
      }`}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Icon className="w-6 h-6 mx-auto mb-2" />
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </Card>
  );
}
