import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface SectionHeadingProps {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <div className={cn("flex items-center gap-3.5", align === "center" && "justify-center")}>
        {index && (
          <>
            <span className="font-display text-xs font-semibold tracking-[0.35em] text-orange-400/90">
              {index}
            </span>
            <span className="h-px w-8 bg-gradient-to-r from-orange-500/80 to-transparent" aria-hidden />
          </>
        )}
        {!index && (
          <span className="h-px w-8 bg-gradient-to-r from-orange-500/80 to-transparent" aria-hidden />
        )}
        <span className="font-display text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-display text-3xl font-bold uppercase italic leading-[0.95] tracking-tight text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className={cn("max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base")}>
          {description}
        </p>
      )}
    </div>
  );
}
