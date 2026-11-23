import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-transparent text-sm font-semibold motion-safe:transition-[background-color,color,transform] motion-safe:active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 cursor-pointer",
  { variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border-primary/30 bg-card text-primary hover:border-primary/60 hover:bg-muted",
      ghost: "text-foreground hover:bg-muted",
      destructive: "bg-destructive text-white hover:bg-destructive/90",
    },
    size: { default: "h-11 px-4", sm: "h-9 px-3 text-xs", icon: "size-11", lg: "h-12 px-5" },
  }, defaultVariants: { variant: "default", size: "default" } },
);

export function Button({ className, variant, size, asChild, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
