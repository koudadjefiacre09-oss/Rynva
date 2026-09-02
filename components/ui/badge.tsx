import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "brand" | "success" | "warning" | "danger" | "outline";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-secondary text-text-secondary border border-border",
  brand: "bg-gradient-brand text-white",
  success: "bg-success/10 text-success border border-success/30",
  warning: "bg-warning/10 text-warning border border-warning/30",
  danger: "bg-danger/10 text-danger border border-danger/30",
  outline: "border border-border text-text-secondary",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
