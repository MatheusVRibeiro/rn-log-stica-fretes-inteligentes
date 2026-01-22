import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground",
        warning:
          "border-transparent bg-warning text-warning-foreground",
        profit:
          "border-transparent bg-profit/10 text-profit border-profit/20",
        loss:
          "border-transparent bg-loss/10 text-loss border-loss/20",
        neutral:
          "border-transparent bg-muted text-muted-foreground",
        active:
          "border-transparent bg-success/10 text-success border-success/20",
        inactive:
          "border-transparent bg-muted text-muted-foreground",
        pending:
          "border-transparent bg-warning/10 text-warning border-warning/20",
        inTransit:
          "border-transparent bg-primary/10 text-primary border-primary/20",
        completed:
          "border-transparent bg-success/10 text-success border-success/20",
        cancelled:
          "border-transparent bg-loss/10 text-loss border-loss/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
