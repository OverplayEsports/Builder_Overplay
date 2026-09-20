import { useState, useRef, useEffect } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  Handshake,
  Plus,
  Trash2,
  Edit3,
  MoveLeft,
  MoveRight,
  Upload,
  Check,
  X,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Database,
  Sparkles,
  User,
  Copy,
  ArrowUpRight,
} from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { GRADIENT_PRESETS } from "../../data/initialData";
import { supabase } from "../../lib/supabase";
import type { AllyItem, SocialPlatform } from "../../types/builder";
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

const PREDEFINED_BADGES = [
  "Creador de contenido",
  "Streamer",
  "Arte & Clips",
  "Caster & Análisis",
  "Colaborador",
  "Partner Oficial",
  "Organización",
  "Comunidad",
];

export function AlliesEditor() {
  const {
    state,
    addAlly,
    updateAlly,
    removeAlly,
    moveAlly,
    toggleAllySocial,
    updateAllySocialUrl,
    setAlliesList,
    generateAlliesTSCode,
  } = useBuilder();

  const [editingAlly, setEditingAlly] = useState<AllyItem | null>(null);
  const [isNewAlly, setIsNewAlly] = useState(false);

  // SQL Modal state
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Sync / Upload states
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadingAllyId, setUploadingAllyId] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const allies = state.allies || [];

  // Cargar datos de aliados desde Supabase al montar
  useEffect(() => {
    supabase
      .from("team_groups")
      .select("*")
      .eq("id", "config_allies")
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data && data.description) {
          try {
            const parsed = JSON.parse(data.description);
            if (parsed && typeof parsed === "object") {
              if (parsed.allies && Array.isArray(parsed.allies)) {
                setAlliesList(parsed.allies);
              }
            }
          } catch (e) {
            console.warn("Error parsing allies data from Supabase:", e);
          }
        }
      });
  }, []);

  // Subida directa de Avatar al Cloudflare R2 Bucket en la carpeta allies/
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
    const fileKey = `allies/${Date.now()}-${cleanBaseName}.${ext}`;

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
    if (!file || !editingAlly) return;
    setIsUploadingAvatar(true);
    setSyncError(null);

    try {
      const publicUrl = await uploadAvatarToR2(file);
      setEditingAlly({
        ...editingAlly,
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

  const handleCardImageUpload = async (allyId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAllyId(allyId);
    setSyncError(null);

    try {
      const publicUrl = await uploadAvatarToR2(file);
      updateAlly(allyId, {
        avatarType: "image",
        avatarImage: publicUrl,
      });
    } catch (err: any) {
      console.error("Error al subir imagen a R2:", err);
      setSyncError(`Error al subir imagen a R2: ${err.message || "Error de conexión"}`);
    } finally {
      setUploadingAllyId(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSyncError(null);

    try {
      const payload = {
        allies: state.allies || [],
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase.from("team_groups").upsert({
        id: "config_allies",
        title: "Nuestros Aliados",
        description: JSON.stringify(payload),
        accent: "violet",
        order_index: 997,
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

  const handleOpenEditAlly = (ally: AllyItem, isNew = false) => {
    setEditingAlly({ ...ally });
    setIsNewAlly(isNew);
  };

  const handleSaveAlly = () => {
    if (!editingAlly) return;
    if (isNewAlly) {
      addAlly(editingAlly);
    } else {
      updateAlly(editingAlly.id, editingAlly);
    }
    setEditingAlly(null);
    setIsNewAlly(false);
  };

  const generateSqlScript = () => {
    const payload = JSON.stringify({
      allies: state.allies || [],
    }).replace(/'/g, "''");

    return `-- =========================================================
-- SQL PARA SUPABASE: SECCIÓN NUESTROS ALIADOS
-- =========================================================

-- Inserción directa en la tabla de configuración activa
INSERT INTO public.team_groups (id, title, description, accent, order_index, updated_at)
VALUES (
  'config_allies',
  'Nuestros Aliados',
  '${payload}',
  'violet',
  997,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();
`;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header with Title and Global Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-violet-400">
              Programa de Creadores & Comunidad
            </p>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
            Editor de <span className="text-brand-gradient">Nuestros Aliados</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Gestiona los creadores de contenido, casters y streamers aliados, fotos en Cloudflare R2, insignias y enlaces directos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSqlModal(true)}
          >
            <Database className="h-4 w-4 text-violet-400" />
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

          <Button
            size="sm"
            onClick={() => {
              handleOpenEditAlly(
                {
                  id: `ally-${Date.now()}`,
                  name: "Nuevo Creador",
                  badge: "Creador de contenido",
                  description: "Descripción del creador de contenido, streamer o colaborador que apoya el proyecto.",
                  link: "https://twitch.tv",
                  avatarType: "monogram",
                  gradient: "from-violet-500 to-fuchsia-600",
                  socials: {
                    x: { enabled: true, url: "https://x.com" },
                    twitch: { enabled: true, url: "https://twitch.tv" },
                    youtube: { enabled: false, url: "#" },
                    instagram: { enabled: false, url: "#" },
                    discord: { enabled: false, url: "#" },
                  },
                },
                true
              );
            }}
          >
            <Plus className="h-4 w-4" />
            Agregar Aliado
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

      {/* Allies Grid List */}
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {allies.map((ally, index) => {
            return (
              <article
                key={ally.id}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-400/40 hover:bg-white/[0.05] hover:shadow-[0_20px_50px_-20px_rgba(139,92,246,0.4)]"
              >
                {/* Resplandor superior */}
                <span
                  aria-hidden
                  className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-violet-500/15 blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />

                {/* Top Action Tools */}
                <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-20 bg-[#07070a]/90 backdrop-blur-md rounded-lg p-1 border border-white/10">
                  <button
                    onClick={() => moveAlly(ally.id, "left")}
                    disabled={index === 0}
                    title="Mover a la izquierda"
                    className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                  >
                    <MoveLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveAlly(ally.id, "right")}
                    disabled={index === allies.length - 1}
                    title="Mover a la derecha"
                    className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                  >
                    <MoveRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditAlly(ally, false)}
                    title="Editar aliado"
                    className="p-1 text-violet-400 hover:text-violet-300 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar al aliado "${ally.name}"?`)) {
                        removeAlly(ally.id);
                      }
                    }}
                    title="Eliminar aliado"
                    className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Main Card Content */}
                <div className="flex flex-col items-center">
                  {/* Avatar & Direct Upload Trigger */}
                  <div className="relative mt-2">
                    <span
                      aria-hidden
                      className="absolute -inset-1.5 rounded-full bg-brand-gradient opacity-40 blur-md transition-opacity duration-500 group-hover:opacity-90"
                    />

                    <div
                      onClick={() => handleOpenEditAlly(ally, false)}
                      className="group/avatar relative cursor-pointer transition-transform duration-300 hover:scale-105"
                      title="Clic para editar foto / monograma"
                    >
                      {ally.avatarType === "image" && ally.avatarImage ? (
                        <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-full border-2 border-violet-500/50 bg-black/60 shadow-lg ring-2 ring-white/10">
                          <img
                            src={ally.avatarImage}
                            alt={ally.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <MonogramAvatar
                          name={ally.name}
                          gradient={ally.gradient}
                          size="lg"
                          rounded="full"
                        />
                      )}

                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover/avatar:opacity-100">
                        <Upload className="h-5 w-5 text-violet-300" />
                      </div>
                    </div>
                  </div>

                  {/* Direct R2 Upload Button on Card */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      ref={(el) => (cardFileInputRefs.current[ally.id] = el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCardImageUpload(ally.id, e)}
                    />
                    <button
                      type="button"
                      onClick={() => cardFileInputRefs.current[ally.id]?.click()}
                      disabled={uploadingAllyId === ally.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-300 hover:bg-violet-500/20 cursor-pointer disabled:opacity-50 transition-colors"
                      title="Subir foto a Cloudflare R2 bucket"
                    >
                      {uploadingAllyId === ally.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-violet-300" />
                          <span>Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3 text-violet-300" />
                          <span>Subir Foto R2</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Badge & Name & Description */}
                  <div className="mt-4">
                    <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 font-display text-[9px] font-bold uppercase tracking-[0.22em] text-violet-200/90">
                      {ally.badge}
                    </span>
                    <h3 className="mt-3 font-display text-xl font-bold uppercase italic tracking-wide text-white">
                      {ally.name}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-white/50">
                      {ally.description}
                    </p>
                  </div>
                </div>

                {/* Social Buttons & Canal Link Footer */}
                <div className="relative mt-6 space-y-3 border-t border-white/[0.07] pt-4">
                  <div className="flex items-center justify-center gap-1.5">
                    {SOCIAL_LIST.map((platform) => {
                      const isEnabled = ally.socials?.[platform]?.enabled ?? false;
                      const url = ally.socials?.[platform]?.url || "#";
                      const Icon = SOCIAL_ICONS[platform];
                      const meta = SOCIAL_META[platform];

                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() =>
                            toggleAllySocial(
                              ally.id,
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
                              ? "border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 shadow-sm"
                              : "border-white/5 bg-white/[0.02] text-white/20 hover:border-white/20 hover:text-white/50"
                          )}
                        >
                          <Icon className="h-3 w-3" />
                        </button>
                      );
                    })}

                    {ally.link && ally.link !== "#" && (
                      <a
                        href={ally.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/70 hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-white transition-all"
                      >
                        <span>Canal</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEditAlly(ally, false)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-2 font-display text-xs font-bold uppercase tracking-wider text-white/60 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-violet-400" />
                    <span>Editar Casilla</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* EDIT / CREATE ALLY MODAL */}
      {editingAlly && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30 text-violet-400">
                  <Handshake className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    {isNewAlly ? "Nuevo Aliado o Creador" : "Editar Ficha de Aliado"}
                  </h3>
                  <p className="text-xs text-white/50">
                    Configura la identidad, insignia, foto en Cloudflare R2 y 5 redes sociales de {editingAlly.name}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAlly(null)}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="mt-6 flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Row 1: Name & Direct Channel Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Nombre del Creador / Aliado
                  </label>
                  <input
                    type="text"
                    value={editingAlly.name}
                    onChange={(e) =>
                      setEditingAlly({ ...editingAlly, name: e.target.value })
                    }
                    placeholder="Ej. MKimada, EvilTokki..."
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-bold text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Enlace Directo al Canal / Web
                  </label>
                  <input
                    type="text"
                    value={editingAlly.link}
                    onChange={(e) =>
                      setEditingAlly({ ...editingAlly, link: e.target.value })
                    }
                    placeholder="https://twitch.tv/creador"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Badge Selection */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/80">
                    Insignia / Categoría de Aliado
                  </label>
                  <span className="font-display text-xs font-bold text-violet-400">
                    Seleccionado: {editingAlly.badge}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_BADGES.map((b) => {
                    const isSelected = editingAlly.badge === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setEditingAlly({ ...editingAlly, badge: b })}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                          isSelected
                            ? "border-violet-500 bg-violet-500/20 text-white shadow-sm"
                            : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/25 hover:text-white"
                        )}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] text-white/50 mb-1">
                    O escribe una insignia personalizada:
                  </label>
                  <input
                    type="text"
                    value={editingAlly.badge}
                    onChange={(e) =>
                      setEditingAlly({ ...editingAlly, badge: e.target.value })
                    }
                    placeholder="Escribe la categoría..."
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Descripción del Aliado / Colaborador
                </label>
                <textarea
                  rows={3}
                  value={editingAlly.description}
                  onChange={(e) =>
                    setEditingAlly({ ...editingAlly, description: e.target.value })
                  }
                  placeholder="Describe su contenido, estilo de stream o colaboración con Overplay..."
                  className="w-full resize-none rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm leading-relaxed text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* Row 4: Avatar Type & Image Upload to R2 */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/90">
                    Foto de Perfil & Avatar del Aliado
                  </label>
                  <span className="text-[11px] text-violet-400 font-semibold">
                    {editingAlly.avatarType === "image" ? "Foto en Cloudflare R2" : "Monograma"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingAlly({ ...editingAlly, avatarType: "monogram" })
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                      editingAlly.avatarType === "monogram"
                        ? "border-violet-500 bg-violet-500/20 text-white shadow-sm"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span>Monograma</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingAlly({ ...editingAlly, avatarType: "image" })
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                      editingAlly.avatarType === "image"
                        ? "border-violet-500 bg-violet-500/20 text-white shadow-sm"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    <Upload className="h-4 w-4 text-violet-400" />
                    <span>Foto Oficial (R2)</span>
                  </button>
                </div>

                {editingAlly.avatarType === "image" ? (
                  <div className="space-y-4 rounded-xl border border-white/10 bg-black/40 p-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {editingAlly.avatarImage ? (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-violet-500/50 bg-black/60 shadow-md ring-2 ring-white/10">
                          <img
                            src={editingAlly.avatarImage}
                            alt="Avatar Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border border-dashed border-white/20 bg-white/[0.02] text-white/40 text-center p-1">
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
                          className="w-full flex items-center justify-center gap-2 rounded-xl border border-violet-400/50 bg-brand-gradient py-2.5 px-4 font-display text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)] hover:brightness-110 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.99]"
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
                          Se guardará en el bucket <code className="text-violet-300">imagenesoverplay/allies/</code> con URL pública CDN.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/[0.07]">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60">
                        Enlace / URL de la imagen en R2:
                      </label>
                      <input
                        type="text"
                        value={editingAlly.avatarImage || ""}
                        onChange={(e) =>
                          setEditingAlly({
                            ...editingAlly,
                            avatarImage: e.target.value,
                          })
                        }
                        placeholder="https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev/allies/ejemplo.webp"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white placeholder:text-white/20 focus:border-violet-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <label className="block text-[11px] text-white/50">
                      Selecciona la paleta de degradado:
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {GRADIENT_PRESETS.map((preset) => {
                        const isSelected = editingAlly.gradient === preset.value;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() =>
                              setEditingAlly({
                                ...editingAlly,
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

              {/* Row 5: 5 Social Networks */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/80">
                  Redes Sociales del Aliado
                </label>
                <div className="space-y-2.5">
                  {SOCIAL_LIST.map((platform) => {
                    const isEnabled = editingAlly.socials?.[platform]?.enabled ?? false;
                    const url = editingAlly.socials?.[platform]?.url || "";
                    const Icon = SOCIAL_ICONS[platform];
                    const meta = SOCIAL_META[platform];

                    return (
                      <div
                        key={platform}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
                          isEnabled
                            ? "border-violet-500/30 bg-violet-500/[0.03]"
                            : "border-white/5 bg-transparent opacity-60"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setEditingAlly({
                              ...editingAlly,
                              socials: {
                                ...editingAlly.socials,
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
                              ? "border-violet-500 bg-violet-500 text-white"
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
                            setEditingAlly({
                              ...editingAlly,
                              socials: {
                                ...editingAlly.socials,
                                [platform]: {
                                  enabled: true,
                                  url: e.target.value,
                                },
                              },
                            })
                          }
                          placeholder={meta?.placeholder || `URL de ${platform}`}
                          className="flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:border-violet-500 focus:outline-none disabled:opacity-40"
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
                onClick={() => setEditingAlly(null)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveAlly}>
                <Check className="h-4 w-4" />
                Guardar Aliado
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SQL EXPORT MODAL */}
      {showSqlModal && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30 text-violet-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    Script SQL para Supabase (Aliados)
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
                Sincronización directa con `team_groups` (id: config_allies)
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
