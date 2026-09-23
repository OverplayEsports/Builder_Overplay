import { useState, useEffect } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Crown,
  Shield,
  Swords,
  Heart,
  Shuffle,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Copy,
  Check,
  Download,
  Database,
  Code,
  AlertCircle,
  Eye,
  Loader2,
  Sparkles,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  TournamentRegistrationData,
  OVERWATCH_RANKS,
} from "../../types/tournament";

export function RegistrationsEditor() {
  const [registrations, setRegistrations] = useState<TournamentRegistrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [captainFilter, setCaptainFilter] = useState<string>("all");

  // Selected registration for details/lightbox
  const [selectedReg, setSelectedReg] = useState<TournamentRegistrationData | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status updating
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // SQL Modal
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    setSyncError(null);
    try {
      const { data, error } = await supabase
        .from("tournament_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // If table doesn't exist yet, show friendly guidance
        if (error.code === "42P01") {
          setSyncError("La tabla 'tournament_registrations' aún no existe en Supabase. Haz clic en 'Ver SQL Supabase' para crearla.");
          setRegistrations([]);
        } else {
          setSyncError(`Error al consultar Supabase: ${error.message}`);
        }
      } else if (data) {
        const mapped: TournamentRegistrationData[] = data.map((row: any) => ({
          id: row.id,
          tournamentId: row.tournament_id || "tourney-4",
          tournamentName: row.tournament_name || "Overplay Tourney 4",
          isCaptain: !!row.is_captain,
          battleNetId: row.battlenet_id || "",
          discordId: row.discord_id || "",
          preferredRole: row.preferred_role || "Tanque",
          rankTank: row.rank_tank || "Platino",
          rankDps: row.rank_dps || "Platino",
          rankSupport: row.rank_support || "Platino",
          draftName: row.draft_name || "",
          favoriteHero: row.favorite_hero || "",
          careerFileUrls: Array.isArray(row.career_file_urls) ? row.career_file_urls : [],
          status: row.status || "pending",
          adminNotes: row.admin_notes || "",
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
        }));
        setRegistrations(mapped);
      }
    } catch (err: any) {
      console.error("Error al cargar inscripciones:", err);
      setSyncError(err.message || "Error al conectar con Supabase");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async (
    id: string,
    newStatus: "pending" | "approved" | "rejected" | "contacted"
  ) => {
    setIsUpdatingStatus(id);
    try {
      const { error } = await supabase
        .from("tournament_registrations")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      if (selectedReg?.id === id) {
        setSelectedReg((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      setSyncMessage("Estado actualizado correctamente");
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      setSyncError(`Error al actualizar estado: ${err.message}`);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleDelete = async (id: string, draftName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la inscripción de "${draftName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tournament_registrations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      if (selectedReg?.id === id) setSelectedReg(null);
      setSyncMessage("Inscripción eliminada correctamente");
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      setSyncError(`Error al eliminar: ${err.message}`);
    }
  };

  // Export CSV
  const exportToCsv = () => {
    if (registrations.length === 0) return;

    const headers = [
      "ID",
      "Draft Name",
      "Capitán",
      "BattleNet ID",
      "Discord ID",
      "Rol Preferido",
      "Rango Tanque",
      "Rango DPS",
      "Rango Support",
      "Héroe Favorito",
      "Estado",
      "Fecha Registro",
      "Archivos R2 URLs",
    ];

    const rows = filteredRegistrations.map((r) => [
      r.id,
      `"${r.draftName.replace(/"/g, '""')}"`,
      r.isCaptain ? "SÍ" : "NO",
      `"${r.battleNetId}"`,
      `"${r.discordId}"`,
      r.preferredRole,
      r.rankTank,
      r.rankDps,
      r.rankSupport,
      `"${r.favoriteHero}"`,
      r.status,
      r.createdAt,
      `"${r.careerFileUrls.join(" | ")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inscripciones-torneo-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered registrations
  const filteredRegistrations = registrations.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      r.draftName.toLowerCase().includes(q) ||
      r.battleNetId.toLowerCase().includes(q) ||
      r.discordId.toLowerCase().includes(q) ||
      r.favoriteHero.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesRole = roleFilter === "all" || r.preferredRole === roleFilter;
    const matchesCaptain =
      captainFilter === "all" ||
      (captainFilter === "captain" && r.isCaptain) ||
      (captainFilter === "player" && !r.isCaptain);

    return matchesQuery && matchesStatus && matchesRole && matchesCaptain;
  });

  // Metrics
  const totalCount = registrations.length;
  const captainsCount = registrations.filter((r) => r.isCaptain).length;
  const approvedCount = registrations.filter((r) => r.status === "approved").length;
  const pendingCount = registrations.filter((r) => r.status === "pending").length;
  const rejectedCount = registrations.filter((r) => r.status === "rejected").length;

  const getRankImage = (rankName: string) => {
    const found = OVERWATCH_RANKS.find((r) => r.id === rankName);
    return found?.image || "";
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Tanque":
        return <Shield className="h-4 w-4 text-blue-400" />;
      case "DPS":
        return <Swords className="h-4 w-4 text-red-400" />;
      case "Support":
        return <Heart className="h-4 w-4 text-emerald-400" />;
      case "Todos los Roles":
      default:
        return <Shuffle className="h-4 w-4 text-amber-400" />;
    }
  };

  const SQL_SNIPPET = `-- 1. Crear tabla independiente para inscripciones al torneo
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL DEFAULT 'tourney-4',
  tournament_name TEXT NOT NULL DEFAULT 'Overplay Tourney 4',
  is_captain BOOLEAN NOT NULL DEFAULT false,
  battlenet_id TEXT NOT NULL,
  discord_id TEXT NOT NULL,
  preferred_role TEXT NOT NULL,
  rank_tank TEXT NOT NULL,
  rank_dps TEXT NOT NULL,
  rank_support TEXT NOT NULL,
  draft_name TEXT NOT NULL,
  favorite_hero TEXT NOT NULL,
  career_file_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security) y Políticas de Acceso
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert tournament_registrations"
ON public.tournament_registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read tournament_registrations"
ON public.tournament_registrations FOR SELECT USING (true);

CREATE POLICY "Allow public update tournament_registrations"
ON public.tournament_registrations FOR UPDATE USING (true);

CREATE POLICY "Allow public delete tournament_registrations"
ON public.tournament_registrations FOR DELETE USING (true);
`;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Gestor de Participantes
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            Inscripciones al Torneo
          </h1>
          <p className="mt-1 text-xs text-white/60 sm:text-sm">
            Revisa las solicitudes de inscripción recibidas desde la web, inspecciona los perfiles de carrera en Cloudflare R2 y aprueba capitanes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchRegistrations}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            title="Recargar inscripciones"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={exportToCsv}
            disabled={registrations.length === 0}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/30 disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-2 rounded-xl bg-orange-500/20 border border-orange-500/40 px-3.5 py-2.5 text-xs font-bold text-orange-300 transition-all hover:bg-orange-500 hover:text-white"
          >
            <Database className="h-4 w-4" />
            <span>Ver SQL Supabase</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {syncMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs sm:text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {syncError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs sm:text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Métricas / Contadores */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Total Inscritos
          </span>
          <div className="mt-1 text-2xl font-black text-white">{totalCount}</div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/70 flex items-center justify-center gap-1">
            <Crown className="h-3 w-3" /> Capitanes
          </span>
          <div className="mt-1 text-2xl font-black text-amber-300">{captainsCount}</div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70">
            Aprobados
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-400">{approvedCount}</div>
        </div>

        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-400/70">
            Pendientes
          </span>
          <div className="mt-1 text-2xl font-black text-orange-400">{pendingCount}</div>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400/70">
            Rechazados
          </span>
          <div className="mt-1 text-2xl font-black text-red-400">{rejectedCount}</div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 sm:flex-row sm:items-center">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por BattleNet, Discord, Nombre Draft o Héroe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-4 text-xs text-white placeholder-white/30 focus:border-orange-500 focus:outline-none sm:text-sm"
          />
        </div>

        {/* Filtro de Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
        >
          <option value="all">Todos los Estados</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
        </select>

        {/* Filtro de Rol */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
        >
          <option value="all">Todos los Roles</option>
          <option value="Tanque">Tanque</option>
          <option value="DPS">DPS</option>
          <option value="Support">Support</option>
          <option value="Todos los Roles">Todos los Roles</option>
        </select>

        {/* Filtro de Capitanes */}
        <select
          value={captainFilter}
          onChange={(e) => setCaptainFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
        >
          <option value="all">Todos (Capitanes y Jugadores)</option>
          <option value="captain">Solo Capitanes</option>
          <option value="player">Solo Jugadores</option>
        </select>
      </div>

      {/* Lista / Tabla de Participantes */}
      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
          <span className="mt-3 text-xs text-white/50">Cargando inscripciones desde Supabase...</span>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-center p-6">
          <Users className="h-10 w-10 text-white/20 mb-2" />
          <p className="text-sm font-semibold text-white/70">No se encontraron inscripciones</p>
          <p className="mt-1 text-xs text-white/40 max-w-sm">
            {searchQuery || statusFilter !== "all" || roleFilter !== "all" || captainFilter !== "all"
              ? "Prueba cambiando los filtros de búsqueda."
              : "Cuando los participantes rellenen el formulario en la web, aparecerán aquí en tiempo real."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRegistrations.map((reg) => {
            const isCapt = reg.isCaptain;
            return (
              <div
                key={reg.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all ${
                  isCapt
                    ? "border-amber-500/30 bg-gradient-to-b from-amber-500/[0.04] to-black/40 shadow-lg shadow-amber-500/5"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                {/* Cabecera Tarjeta */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {isCapt && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">
                            <Crown className="h-3 w-3" /> Capitán
                          </span>
                        )}
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            reg.status === "approved"
                              ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                              : reg.status === "rejected"
                              ? "border border-red-500/40 bg-red-500/15 text-red-300"
                              : "border border-orange-500/40 bg-orange-500/15 text-orange-300"
                          }`}
                        >
                          {reg.status === "approved"
                            ? "Aprobado"
                            : reg.status === "rejected"
                            ? "Rechazado"
                            : "Pendiente"}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-lg font-black text-white">{reg.draftName}</h3>
                      <p className="text-xs text-white/50">
                        Héroe Favorito: <span className="text-orange-300 font-semibold">{reg.favoriteHero}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(reg.id, reg.draftName)}
                      className="rounded-lg p-1 text-white/30 transition-colors hover:bg-red-500/20 hover:text-red-400"
                      title="Eliminar inscripción"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* IDs BattleNet y Discord */}
                  <div className="mt-3.5 space-y-1.5 rounded-xl border border-white/5 bg-black/40 p-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">BattleNet:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-300">{reg.battleNetId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(reg.battleNetId, `bnet-${reg.id}`)}
                          className="text-white/40 hover:text-white"
                          title="Copiar BattleTag"
                        >
                          {copiedId === `bnet-${reg.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/40">Discord:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-indigo-300">{reg.discordId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(reg.discordId, `disc-${reg.id}`)}
                          className="text-white/40 hover:text-white"
                          title="Copiar Discord ID"
                        >
                          {copiedId === `disc-${reg.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rol y Rangos */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                      <span className="font-semibold">Rol Elegido:</span>
                      <span className="inline-flex items-center gap-1 font-bold text-white">
                        {getRoleIcon(reg.preferredRole)}
                        {reg.preferredRole}
                      </span>
                    </div>

                    {/* Medallas de Rango */}
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="rounded-lg border border-white/5 bg-black/30 p-2">
                        <span className="text-[10px] font-bold text-blue-400 block">TANQUE</span>
                        <div className="mt-1 flex flex-col items-center justify-center">
                          {getRankImage(reg.rankTank) ? (
                            <img
                              src={getRankImage(reg.rankTank)}
                              alt={reg.rankTank}
                              className="h-6 w-6 object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-white/40">Unranked</span>
                          )}
                          <span className="text-[10px] text-white/80 font-medium">{reg.rankTank}</span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/5 bg-black/30 p-2">
                        <span className="text-[10px] font-bold text-red-400 block">DPS</span>
                        <div className="mt-1 flex flex-col items-center justify-center">
                          {getRankImage(reg.rankDps) ? (
                            <img
                              src={getRankImage(reg.rankDps)}
                              alt={reg.rankDps}
                              className="h-6 w-6 object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-white/40">Unranked</span>
                          )}
                          <span className="text-[10px] text-white/80 font-medium">{reg.rankDps}</span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/5 bg-black/30 p-2">
                        <span className="text-[10px] font-bold text-emerald-400 block">SUPPORT</span>
                        <div className="mt-1 flex flex-col items-center justify-center">
                          {getRankImage(reg.rankSupport) ? (
                            <img
                              src={getRankImage(reg.rankSupport)}
                              alt={reg.rankSupport}
                              className="h-6 w-6 object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-white/40">Unranked</span>
                          )}
                          <span className="text-[10px] text-white/80 font-medium">{reg.rankSupport}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Archivos / Capturas en R2 */}
                  {reg.careerFileUrls.length > 0 && (
                    <div className="mt-3.5">
                      <span className="text-[11px] font-semibold text-white/60 block mb-1.5">
                        Perfil de Carrera ({reg.careerFileUrls.length} archivo(s) en R2):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {reg.careerFileUrls.map((url, idx) => {
                          const isPdf = url.toLowerCase().endsWith(".pdf");
                          return (
                            <div key={idx} className="relative group">
                              {isPdf ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-950/40 px-2 py-1 text-[11px] text-red-300 hover:bg-red-900/50"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>PDF #{idx + 1}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setLightboxImage(url)}
                                  className="relative h-11 w-11 overflow-hidden rounded-lg border border-white/10 bg-black hover:border-orange-500"
                                  title="Click para ampliar imagen"
                                >
                                  <img src={url} alt="Captura" className="h-full w-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="h-3.5 w-3.5 text-white" />
                                  </div>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones de Estado */}
                <div className="mt-4 border-t border-white/5 pt-3.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-white/40">
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isUpdatingStatus === reg.id || reg.status === "approved"}
                      onClick={() => handleStatusChange(reg.id, "approved")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        reg.status === "approved"
                          ? "bg-emerald-500 text-white"
                          : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                      }`}
                    >
                      Aprobar
                    </button>

                    <button
                      type="button"
                      disabled={isUpdatingStatus === reg.id || reg.status === "rejected"}
                      onClick={() => handleStatusChange(reg.id, "rejected")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        reg.status === "rejected"
                          ? "bg-red-500 text-white"
                          : "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                      }`}
                    >
                      Rechazar
                    </button>

                    {reg.status !== "pending" && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus === reg.id}
                        onClick={() => handleStatusChange(reg.id, "pending")}
                        className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/50 hover:bg-white/5 hover:text-white"
                        title="Marcar como pendiente"
                      >
                        Pendiente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal para Inspeccionar Imagen de R2 */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-white/15 bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-white/20"
            >
              ✕
            </button>
            <img
              src={lightboxImage}
              alt="Captura ampliada"
              className="max-h-[85vh] w-auto max-w-[85vw] object-contain"
            />
            <div className="border-t border-white/10 bg-black/80 p-3 text-center">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:underline"
              >
                <span>Abrir archivo original en nueva pestaña</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal SQL de Supabase */}
      {showSqlModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setShowSqlModal(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0e0e13] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSqlModal(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">
                SQL de Supabase para Tabla de Inscripciones
              </h2>
            </div>
            <p className="mt-1 text-xs text-white/60">
              Copia y pega este script en el <strong>SQL Editor</strong> de Supabase para crear la tabla independiente de inscripciones.
            </p>

            <div className="mt-4 relative">
              <pre className="max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-amber-200">
                {SQL_SNIPPET}
              </pre>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SQL_SNIPPET);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-orange-600"
              >
                {copiedSql ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-xs font-bold text-white hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
