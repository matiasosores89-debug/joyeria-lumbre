import * as React from "react";
import { cn } from "@/lib/utils";

export const inputStyle = "h-11 w-full min-w-0 rounded-sm border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:opacity-50 aria-invalid:border-destructive";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" className={cn(inputStyle, className)} {...props} />;
}
