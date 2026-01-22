import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "profit" | "loss" | "warning";
}

export function KPICard({ title, value, icon, trend, variant = "default" }: KPICardProps) {
  const variants = {
    default: "bg-card",
    profit: "bg-profit/5 border-profit/20",
    loss: "bg-loss/5 border-loss/20",
    warning: "bg-warning/5 border-warning/20",
  };

  const iconVariants = {
    default: "bg-primary/10 text-primary",
    profit: "bg-profit/10 text-profit",
    loss: "bg-loss/10 text-loss",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-6 transition-all hover:shadow-md animate-fade-in",
        variants[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-profit" />
              ) : (
                <TrendingDown className="h-4 w-4 text-loss" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-profit" : "text-loss"
                )}
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={cn("rounded-lg p-3", iconVariants[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
