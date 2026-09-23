import { cn } from "../../utils/cn";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

const LOGO_SRC = "https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev/branding/Logo_Overplay.png";

/** Logotipo de marca Overplay con icono oficial Logo_Overplay.png + wordmark. */
export function Logo({ className, compact = false }: LogoProps) {
  return (
    <div
      className={cn("group/logo inline-flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none", className)}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-all duration-300 group-hover/logo:scale-105 group-hover/logo:drop-shadow-[0_0_16px_rgba(249,115,22,0.6)]">
        <img
          src={LOGO_SRC}
          alt="Logo Overplay"
          className="h-full w-full object-contain drop-shadow-[0_2px_12px_rgba(249,115,22,0.45)]"
        />
      </span>
      {!compact && (
        <span className="font-display text-xl font-bold uppercase italic tracking-[0.08em] text-white">
          Over<span className="text-brand-gradient">play</span>{" "}
          <span className="ml-1.5 rounded-md border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold not-italic text-orange-300">
            BUILDER
          </span>
        </span>
      )}
      <span className="sr-only">Overplay Builder</span>
    </div>
  );
}
