import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "article" | "section" | "li";
  /** Superficie clara dentro de una pagina oscura (tarjetas de prestador, formularios). */
  light?: boolean;
  raised?: boolean;
  interactive?: boolean;
  /** Solo para la pagina de sistema de diseno. */
  forceState?: "hover";
};

export function Card({
  as: Tag = "div",
  light = false,
  raised = false,
  interactive = false,
  forceState,
  className,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        "card",
        light && "surface-light",
        raised && "card-raised",
        interactive && "card-interactive",
        className,
      )}
      data-force={forceState}
      {...props}
    />
  );
}
