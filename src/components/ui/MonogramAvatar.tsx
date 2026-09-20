import { cn } from "../../utils/cn";

interface MonogramAvatarProps {
  name: string;
  gradient?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  image?: string;
  avatarType?: "monogram" | "image";
  className?: string;
}

const SIZES = {
  sm: "h-11 w-11 text-sm",
  md: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl",
  xl: "h-24 w-24 text-3xl sm:h-28 sm:w-28 sm:text-4xl",
  "2xl": "h-28 w-28 text-4xl sm:h-32 sm:w-32 sm:text-5xl",
};

export function MonogramAvatar({
  name,
  gradient = "from-orange-500 to-rose-600",
  size = "lg",
  image,
  avatarType = "monogram",
  className,
}: MonogramAvatarProps) {
  const monogram = name
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const isCustomImage = avatarType === "image" && Boolean(image);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl font-display font-bold uppercase italic shadow-lg select-none",
        !isCustomImage && `bg-gradient-to-br ${gradient} text-white shadow-orange-500/20`,
        isCustomImage && "border border-white/15 bg-[#0e0e12]",
        SIZES[size],
        className
      )}
    >
      {isCustomImage ? (
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <>
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"
          />
          <span className="relative drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            {monogram || "OP"}
          </span>
        </>
      )}
    </div>
  );
}
