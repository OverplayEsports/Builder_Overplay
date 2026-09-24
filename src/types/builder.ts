export type SocialPlatform = "x" | "twitch" | "instagram" | "youtube" | "discord";

export interface SocialLinkSetting {
  enabled: boolean;
  url: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarType: "monogram" | "image";
  avatarImage?: string;
  gradient: string;
  socials: Record<SocialPlatform, SocialLinkSetting>;
}

export type GroupAccent = "ember" | "violet" | "crimson" | "emerald";

export interface TeamGroup {
  id: string;
  title: string;
  description: string;
  accent: GroupAccent;
  members: TeamMember[];
}

export interface SiteInfo {
  name: string;
  tagline: string;
  heroSubtitle: string;
  footerNote: string;
  editionNumber: string;
  playersCount: string;
  communityCount: string;
}

export interface TourneyInfoItem {
  id: string;
  icon: string;
  label: string;
  value: string;
}

export interface ProcessPhase {
  id: string;
  step: string;
  icon: string;
  title: string;
  text: string;
}

export interface EventRuleSection {
  id: string;
  category: string;
  title: string;
  description: string;
  points: string[];
}

export interface EventRulesData {
  summary: string;
  rulesButtonText: string;
  modalTitle: string;
  modalSubtitle: string;
  downloadImageUrl?: string;
  sections: EventRuleSection[];
  rawText?: string;
}

export interface EventItem {
  id: string;
  title: string;
  statusBadge: string;
  titlePrefix: string;
  titleMain: string;
  edition: string;
  description: string;
  bannerImage: string;
  chips: string[];
  registerButton: {
    text: string;
    url: string;
  };
  rulesButton: {
    text: string;
    url: string;
  };
  infoItems: TourneyInfoItem[];
  processPhases: ProcessPhase[];
  rules: EventRulesData;
}

export type NewsCategory = "overwatch" | "fortnite" | "valorant" | "marvel-rivals";

export interface NewsArticle {
  id: string;
  category: NewsCategory;
  title: string;
  subtitle: string;
  excerpt: string;
  author: string;
  date: string;
  image: string; // Header image URL
  readTime: string;
  content: string; // General text body with markdown formatting and images
  attachedImages?: string[];
}

export interface CloudflareConfig {
  accountId: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
}

export interface CompetitivePlayer {
  id: string;
  tag: string;
  name: string;
  role: string;
  position: string;
  avatarType: "monogram" | "image";
  avatarImage?: string;
  gradient: string;
  events: string[];
  socials: Record<SocialPlatform, SocialLinkSetting>;
}

export interface CompetitiveEvent {
  id: string;
  name: string;
  year: string;
  result: string;
  tier: "gold" | "silver" | "bronze" | "neutral";
  blurb: string;
}

export interface AllyItem {
  id: string;
  name: string;
  badge: string;
  description: string;
  link: string;
  avatarType: "monogram" | "image";
  avatarImage?: string;
  gradient: string;
  socials: Record<SocialPlatform, SocialLinkSetting>;
}

export type BuilderSectionKey =
  | "about"
  | "events"
  | "competitive"
  | "news"
  | "allies"
  | "hero"
  | "ticker"
  | "cta"
  | "registrations"
  | "email-template";

export type UserRole = "superadmin" | "editor";
export type UserStatus = "pending" | "approved" | "rejected";

export interface BuilderUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  allowedSections: BuilderSectionKey[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

export interface HeroConfig {
  eyebrow: string;
  titlePrefix: string;
  titleHighlight: string;
  tagline: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  editionNumber: string;
  playersCount: string;
  communityCount: string;
  backgroundImage?: string;
}

export interface TickerConfig {
  items: string[];
}

export interface CtaConfig {
  eyebrow: string;
  titleMain: string;
  titleHighlight: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  bannerImage?: string;
}

export type BuilderTab =
  | "dashboard"
  | "about"
  | "events"
  | "competitive"
  | "news"
  | "allies"
  | "hero"
  | "ticker"
  | "cta"
  | "registrations"
  | "email-template"
  | "users"
  | "code";



export interface BuilderState {
  teamGroups: TeamGroup[];
  siteInfo: SiteInfo;
  tickerItems: string[];
  events: EventItem[];
  selectedEventId: string;
  news: NewsArticle[];
  cloudflareConfig: CloudflareConfig;
  wordpressUrl?: string;
  competitiveRoster?: CompetitivePlayer[];
  competitiveEvents?: CompetitiveEvent[];
  allies?: AllyItem[];
  heroConfig?: HeroConfig;
  tickerConfig?: TickerConfig;
  ctaConfig?: CtaConfig;
  currentUser?: BuilderUser | null;
  usersList?: BuilderUser[];
}


