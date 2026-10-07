import type { HTMLAttributes } from "react";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span className={cn("badge", `badge-${tone}`, className)} {...props}>
      {children}
    </span>
  );
}

/** Identidad verificada por YUNTA. Se muestra solo si el prestador tiene `verified_at`. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge tone="success" className={className}>
      <BadgeCheck className="size-3.5" aria-hidden="true" />
      Verificado
    </Badge>
  );
}
