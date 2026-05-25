import * as React from "react";

import { cn } from "@/lib/utils";


export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground",
        variant === "outline" && "bg-background",
        className,
      )}
      {...props}
    />
  );
}
