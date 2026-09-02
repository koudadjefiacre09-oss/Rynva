import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <input
          ref={ref}
          className={cn(
            "h-11 w-full rounded border border-border bg-surface-secondary px-3.5 text-sm text-text-primary",
            "placeholder:text-text-muted transition-colors",
            "focus-visible:outline-none focus-visible:border-brand-purple",
            error && "border-danger focus-visible:border-danger",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
