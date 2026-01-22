import { AlertTriangle, TrendingDown, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertCardProps {
  type: "warning" | "danger" | "info";
  title: string;
  description: string;
  action?: string;
}

export function AlertCard({ type, title, description, action }: AlertCardProps) {
  const variants = {
    warning: {
      bg: "bg-warning/5 border-warning/20",
      icon: <AlertTriangle className="h-5 w-5 text-warning" />,
      iconBg: "bg-warning/10",
    },
    danger: {
      bg: "bg-loss/5 border-loss/20",
      icon: <TrendingDown className="h-5 w-5 text-loss" />,
      iconBg: "bg-loss/10",
    },
    info: {
      bg: "bg-primary/5 border-primary/20",
      icon: <XCircle className="h-5 w-5 text-primary" />,
      iconBg: "bg-primary/10",
    },
  };

  const v = variants[type];

  return (
    <div className={cn("rounded-xl border p-4 animate-fade-in", v.bg)}>
      <div className="flex gap-3">
        <div className={cn("rounded-lg p-2 h-fit", v.iconBg)}>{v.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {action && (
            <button className="text-sm font-medium text-primary hover:underline mt-2">
              {action} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
