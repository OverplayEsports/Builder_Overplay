import type { ReactElement, SVGProps } from "react";
import type { SocialPlatform } from "../../types/builder";
import { cn } from "../../utils/cn";

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
};

export function XIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

export function TwitchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M11.571 4.714h1.715v5.143H11.57v-5.143Zm4.715 0H18v5.143h-1.714V4.714ZM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0H6Zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714v11.143Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073Zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162Zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4Zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44Z" />
    </svg>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
    </svg>
  );
}

export function DiscordIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 13.216 13.216 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

export const SOCIAL_ICONS: Record<SocialPlatform, (props: IconProps) => ReactElement> = {
  x: XIcon,
  twitch: TwitchIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  discord: DiscordIcon,
};

export const SOCIAL_META: Record<SocialPlatform, { name: string; placeholder: string; color: string }> = {
  x: { name: "X (Twitter)", placeholder: "https://x.com/usuario", color: "text-white" },
  twitch: { name: "Twitch", placeholder: "https://twitch.tv/usuario", color: "text-purple-400" },
  instagram: { name: "Instagram", placeholder: "https://instagram.com/usuario", color: "text-pink-400" },
  youtube: { name: "YouTube", placeholder: "https://youtube.com/@canal", color: "text-red-400" },
  discord: { name: "Discord", placeholder: "https://discord.gg/servidor", color: "text-indigo-400" },
};

interface SocialButtonProps {
  platform: SocialPlatform;
  href: string;
  label?: string;
  className?: string;
  iconClassName?: string;
}

export function SocialButton({ platform, href, label, className, iconClassName }: SocialButtonProps) {
  const Icon = SOCIAL_ICONS[platform];
  const meta = SOCIAL_META[platform];

  return (
    <a
      href={href || "#"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label ?? `Perfil en ${meta.name}`}
      onClick={(e) => {
        if (!href || href === "#") {
          e.preventDefault();
        }
      }}
      className={cn(
        "group/soc flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-400/50 hover:bg-orange-500/15 hover:text-white",
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 transition-transform duration-300 group-hover/soc:scale-110", iconClassName)} />
    </a>
  );
}
