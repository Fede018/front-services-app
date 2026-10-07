import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  /** Icono decorativo a la izquierda (por ejemplo, una lupa). */
  icon?: ReactNode;
  id?: string;
  /** Solo para la pagina de sistema de diseno. */
  forceState?: "hover" | "focus";
};

export function Input({ label, hint, error, icon, id, className, forceState, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="field">
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <div className="input-wrap">
        {icon && (
          <span className="input-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn("input", className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          data-force={forceState}
          {...props}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error" role="alert">
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
