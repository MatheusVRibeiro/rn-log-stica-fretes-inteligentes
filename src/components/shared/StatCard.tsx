import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  variant?: "default" | "profit" | "loss" | "warning" | "primary";
  size?: "sm" | "md" | "lg";
}

export function StatCard({
  label,
  value,
  icon,
  variant = "default",
  size = "md",
}: StatCardProps) {
  const variants = {
    default: "bg-card border",
    profit: "bg-profit/5 border-profit/20",
    loss: "bg-loss/5 border-loss/20",
    warning: "bg-warning/5 border-warning/20",
    primary: "bg-primary/5 border-primary/20",
  };

  const valueColors = {
    default: "text-foreground",
    profit: "text-profit",
    loss: "text-loss",
    warning: "text-warning",
    primary: "text-primary",
  };

  const sizes = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const valueSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div
      className={cn(
        "rounded-xl border animate-fade-in",
        variants[variant],
        sizes[size]
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn("font-bold", valueSizes[size], valueColors[variant])}>
            {value}
          </p>
        </div>
        {icon && (
          <div className={cn("rounded-lg p-2", `bg-${variant}/10`)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
