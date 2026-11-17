import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary/10 text-secondary",
        accent: "border-transparent bg-accent/20 text-amber-800",
        success: "border-transparent bg-success/10 text-success",
        warning: "border-transparent bg-amber-100 text-amber-800",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        outline: "text-foreground border-border",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
