import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color?: "peach" | "mint" | "lavender" | "sky" | "coral" | "sunshine";
}

const colorMap = {
  peach: "bg-peach/15 text-peach-foreground",
  mint: "bg-mint/15 text-mint-foreground",
  lavender: "bg-lavender/15 text-lavender-foreground",
  sky: "bg-sky/15 text-sky-foreground",
  coral: "bg-coral/15 text-coral-foreground",
  sunshine: "bg-sunshine/15 text-sunshine-foreground",
};

export function StatCard({ label, value, change, changeType = "neutral", icon: Icon, color = "peach" }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50 animate-fade-in hover:shadow-medium transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-display font-bold mt-1">{value}</p>
          {change && (
            <p className={cn(
              "text-xs mt-1.5 font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
