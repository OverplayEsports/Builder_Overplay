import { useState } from "react";
import {
  Flame,
  Sparkles,
  Save,
  CheckCircle2,
  Upload,
  Code2,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  Swords,
  Link as LinkIcon,
} from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { Button } from "../ui/Button";
import { supabase } from "../../lib/supabase";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DEFAULT_HERO_CONFIG } from "../../data/initialData";
import type { HeroConfig } from "../../types/builder";

export function HeroEditor() {
  const { state } = useBuilder();
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(
    state.heroConfig || DEFAULT_HERO_CONFIG
  );

  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Subida directa de Fondo a Cloudflare R2
  const uploadBgToR2 = async (file: File): Promise<string> => {
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
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const fileKey = `hero/${Date.now()}-${cleanBaseName}.${ext}`;

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

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBg(true);
    setSyncError(null);

    try {
      const publicUrl = await uploadBgToR2(file);
      setHeroConfig((prev) => ({ ...prev, backgroundImage: publicUrl }));
    } catch (err: any) {
      console.error("Error al subir fondo a R2:", err);
      setSyncError(`Error al subir imagen a R2: ${err.message || "Verifica credenciales"}`);
    } finally {
      setIsUploadingBg(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveToSupabase = async () => {
    setIsSavingSupabase(true);
    setSyncError(null);

    try {
      const payload = {
        hero: heroConfig,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase.from("team_groups").upsert({
        id: "config_hero",
        title: "Configuración de Hero (Portada)",
        description: JSON.stringify(payload),
        accent: "ember",
        order_index: 995,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error al sincronizar con Supabase:", err);
      setSyncError(`Error al guardar en Supabase: ${err.message || "Revisa las credenciales"}`);
    } finally {
      setIsSavingSupabase(false);
    }
  };

  const generateSqlScript = () => {
    const payload = JSON.stringify({
      hero: heroConfig,
    }).replace(/'/g, "''");

    return `-- =========================================================
-- SQL PARA SUPABASE: SECCIÓN HERO (PORTADA)
-- =========================================================

INSERT INTO public.team_groups (id, title, description, accent, order_index, updated_at)
VALUES (
  'config_hero',
  'Configuración de Hero (Portada)',
  '${payload}',
  'ember',
  995,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  accent = EXCLUDED.accent,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();
`;
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(generateSqlScript());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
              Portada Principal · Cabecera Cinematográfica
            </p>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
            Editor de <span className="text-brand-gradient">Hero (Portada)</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Personaliza el titular de marca en una línea, estadísticas, botones de acción e imagen de fondo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-2"
          >
            <Code2 className="h-4 w-4" />
            <span>Generar SQL</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSaveToSupabase}
            disabled={isSavingSupabase}
            className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider"
          >
            {isSavingSupabase ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : syncSuccess ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{syncSuccess ? "¡Guardado!" : "Guardar en Supabase"}</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {syncSuccess && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>La configuración del Hero se ha guardado en Supabase y está sincronizada en tiempo real.</span>
        </div>
      )}

      {syncError && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {syncError}
        </div>
      )}

      {/* Grid: Preview on Left/Top, Form on Right */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Interactive Preview */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-400" />
              Vista Previa en Tiempo Real
            </h2>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070709] p-6 sm:p-8 shadow-2xl">
            {/* Background Image Preview */}
            <div className="absolute inset-0 opacity-40">
              <img
                src={heroConfig.backgroundImage || "/images/hero-bg.jpg"}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#070709]/80 via-[#070709]/50 to-[#070709]" />
            </div>

            {/* Glowing orbs */}
            <div className="pointer-events-none absolute -left-20 top-1/4 h-48 w-48 rounded-full bg-orange-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 top-10 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl" />

            <div className="relative z-10">
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px w-8 bg-gradient-to-r from-orange-500 to-transparent" />
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.35em] text-orange-300">
                  {heroConfig.eyebrow}
                </p>
              </div>

              {/* Title */}
              <h1 className="font-display text-4xl sm:text-5xl font-bold uppercase italic leading-none tracking-tight">
                <span className="text-white">{heroConfig.titlePrefix}</span>
                <span className="text-brand-gradient">{heroConfig.titleHighlight}</span>
              </h1>

              {/* Tagline */}
              <p className="mt-4 font-display text-base font-semibold uppercase italic tracking-wide text-white/90">
                {heroConfig.tagline}
              </p>

              {/* Subtitle */}
              <p className="mt-2 text-xs leading-relaxed text-white/55">
                {heroConfig.subtitle}
              </p>

              {/* Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-xl bg-orange-500 px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5 shadow-md">
                  <Swords className="h-3.5 w-3.5" />
                  <span>{heroConfig.primaryButtonText}</span>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white">
                  <span>{heroConfig.secondaryButtonText}</span>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
                <div>
                  <span className="block font-display text-xs font-bold uppercase tracking-wider text-white/40">
                    Ediciones
                  </span>
                  <span className="font-display text-2xl font-bold italic text-white">
                    {heroConfig.editionNumber}
                  </span>
                </div>
                <div>
                  <span className="block font-display text-xs font-bold uppercase tracking-wider text-white/40">
                    Jugadores
                  </span>
                  <span className="font-display text-2xl font-bold italic text-white">
                    {heroConfig.playersCount}
                  </span>
                </div>
                <div>
                  <span className="block font-display text-xs font-bold uppercase tracking-wider text-white/40">
                    Comunidad
                  </span>
                  <span className="font-display text-2xl font-bold italic text-white">
                    {heroConfig.communityCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Configuration Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="card-surface rounded-3xl border border-white/10 p-6 space-y-5">
            <h2 className="font-display text-base font-bold uppercase italic text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Sliders className="h-4 w-4 text-orange-400" />
              Parámetros de la Portada
            </h2>

            {/* Titular en 1 Línea */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Prefijo del Título
                </label>
                <input
                  type="text"
                  value={heroConfig.titlePrefix}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, titlePrefix: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Over"
                />
              </div>

              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Palabra Destacada (Degradado)
                </label>
                <input
                  type="text"
                  value={heroConfig.titleHighlight}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, titleHighlight: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  placeholder="play"
                />
              </div>
            </div>

            {/* Eyebrow / Tagline */}
            <div>
              <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                Lema Superior (Eyebrow)
              </label>
              <input
                type="text"
                value={heroConfig.eyebrow}
                onChange={(e) =>
                  setHeroConfig((prev) => ({ ...prev, eyebrow: e.target.value }))
                }
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                placeholder="Organización de Esports — Overwatch"
              />
            </div>

            {/* Slogan */}
            <div>
              <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                Eslogan Principal (Tagline)
              </label>
              <input
                type="text"
                value={heroConfig.tagline}
                onChange={(e) =>
                  setHeroConfig((prev) => ({ ...prev, tagline: e.target.value }))
                }
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                placeholder="Donde la competencia comienza."
              />
            </div>

            {/* Subtítulo */}
            <div>
              <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                Subtítulo Descriptivo
              </label>
              <textarea
                rows={2}
                value={heroConfig.subtitle}
                onChange={(e) =>
                  setHeroConfig((prev) => ({ ...prev, subtitle: e.target.value }))
                }
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                placeholder="Eventos competitivos, comunidad y talento unidos en un mismo lugar."
              />
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-display text-[9px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Nº Edición
                </label>
                <input
                  type="text"
                  value={heroConfig.editionNumber}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, editionNumber: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  placeholder="04"
                />
              </div>
              <div>
                <label className="block font-display text-[9px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Jugadores
                </label>
                <input
                  type="text"
                  value={heroConfig.playersCount}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, playersCount: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  placeholder="+300"
                />
              </div>
              <div>
                <label className="block font-display text-[9px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Comunidad
                </label>
                <input
                  type="text"
                  value={heroConfig.communityCount}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, communityCount: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  placeholder="+1.2K"
                />
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Botón Primario (Texto)
                </label>
                <input
                  type="text"
                  value={heroConfig.primaryButtonText}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, primaryButtonText: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Ver Overplay Tourney 4"
                />
                <input
                  type="text"
                  value={heroConfig.primaryButtonUrl}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, primaryButtonUrl: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-mono text-white/70 focus:border-orange-500 focus:outline-none"
                  placeholder="#/eventos"
                />
              </div>

              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Botón Secundario (Texto)
                </label>
                <input
                  type="text"
                  value={heroConfig.secondaryButtonText}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, secondaryButtonText: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Sobre Nosotros"
                />
                <input
                  type="text"
                  value={heroConfig.secondaryButtonUrl}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, secondaryButtonUrl: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-mono text-white/70 focus:border-orange-500 focus:outline-none"
                  placeholder="#/nosotros"
                />
              </div>
            </div>

            {/* Imagen de Fondo / Banner */}
            <div className="border-t border-white/10 pt-4">
              <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                Fondo Cinematográfico (Cloudflare R2)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={heroConfig.backgroundImage || ""}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, backgroundImage: e.target.value }))
                  }
                  className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none font-mono"
                  placeholder="https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev/hero/..."
                />
                <label className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 cursor-pointer">
                  <Upload className={`h-4 w-4 ${isUploadingBg ? "animate-bounce" : ""}`} />
                  <span>{isUploadingBg ? "Subiendo..." : "Subir R2"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBgUpload}
                    disabled={isUploadingBg}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SQL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-[#0e0e14] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display text-lg font-bold uppercase italic text-white">
                SQL: Sección Hero (Portada)
              </h3>
              <button
                onClick={() => setShowSqlModal(false)}
                className="rounded-xl p-1.5 text-white/50 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <pre className="max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-orange-200/90 leading-relaxed selection:bg-orange-500 selection:text-white">
                {generateSqlScript()}
              </pre>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs text-white/40">
                {copiedSql ? "¡Copiado al portapapeles!" : "Copia y pega en Supabase SQL Editor"}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowSqlModal(false)}>
                  Cerrar
                </Button>
                <Button variant="primary" size="md" onClick={handleCopySql}>
                  <Copy className="mr-1.5 h-4 w-4" />
                  {copiedSql ? "¡Copiado!" : "Copiar SQL"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
