import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

// Botões seguem a linguagem Folium: contorno (não preenchimento), acento
// petróleo como traço. As classes .btn-* vivem em globals.css.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "btn transition-transform active:scale-[0.98] disabled:active:scale-100",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
