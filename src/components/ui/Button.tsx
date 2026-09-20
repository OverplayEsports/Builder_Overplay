import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-display font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const variants = {
    primary:
      "bg-brand-gradient text-white shadow-[0_6px_24px_-6px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 hover:shadow-[0_10px_32px_-6px_rgba(249,115,22,0.85)]",
    secondary:
      "bg-white/10 text-white border border-white/15 hover:bg-white/15 hover:border-white/25",
    ghost:
      "bg-transparent text-white/70 hover:text-white hover:bg-white/[0.06]",
    danger:
      "bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 hover:border-rose-500/50 hover:text-rose-100",
    outline:
      "border border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-xs sm:text-sm",
    lg: "px-6 py-3 text-sm sm:text-base",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
