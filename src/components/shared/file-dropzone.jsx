"use client";

import * as React from "react";
import { FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Client-only file picker. Files are never uploaded in demo mode; only metadata is recorded. */
export function FileDropzone({ value, onChange, accept, maxSizeMb = 10, hint, error, id }) {
  const inputRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const [localError, setLocalError] = React.useState();

  const pick = (file) => {
    if (!file) return;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setLocalError(`File must be under ${maxSizeMb} MB.`);
      return;
    }
    setLocalError(undefined);
    onChange(file);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-describedby={id ? `${id}-hint` : undefined}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
          dragging ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/60 hover:bg-muted/50",
          (error || localError) && "border-destructive",
        )}
      >
        <input ref={inputRef} id={id} type="file" accept={accept} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        {value ? (
          <div className="flex items-center gap-2 text-sm">
            <FileUp className="h-4 w-4 text-secondary" />
            <span className="font-medium truncate max-w-[220px]">{value.name}</span>
            <span className="text-muted-foreground">({(value.size / 1024 / 1024).toFixed(2)} MB)</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove file"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              <X />
            </Button>
          </div>
        ) : (
          <>
            <FileUp className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Drag and drop or click to browse</p>
            <p className="text-xs text-muted-foreground" id={id ? `${id}-hint` : undefined}>
              {hint ?? `${accept ?? "Any file"} · up to ${maxSizeMb} MB`}
            </p>
          </>
        )}
      </div>
      {(error || localError) && <p className="mt-1 text-xs text-destructive">{error ?? localError}</p>}
    </div>
  );
}
