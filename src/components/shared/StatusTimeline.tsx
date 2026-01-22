import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  label: string;
  date?: string;
  completed: boolean;
  current?: boolean;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
}

export function StatusTimeline({ steps }: StatusTimelineProps) {
  return (
    <div className="relative">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "rounded-full p-1.5 z-10",
                step.completed
                  ? "bg-profit text-profit-foreground"
                  : step.current
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.completed ? (
                <Check className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-0.5 flex-1 mt-1",
                  step.completed ? "bg-profit" : "bg-border"
                )}
              />
            )}
          </div>
          <div className="flex-1 pb-2">
            <p
              className={cn(
                "font-medium",
                step.completed || step.current
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </p>
            {step.date && (
              <p className="text-sm text-muted-foreground">{step.date}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
