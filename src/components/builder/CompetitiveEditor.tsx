import { useState, useRef, useEffect } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  Swords,
  Plus,
  Trash2,
  Edit3,
  MoveLeft,
  MoveRight,
  Shield,
  Tag,
  Trophy,
  Medal,
  Upload,
  Check,
  X,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Layers,
  Database,
  Eye,
  Flag,
  User,
  Crown,
  Sparkles,
  Link as LinkIcon,
  Copy,
} from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { GRADIENT_PRESETS } from "../../data/initialData";
import { supabase } from "../../lib/supabase";
import type {
  CompetitiveEvent,
  CompetitivePlayer,
  SocialPlatform,
} from "../../types/builder";
import { MonogramAvatar } from "../ui/MonogramAvatar";
import { SocialButton, SOCIAL_META, SOCIAL_ICONS } from "../ui/SocialIcons";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

const SOCIAL_LIST: SocialPlatform[] = [
  "x",
  "twitch",
  "instagram",
  "youtube",
  "discord",
];

const PREDEFINED_ROLES = [
  { category: "Tank", roles: ["Main Tank", "Flex Tank", "Tank"] },
  { category: "Daño / DPS", roles: ["DPS Hitscan", "DPS Proyectil", "Flex DPS", "DPS"] },
  { category: "Soporte / Support", roles: ["Main Support", "Flex Support", "Support"] },
  { category: "Cuerpo Técnico & Staff", roles: ["Capitán", "Head Coach", "Coach Asistente", "Analista"] },
];

const PREDEFINED_POSITIONS = [
  "Titular",
  "Suplente",
  "Capitán",
  "Cuerpo técnico",
  "Staff / Analista",
];

const TIER_STYLES: Record<CompetitiveEvent["tier"], { badge: string; border: string; icon: string; label: string }> = {
  gold: {
    badge: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    border: "hover:border-amber-400/35 hover:shadow-[0_20px_50px_-22px_rgba(251,191,36,0.45)]",
    icon: "text-amber-300",
    label: "Oro / Campeones",
  },
  silver: {
    badge: "border-slate-300/35 bg-slate-300/10 text-slate-200",
    border: "hover:border-slate-300/30 hover:shadow-[0_20px_50px_-22px_rgba(226,232,240,0.35)]",
    icon: "text-slate-200",
    label: "Plata / Subcampeones",
  },
  bronze: {
    badge: "border-orange-500/35 bg-orange-500/10 text-orange-300",
    border: "hover:border-orange-500/30 hover:shadow-[0_20px_50px_-22px_rgba(249,115,22,0.35)]",
    icon: "text-orange-300",
    label: "Bronce / Semifinales",
  },
  neutral: {
    badge: "border-white/15 bg-white/[0.05] text-white/65",
    border: "hover:border-white/25 hover:shadow-[0_20px_50px_-22px_rgba(255,255,255,0.2)]",
    icon: "text-white/60",
    label: "Neutro / Participación",
  },
};

export function CompetitiveEditor() {
  const {
    state,
    setActiveTab,
    addCompetitivePlayer,
    updateCompetitivePlayer,
    removeCompetitivePlayer,
    moveCompetitivePlayer,
    toggleCompetitiveSocial,
    updateCompetitiveSocialUrl,
    setCompetitiveRoster,
    addCompetitiveEvent,
    updateCompetitiveEvent,
    removeCompetitiveEvent,
    moveCompetitiveEvent,
    setCompetitiveEvents,
    generateCompetitiveTSCode,
  } = useBuilder();

  const [activeSubTab, setActiveSubTab] = useState<"roster" | "events">("roster");

  // Player editing state
  const [editingPlayer, setEditingPlayer] = useState<CompetitivePlayer | null>(null);
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  const [newChipInput, setNewChipInput] = useState("");

  // Event editing state
  const [editingEvent, setEditingEvent] = useState<CompetitiveEvent | null>(null);
  const [isNewEvent, setIsNewEvent] = useState(false);

  // SQL Modal state
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Sync / Upload states
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadingPlayerId, setUploadingPlayerId] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const roster = state.competitiveRoster || [];
  const events = state.competitiveEvents || [];

  // Cargar datos de competitivo desde Supabase al iniciar
  useEffect(() => {
    supabase
      .from("team_groups")
      .select("*")
      .eq("id", "config_competitive_roster")
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data && data.description) {
          try {
            const parsed = JSON.parse(data.description);
            if (parsed && typeof parsed === "object") {
              if (parsed.roster && Array.isArray(parsed.roster)) {
                setCompetitiveRoster(parsed.roster);
              }
              if (parsed.events && Array.isArray(parsed.events)) {
                setCompetitiveEvents(parsed.events);
              }
            }
          } catch (e) {
            console.warn("Error parsing competitive data from Supabase:", e);
          }
        }
      });
  }, []);

  // Subida directa de Avatar al Cloudflare R2 Bucket
  const uploadAvatarToR2 = async (file: File): Promise<string> => {
    const accountId =
      state.cloudflareConfig?.accountId?.trim() || "a7d64e57350dbbddcc2b65f7d8ede3a0";
    const bucketName =
      state.cloudflareConfig?.bucketName?.trim() || "imagenesoverplay";
    const accessKeyId =
      state.cloudflareConfig?.accessKeyId?.trim() || "cbce2ec53f08bc186b64d463df8325f0";
    const secretAccessKey =
      state.cloudflareConfig?.secretAccessKey?.trim() ||
      "aaf8802d017d1da21588dc44e4bb886e5ed1cfddad234900faa874fe1ff0e780";
    const publicUrl =
      state.cloudflareConfig?.publicUrl?.trim() ||
      "https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev";

    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .toLowerCase();
    const ext = (file.name.split(".").pop() || "webp").toLowerCase();
    const fileKey = `roster/${Date.now()}-${cleanBaseName}.${ext}`;

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const fileBytes = new Uint8Array(await file.arrayBuffer());

    const uploadCmd = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileBytes,
      ContentType: file.type || "image/jpeg",
      ContentLength: fileBytes.byteLength,
    });

    await s3Client.send(uploadCmd);
    return `${publicUrl.replace(/\/+$/, "")}/${fileKey}`;
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPlayer) return;
    setIsUploadingAvatar(true);
    setSyncError(null);

    try {
      const publicUrl = await uploadAvatarToR2(file);
      setEditingPlayer({
        ...editingPlayer,
        avatarType: "image",
        avatarImage: publicUrl,
      });
    } catch (err: any) {
      console.error("Error al subir avatar a R2:", err);
      setSyncError(`Error al subir imagen a R2: ${err.message || "Verifica la conexión."}`);
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleCardImageUpload = async (playerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPlayerId(playerId);
    setSyncError(null);

    try {
      const publicUrl = await uploadAvatarToR2(file);
      updateCompetitivePlayer(playerId, {
        avatarType: "image",
        avatarImage: publicUrl,
      });
    } catch (err: any) {
      console.error("Error al subir imagen a R2:", err);
      setSyncError(`Error al subir imagen a R2: ${err.message || "Error de conexión"}`);
    } finally {
      setUploadingPlayerId(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSyncError(null);

    try {
      const payload = {
        roster: state.competitiveRoster || [],
        events: state.competitiveEvents || [],
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase.from("team_groups").upsert({
        id: "config_competitive_roster",
        title: "Roster Competitivo UL",
        description: JSON.stringify(payload),
        accent: "crimson",
        order_index: 998,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error al sincronizar con Supabase:", err);
      setSyncError(`Error al guardar en Supabase: ${err.message || "Revisa las credenciales"}`);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleOpenEditPlayer = (player: CompetitivePlayer, isNew = false) => {
    setEditingPlayer({ ...player });
    setIsNewPlayer(isNew);
    setNewChipInput("");
  };

  const handleSavePlayer = () => {
    if (!editingPlayer) return;
    if (isNewPlayer) {
      addCompetitivePlayer(editingPlayer);
    } else {
      updateCompetitivePlayer(editingPlayer.id, editingPlayer);
    }
    setEditingPlayer(null);
    setIsNewPlayer(false);
  };

  const handleAddPlayerChip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChipInput.trim() || !editingPlayer) return;
    setEditingPlayer({
      ...editingPlayer,
      events: [...editingPlayer.events, newChipInput.trim()],
    });
    setNewChipInput("");
  };

  const handleRemovePlayerChip = (index: number) => {
    if (!editingPlayer) return;
    setEditingPlayer({
      ...editingPlayer,
      events: editingPlayer.events.filter((_, i) => i !== index),
    });
  };

  const handleOpenEditEvent = (evt: CompetitiveEvent, isNew = false) => {
    setEditingEvent({ ...evt });
    setIsNewEvent(isNew);
  };

  const handleSaveEvent = () => {
    if (!editingEvent) return;
    if (isNewEvent) {
      addCompetitiveEvent(editingEvent);
    } else {
      updateCompetitiveEvent(editingEvent.id, editingEvent);
    }
    setEditingEvent(null);
    setIsNewEvent(false);
  };

  const generateSqlScript = () => {
    const payload = JSON.stringify({
      roster: state.competitiveRoster || [],
      events: state.competitiveEvents || [],
    }).replace(/'/g, "''");

    return `-- =========================================================
-- SQL PARA SUPABASE: SECCIÓN COMPETITIVO (ROSTER UL)
-- =========================================================

-- 1. Inserción directa en la tabla de configuración activa
INSERT INTO public.team_groups (id, title, description, accent, order_index, updated_at)
VALUES (
  'config_competitive_roster',
  'Roster Competitivo UL',
  '${payload}',
  'crimson',
  998,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();

-- 2. (Opcional) Tabla dedicada si prefieres estructurar en filas individuales:
CREATE TABLE IF NOT EXISTS public.competitive_players (
  id TEXT PRIMARY KEY,
  tag TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  position TEXT NOT NULL,
  avatar_type TEXT DEFAULT 'monogram',
  avatar_image TEXT,
  gradient TEXT DEFAULT 'from-orange-500 to-rose-600',
  events JSONB DEFAULT '[]'::jsonb,
  socials JSONB DEFAULT '{}'::jsonb,
  order_index INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.competitive_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Lectura pública competitive_players" ON public.competitive_players FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Escritura competitive_players" ON public.competitive_players FOR ALL USING (true) WITH CHECK (true);
`;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header with Title and Global Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">
              Escena Esports & Competitivo
            </p>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
            Editor de <span className="text-brand-gradient">Competitivo (UL)</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Gestiona las casillas de los jugadores de la escuadra UL, fotos oficiales en Cloudflare R2, roles, redes sociales e historial de eventos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSqlModal(true)}
          >
            <Database className="h-4 w-4 text-orange-400" />
            Ver SQL Supabase
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveToSupabase}
            disabled={isSyncingSupabase}
            className={cn(
              "transition-all",
              syncSuccess && "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white"
            )}
          >
            {isSyncingSupabase ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : syncSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>¡Guardado en Web!</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Guardar en Web</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sync Error Alert */}
      {syncError && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <span>{syncError}</span>
          <button
            onClick={() => setSyncError(null)}
            className="text-rose-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Subtabs Selector: Roster vs Historical Events */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("roster")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeSubTab === "roster"
                ? "bg-brand-gradient text-white shadow-[0_4px_16px_rgba(249,115,22,0.4)]"
                : "bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
            )}
          >
            <Shield className="h-4 w-4" />
            <span>1. Roster Oficial ({roster.length} Jugadores)</span>
          </button>

          <button
            onClick={() => setActiveSubTab("events")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeSubTab === "events"
                ? "bg-brand-gradient text-white shadow-[0_4px_16px_rgba(249,115,22,0.4)]"
                : "bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
            )}
          >
            <Flag className="h-4 w-4" />
            <span>2. Historial de Torneos ({events.length} Eventos)</span>
          </button>
        </div>

        <div>
          {activeSubTab === "roster" ? (
            <Button
              size="sm"
              onClick={() => {
                const nextNum = (roster.length + 1).toString().padStart(2, "0");
                handleOpenEditPlayer(
                  {
                    id: `player-${Date.now()}`,
                    tag: nextNum,
                    name: "NUEVO JUGADOR",
                    role: "DPS Hitscan",
                    position: "Titular",
                    avatarType: "monogram",
                    gradient: "from-orange-500 to-rose-600",
                    events: ["Tourney 3", "Clash Cup"],
                    socials: {
                      x: { enabled: true, url: "https://x.com/OverplayEsports" },
                      twitch: { enabled: true, url: "https://twitch.tv/OverplayEsports" },
                      instagram: { enabled: false, url: "#" },
                      youtube: { enabled: false, url: "#" },
                      discord: { enabled: false, url: "#" },
                    },
                  },
                  true
                );
              }}
            >
              <Plus className="h-4 w-4" />
              Agregar Jugador
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                handleOpenEditEvent(
                  {
                    id: `event-${Date.now()}`,
                    name: "Nuevo Torneo Oficial",
                    year: new Date().getFullYear().toString(),
                    result: "Campeones",
                    tier: "gold",
                    blurb: "Breve descripción de los logros y desempeño del equipo en este torneo.",
                  },
                  true
                );
              }}
            >
              <Plus className="h-4 w-4" />
              Agregar Evento al Historial
            </Button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: ROSTER GRID */}
      {activeSubTab === "roster" && (
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {roster.map((player, index) => {
              return (
                <article
                  key={player.id}
                  className="card-surface group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-400/40 hover:shadow-[0_20px_50px_-20px_rgba(249,115,22,0.35)]"
                >
                  {/* Glowing background */}
                  <span
                    aria-hidden
                    className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                  />

                  {/* Top Bar with Reorder and Actions */}
                  <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-20 bg-[#07070a]/90 backdrop-blur-md rounded-lg p-1 border border-white/10">
                    <button
                      onClick={() => moveCompetitivePlayer(player.id, "left")}
                      disabled={index === 0}
                      title="Mover a la izquierda"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveCompetitivePlayer(player.id, "right")}
                      disabled={index === roster.length - 1}
                      title="Mover a la derecha"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditPlayer(player, false)}
                      title="Editar jugador"
                      className="p-1 text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar al jugador "${player.name}" del roster?`)) {
                          removeCompetitivePlayer(player.id);
                        }
                      }}
                      title="Eliminar jugador"
                      className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    {/* Top Row: Avatar on the left, Name & Role & Events on the right */}
                    <div className="relative flex items-start gap-4">
                      {/* Left: Avatar & Upload Trigger */}
                      <div className="shrink-0 flex flex-col items-center gap-2">
                        <div
                          onClick={() => handleOpenEditPlayer(player, false)}
                          className="group/avatar relative cursor-pointer transition-transform duration-300 hover:scale-105"
                          title="Clic para editar avatar / foto"
                        >
                          {player.avatarType === "image" && player.avatarImage ? (
                            <div className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-2xl border-2 border-orange-500/40 bg-black/60 shadow-lg ring-2 ring-white/10">
                              <img
                                src={player.avatarImage}
                                alt={player.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <MonogramAvatar
                              name={player.name}
                              gradient={player.gradient}
                              size="xl"
                            />
                          )}

                          {/* Hover Overlay with Upload Icon */}
                          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 transition-opacity group-hover/avatar:opacity-100">
                            <Upload className="h-5 w-5 text-orange-400" />
                          </div>
                        </div>

                        {/* Direct R2 Upload Button on Card */}
                        <div className="flex flex-col items-center gap-1">
                          <input
                            ref={(el) => (cardFileInputRefs.current[player.id] = el)}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleCardImageUpload(player.id, e)}
                          />
                          <button
                            type="button"
                            onClick={() => cardFileInputRefs.current[player.id]?.click()}
                            disabled={uploadingPlayerId === player.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-300 hover:bg-orange-500/20 cursor-pointer disabled:opacity-50 transition-colors"
                            title="Subir imagen a Cloudflare R2 bucket"
                          >
                            {uploadingPlayerId === player.id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin text-orange-400" />
                                <span>Subiendo...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-3 w-3 text-orange-400" />
                                <span>Subir R2</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Right: Player Name, Role, Position, Tag & Events */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-display text-xl sm:text-2xl font-bold uppercase italic tracking-wide text-white truncate">
                            {player.name}
                          </h3>
                          <span
                            aria-hidden
                            className="select-none font-display text-3xl font-bold italic leading-none text-white/[0.12] transition-colors duration-300 group-hover:text-orange-500/30"
                          >
                            {player.tag}
                          </span>
                        </div>

                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          <span className="font-bold text-orange-300">
                            {player.role}
                          </span>
                          <span aria-hidden className="h-1 w-1 rounded-full bg-white/30" />
                          <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-display text-[9px] font-semibold uppercase tracking-wider text-white/70">
                            {player.position}
                          </span>
                        </p>

                        {/* Events Chips */}
                        <div className="relative mt-2.5 flex flex-wrap gap-1">
                          {player.events?.map((event, idx) => (
                            <span
                              key={idx}
                              className="rounded-md border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 font-display text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60 transition-colors group-hover:border-white/20 group-hover:text-white/80"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Buttons & Edit Card Footer */}
                  <div className="relative mt-5 space-y-2.5 border-t border-white/[0.08] pt-3.5">
                    <div className="flex items-center justify-center gap-2">
                      {SOCIAL_LIST.map((platform) => {
                        const isEnabled = player.socials?.[platform]?.enabled ?? false;
                        const url = player.socials?.[platform]?.url || "#";
                        const Icon = SOCIAL_ICONS[platform];
                        const meta = SOCIAL_META[platform];

                        return (
                          <button
                            key={platform}
                            type="button"
                            onClick={() =>
                              toggleCompetitiveSocial(
                                player.id,
                                platform,
                                !isEnabled
                              )
                            }
                            title={`${meta?.name || platform}: ${
                              isEnabled ? "Activo (Clic para desactivar)" : "Inactivo (Clic para activar)"
                            }`}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-lg border transition-all cursor-pointer",
                              isEnabled
                                ? "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 shadow-sm"
                                : "border-white/5 bg-white/[0.02] text-white/20 hover:border-white/20 hover:text-white/50"
                            )}
                          >
                            <Icon className="h-3 w-3" />
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-2">
                      <span className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                        UL · OFICIAL
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditPlayer(player, false)}
                        className="text-xs font-bold text-orange-400 hover:text-orange-300 cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: TOURNAMENT HISTORY EVENTS */}
      {activeSubTab === "events" && (
        <div className="mt-8 space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {events.map((evt, index) => {
              const tier = TIER_STYLES[evt.tier] || TIER_STYLES.neutral;

              return (
                <article
                  key={evt.id}
                  className={cn(
                    "card-surface group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1.5",
                    tier.border
                  )}
                >
                  {/* Top Bar Actions */}
                  <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-20 bg-[#07070a]/90 backdrop-blur-md rounded-lg p-1 border border-white/10">
                    <button
                      onClick={() => moveCompetitiveEvent(evt.id, "left")}
                      disabled={index === 0}
                      title="Mover a la izquierda"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveCompetitiveEvent(evt.id, "right")}
                      disabled={index === events.length - 1}
                      title="Mover a la derecha"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditEvent(evt, false)}
                      title="Editar evento"
                      className="p-1 text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar evento "${evt.name}" del historial?`)) {
                          removeCompetitiveEvent(evt.id);
                        }
                      }}
                      title="Eliminar evento"
                      className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-display text-xs font-bold tracking-[0.3em] text-white/40">
                        {evt.year}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em]",
                          tier.badge
                        )}
                      >
                        <Medal className={cn("h-3 w-3", tier.icon)} />
                        {evt.result}
                      </span>
                    </div>

                    <h3 className="mt-4 font-display text-lg font-bold uppercase italic leading-tight text-white">
                      {evt.name}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-white/50">
                      {evt.blurb}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="font-display text-[9px] font-bold uppercase tracking-wider text-white/30">
                      Medalla: {tier.label.split(" ")[0]}
                    </span>
                    <button
                      onClick={() => handleOpenEditEvent(evt, false)}
                      className="text-xs font-bold text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT / CREATE PLAYER MODAL */}
      {editingPlayer && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    {isNewPlayer ? "Nuevo Jugador del Roster" : "Editar Ficha de Jugador"}
                  </h3>
                  <p className="text-xs text-white/50">
                    Personaliza datos de esports, rol, foto en R2 y redes sociales de {editingPlayer.name}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPlayer(null)}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="mt-6 flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Row 1: Tag & Nickname */}
              <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Número / Tag
                  </label>
                  <input
                    type="text"
                    value={editingPlayer.tag}
                    onChange={(e) =>
                      setEditingPlayer({ ...editingPlayer, tag: e.target.value })
                    }
                    placeholder="01"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm text-center font-bold text-orange-400 focus:border-orange-500 focus:outline-none font-display"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Nickname / Nombre en Juego
                  </label>
                  <input
                    type="text"
                    value={editingPlayer.name}
                    onChange={(e) =>
                      setEditingPlayer({ ...editingPlayer, name: e.target.value.toUpperCase() })
                    }
                    placeholder="Ej. KRON, VIPER, NOVA..."
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-bold uppercase italic tracking-wider text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Role Selection Modal / Pills */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/80">
                    Rol en la Escuadra
                  </label>
                  <span className="font-display text-xs font-bold text-orange-400">
                    Seleccionado: {editingPlayer.role}
                  </span>
                </div>

                <div className="space-y-3">
                  {PREDEFINED_ROLES.map((group) => (
                    <div key={group.category} className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        {group.category}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {group.roles.map((r) => {
                          const isSelected = editingPlayer.role === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() =>
                                setEditingPlayer({ ...editingPlayer, role: r })
                              }
                              className={cn(
                                "rounded-lg border px-3 py-1 font-display text-xs font-semibold transition-all cursor-pointer",
                                isSelected
                                  ? "border-orange-500 bg-orange-500/20 text-white shadow-sm"
                                  : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/25 hover:text-white"
                              )}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] text-white/50 mb-1">
                    O escribe un rol personalizado:
                  </label>
                  <input
                    type="text"
                    value={editingPlayer.role}
                    onChange={(e) =>
                      setEditingPlayer({ ...editingPlayer, role: e.target.value })
                    }
                    placeholder="Escribe el rol..."
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Position Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Posición / Estado
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_POSITIONS.map((pos) => {
                    const isSelected = editingPlayer.position === pos;
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() =>
                          setEditingPlayer({ ...editingPlayer, position: pos })
                        }
                        className={cn(
                          "rounded-xl border px-3.5 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                          isSelected
                            ? "border-rose-500 bg-rose-500/20 text-white shadow-sm"
                            : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white"
                        )}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Avatar Type, Image Upload R2 & Gradient */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/90">
                    Foto de Perfil & Avatar del Jugador
                  </label>
                  <span className="text-[11px] text-orange-400 font-semibold">
                    {editingPlayer.avatarType === "image" ? "Foto en Cloudflare R2" : "Monograma"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingPlayer({ ...editingPlayer, avatarType: "monogram" })
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                      editingPlayer.avatarType === "monogram"
                        ? "border-orange-500 bg-orange-500/20 text-white shadow-sm"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    <Sparkles className="h-4 w-4 text-orange-400" />
                    <span>Monograma</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingPlayer({ ...editingPlayer, avatarType: "image" })
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                      editingPlayer.avatarType === "image"
                        ? "border-orange-500 bg-orange-500/20 text-white shadow-sm"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    <Upload className="h-4 w-4 text-orange-400" />
                    <span>Foto Oficial (R2)</span>
                  </button>
                </div>

                {editingPlayer.avatarType === "image" ? (
                  <div className="space-y-4 rounded-xl border border-white/10 bg-black/40 p-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {editingPlayer.avatarImage ? (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-orange-500/50 bg-black/60 shadow-md ring-2 ring-white/10">
                          <img
                            src={editingPlayer.avatarImage}
                            alt="Avatar Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.02] text-white/40 text-center p-1">
                          <User className="h-6 w-6 text-white/30" />
                          <span className="text-[9px] mt-1 text-white/30">Sin foto</span>
                        </div>
                      )}

                      <div className="flex-1 w-full space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageFileUpload}
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border border-orange-400/50 bg-brand-gradient py-2.5 px-4 font-display text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)] hover:brightness-110 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.99]"
                        >
                          {isUploadingAvatar ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Subiendo a Cloudflare R2...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span>Subir Imagen a Cloudflare R2</span>
                            </>
                          )}
                        </button>

                        <p className="text-[11px] text-white/40">
                          Se guardará en el bucket <code className="text-orange-300">imagenesoverplay/roster/</code> con URL pública CDN.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/[0.07]">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60">
                        Enlace / URL de la imagen en R2:
                      </label>
                      <input
                        type="text"
                        value={editingPlayer.avatarImage || ""}
                        onChange={(e) =>
                          setEditingPlayer({
                            ...editingPlayer,
                            avatarImage: e.target.value,
                          })
                        }
                        placeholder="https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev/roster/ejemplo.webp"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <label className="block text-[11px] text-white/50">
                      Selecciona la paleta de gradiente:
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {GRADIENT_PRESETS.map((preset) => {
                        const isSelected = editingPlayer.gradient === preset.value;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() =>
                              setEditingPlayer({
                                ...editingPlayer,
                                gradient: preset.value,
                              })
                            }
                            className={cn(
                              "flex h-8 w-full items-center justify-center rounded-xl bg-gradient-to-r transition-transform cursor-pointer",
                              preset.value,
                              isSelected
                                ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-105"
                                : "opacity-70 hover:opacity-100"
                            )}
                            title={preset.name}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 5: Events Played (Chips) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Torneos Disputados (Etiquetas)
                </label>
                <div className="flex flex-wrap gap-2">
                  {editingPlayer.events?.map((ev, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-white"
                    >
                      <Tag className="h-3 w-3 text-orange-400" />
                      <span>{ev}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePlayerChip(idx)}
                        className="text-white/40 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChipInput}
                    onChange={(e) => setNewChipInput(e.target.value)}
                    placeholder="Nuevo torneo (Ej: Tourney 4, LAN 2026...)"
                    className="flex-1 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPlayerChip(e);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddPlayerChip}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Row 6: Social Networks (5 platforms toggle + URL) */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/80">
                  Redes Sociales del Jugador
                </label>
                <div className="space-y-2.5">
                  {SOCIAL_LIST.map((platform) => {
                    const isEnabled = editingPlayer.socials?.[platform]?.enabled ?? false;
                    const url = editingPlayer.socials?.[platform]?.url || "";
                    const Icon = SOCIAL_ICONS[platform];
                    const meta = SOCIAL_META[platform];

                    return (
                      <div
                        key={platform}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
                          isEnabled
                            ? "border-orange-500/30 bg-orange-500/[0.03]"
                            : "border-white/5 bg-transparent opacity-60"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setEditingPlayer({
                              ...editingPlayer,
                              socials: {
                                ...editingPlayer.socials,
                                [platform]: {
                                  url: url || meta.placeholder,
                                  enabled: !isEnabled,
                                },
                              },
                            })
                          }
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer",
                            isEnabled
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-white/15 bg-white/5 text-white/40 hover:text-white"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </button>

                        <span className="w-24 text-xs font-semibold capitalize text-white">
                          {meta?.name || platform}
                        </span>

                        <input
                          type="text"
                          disabled={!isEnabled}
                          value={url === "#" ? "" : url}
                          onChange={(e) =>
                            setEditingPlayer({
                              ...editingPlayer,
                              socials: {
                                ...editingPlayer.socials,
                                [platform]: {
                                  enabled: true,
                                  url: e.target.value,
                                },
                              },
                            })
                          }
                          placeholder={meta?.placeholder || `URL de ${platform}`}
                          className="flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none disabled:opacity-40"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex shrink-0 items-center justify-end gap-3 border-t border-white/10 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPlayer(null)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSavePlayer}>
                <Check className="h-4 w-4" />
                Guardar Jugador
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT / CREATE TOURNAMENT EVENT */}
      {editingEvent && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
                  <Flag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    {isNewEvent ? "Nuevo Evento en Historial" : "Editar Evento del Historial"}
                  </h3>
                  <p className="text-xs text-white/50">
                    Añade o modifica los resultados de UL en torneos oficiales.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="mt-6 flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Nombre del Torneo / Competición
                </label>
                <input
                  type="text"
                  value={editingEvent.name}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, name: e.target.value })
                  }
                  placeholder="Ej. Overplay Tourney 4, Clash Cup..."
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Año
                  </label>
                  <input
                    type="text"
                    value={editingEvent.year}
                    onChange={(e) =>
                      setEditingEvent({ ...editingEvent, year: e.target.value })
                    }
                    placeholder="2026"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm text-center font-bold text-orange-400 focus:border-orange-500 focus:outline-none font-display"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Resultado / Puesto
                  </label>
                  <input
                    type="text"
                    value={editingEvent.result}
                    onChange={(e) =>
                      setEditingEvent({ ...editingEvent, result: e.target.value })
                    }
                    placeholder="Ej. Campeones, Semifinales..."
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm font-semibold text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tier / Medalla */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Categoría de Medalla
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TIER_STYLES) as CompetitiveEvent["tier"][]).map((tierKey) => {
                    const style = TIER_STYLES[tierKey];
                    const isSelected = editingEvent.tier === tierKey;
                    return (
                      <button
                        key={tierKey}
                        type="button"
                        onClick={() =>
                          setEditingEvent({ ...editingEvent, tier: tierKey })
                        }
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer",
                          isSelected
                            ? cn("border-orange-500 bg-orange-500/10 text-white shadow-sm", style.border)
                            : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                        )}
                      >
                        <Medal className={cn("h-4 w-4", style.icon)} />
                        <span>{style.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Resumen / Descripción de la Participación
                </label>
                <textarea
                  rows={3}
                  value={editingEvent.blurb}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, blurb: e.target.value })
                  }
                  placeholder="Detalles sobre las partidas y el desempeño..."
                  className="w-full resize-none rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm leading-relaxed text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex shrink-0 items-center justify-end gap-3 border-t border-white/10 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingEvent(null)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveEvent}>
                <Check className="h-4 w-4" />
                Guardar Evento
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SQL EXPORT MODAL */}
      {showSqlModal && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    Script SQL para Supabase
                  </h3>
                  <p className="text-xs text-white/50">
                    Ejecuta este código en el SQL Editor de tu proyecto en Supabase para sincronizar manualmente.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto pr-1">
              <pre className="rounded-2xl border border-white/10 bg-black/70 p-4 text-xs font-mono text-white/90 overflow-x-auto whitespace-pre leading-relaxed">
                {generateSqlScript()}
              </pre>
            </div>

            <div className="mt-6 flex shrink-0 items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs text-white/40">
                Sincronización directa con `team_groups`
              </span>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSqlModal(false)}
                >
                  Cerrar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generateSqlScript());
                    setSqlCopied(true);
                    setTimeout(() => setSqlCopied(false), 2500);
                  }}
                >
                  {sqlCopied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-300" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copiar SQL</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
