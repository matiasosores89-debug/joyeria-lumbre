import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tonos = { neutral: "bg-muted text-muted-foreground", green: "bg-emerald-50 text-emerald-800", amber: "bg-amber-50 text-amber-900", red: "bg-rose-50 text-rose-800" };

export function Badge({ className, tone = "neutral", ...props }: ComponentProps<"span"> & { tone?: keyof typeof tonos }) {
  return <span data-slot="badge" className={cn("inline-flex w-fit items-center rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap", tonos[tone], className)} {...props} />;
}
