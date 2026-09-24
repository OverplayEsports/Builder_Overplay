export type TournamentRole = "Tanque" | "DPS" | "Support" | "Todos los Roles";

export type CompetitiveRank =
  | "Bronce"
  | "Plata"
  | "Oro"
  | "Platino"
  | "Esmeralda"
  | "Diamante"
  | "Master"
  | "GrandMaster"
  | "Champeon"
  | "Sin Rango";

export interface RankOption {
  id: CompetitiveRank;
  name: string;
  image: string;
}

const R2_RANKS_CDN = "https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev/rangos";

export const OVERWATCH_RANKS: RankOption[] = [
  { id: "Bronce", name: "Bronce", image: `${R2_RANKS_CDN}/Bronce.png` },
  { id: "Plata", name: "Plata", image: `${R2_RANKS_CDN}/Plata.png` },
  { id: "Oro", name: "Oro", image: `${R2_RANKS_CDN}/Oro.png` },
  { id: "Platino", name: "Platino", image: `${R2_RANKS_CDN}/Platino.png` },
  { id: "Esmeralda", name: "Esmeralda", image: `${R2_RANKS_CDN}/Esmeralda.png` },
  { id: "Diamante", name: "Diamante", image: `${R2_RANKS_CDN}/Diamante.png` },
  { id: "Master", name: "Master", image: `${R2_RANKS_CDN}/Master.png` },
  { id: "GrandMaster", name: "GrandMaster", image: `${R2_RANKS_CDN}/GrandMaster.png` },
  { id: "Champeon", name: "Campeón", image: `${R2_RANKS_CDN}/Champeon.png` },
  { id: "Sin Rango", name: "Sin Rango / Unranked", image: "" },
];

export interface TournamentRegistrationData {
  id: string;
  tournamentId: string;
  tournamentName: string;
  email: string;
  isCaptain: boolean;
  battleNetId: string;
  discordId: string;
  preferredRole: TournamentRole;
  rankTank: CompetitiveRank;
  rankDps: CompetitiveRank;
  rankSupport: CompetitiveRank;
  draftName: string;
  favoriteHero: string;
  careerFileUrls: string[];
  status: "pending" | "approved" | "rejected" | "contacted";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}
