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

export const OVERWATCH_RANKS: RankOption[] = [
  { id: "Bronce", name: "Bronce", image: "/images/Rangos/Bronce.png" },
  { id: "Plata", name: "Plata", image: "/images/Rangos/Plata.png" },
  { id: "Oro", name: "Oro", image: "/images/Rangos/Oro.png" },
  { id: "Platino", name: "Platino", image: "/images/Rangos/Platino.png" },
  { id: "Esmeralda", name: "Esmeralda", image: "/images/Rangos/Esmeralda.png" },
  { id: "Diamante", name: "Diamante", image: "/images/Rangos/Diamante.png" },
  { id: "Master", name: "Master", image: "/images/Rangos/Master.png" },
  { id: "GrandMaster", name: "GrandMaster", image: "/images/Rangos/GrandMaster.png" },
  { id: "Champeon", name: "Campeón", image: "/images/Rangos/Champeon.png" },
  { id: "Sin Rango", name: "Sin Rango / Unranked", image: "" },
];

export interface TournamentRegistrationData {
  id: string;
  tournamentId: string;
  tournamentName: string;
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
