import * as React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

/** Label + control + error wrapper used with react-hook-form. */
export function FormField({ label, htmlFor, hint, error, required, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
