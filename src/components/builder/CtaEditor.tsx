import { useState } from "react";
import {
  Radio,
  Sparkles,
  Save,
  CheckCircle2,
  Upload,
  Code2,
  Copy,
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
import { DEFAULT_CTA_CONFIG } from "../../data/initialData";
import type { CtaConfig } from "../../types/builder";

export function CtaEditor() {
  const { state } = useBuilder();
  const [ctaConfig, setCtaConfig] = useState<CtaConfig>(
    state.ctaConfig || DEFAULT_CTA_CONFIG
  );

  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Subida directa de Banner a Cloudflare R2
  const uploadBannerToR2 = async (file: File): Promise<string> => {
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
    const fileKey = `cta/${Date.now()}-${cleanBaseName}.${ext}`;

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

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    setSyncError(null);

    try {
      const publicUrl = await uploadBannerToR2(file);
      setCtaConfig((prev) => ({ ...prev, bannerImage: publicUrl }));
    } catch (err: any) {
      console.error("Error al subir banner CTA a R2:", err);
      setSyncError(`Error al subir imagen a R2: ${err.message || "Verifica credenciales"}`);
    } finally {
      setIsUploadingBanner(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveToSupabase = async () => {
    setIsSavingSupabase(true);
    setSyncError(null);

    try {
      const payload = {
        cta: ctaConfig,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase.from("team_groups").upsert({
        id: "config_cta",
        title: "Configuración de Recuadro Participar (CTA)",
        description: JSON.stringify(payload),
        accent: "ember",
        order_index: 993,
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
      cta: ctaConfig,
    }).replace(/'/g, "''");

    return `-- =========================================================
-- SQL PARA SUPABASE: SECCIÓN RECUADRO PARTICIPAR (CTA)
-- =========================================================

INSERT INTO public.team_groups (id, title, description, accent, order_index, updated_at)
VALUES (
  'config_cta',
  'Configuración de Recuadro Participar (CTA)',
  '${payload}',
  'ember',
  993,
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
              Llamada a la Acción · Conversión Final
            </p>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
            Editor de <span className="text-brand-gradient">Recuadro para Participar</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Personaliza la tarjeta inferior de registro e invitaciones a torneos y comunidad.
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
          <span>La sección de Participar se ha guardado en Supabase con éxito.</span>
        </div>
      )}

      {syncError && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {syncError}
        </div>
      )}

      {/* Grid: Preview & Configuration Form */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Preview */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-400" />
              Vista Previa en Tiempo Real
            </h2>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-12 text-center shadow-2xl bg-[#070709]">
            {/* Background image preview */}
            <div className="absolute inset-0 opacity-30">
              <img
                src={ctaConfig.bannerImage || "/images/tourney-banner.jpg"}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[#070709]/80" />
            </div>

            {/* Glowing orbs */}
            <div className="pointer-events-none absolute -left-20 top-[-4rem] h-48 w-48 rounded-full bg-orange-600/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-[-4rem] h-48 w-48 rounded-full bg-violet-600/25 blur-3xl" />

            <div className="relative z-10">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.4em] text-orange-300/90">
                {ctaConfig.eyebrow}
              </p>
              <h2 className="mx-auto mt-4 max-w-xl font-display text-3xl font-bold uppercase italic leading-[0.95] tracking-tight text-white sm:text-4xl">
                {ctaConfig.titleMain}
                <span className="text-brand-gradient">{ctaConfig.titleHighlight}</span>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-white/55">
                {ctaConfig.description}
              </p>
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 font-display text-xs font-bold uppercase tracking-wider text-black shadow-lg">
                  <Swords className="h-4 w-4" />
                  <span>{ctaConfig.buttonText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="card-surface rounded-3xl border border-white/10 p-6 space-y-5">
            <h2 className="font-display text-base font-bold uppercase italic text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Sliders className="h-4 w-4 text-orange-400" />
              Configuración de Textos y Enlaces
            </h2>

            {/* Eyebrow */}
            <div>
              <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                Lema Superior (Eyebrow)
              </label>
              <input
                type="text"
                value={ctaConfig.eyebrow}
                onChange={(e) =>
                  setCtaConfig((prev) => ({ ...prev, eyebrow: e.target.value }))
                }
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                placeholder="Overplay Tourney 4 te espera"
              />
            </div>

            {/* Titular */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Texto Principal
                </label>
                <input
                  type="text"
                  value={ctaConfig.titleMain}
                  onChange={(e) =>
                    setCtaConfig((prev) => ({ ...prev, titleMain: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  placeholder="¿Listo para "
                />
              </div>

              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Palabra con Degradado
                </label>
                <input
                  type="text"
                  value={ctaConfig.titleHighlight}
                  onChange={(e) =>
                    setCtaConfig((prev) => ({ ...prev, titleHighlight: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  placeholder="competir?"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                Descripción
              </label>
              <textarea
                rows={3}
                value={ctaConfig.description}
                onChange={(e) =>
                  setCtaConfig((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                placeholder="Inscribe a tu equipo, enfréntate a los mejores..."
              />
            </div>

            {/* Botón de Inscripción */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Texto del Botón
                </label>
                <input
                  type="text"
                  value={ctaConfig.buttonText}
                  onChange={(e) =>
                    setCtaConfig((prev) => ({ ...prev, buttonText: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Inscribirse al Torneo"
                />
              </div>

              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Enlace del Botón
                </label>
                <input
                  type="text"
                  value={ctaConfig.buttonUrl}
                  onChange={(e) =>
                    setCtaConfig((prev) => ({ ...prev, buttonUrl: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
                  placeholder="#eventos"
                />
              </div>
            </div>

            {/* Imagen de Fondo R2 */}
            <div className="border-t border-white/10 pt-4">
              <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                Banner de Fondo (Cloudflare R2)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ctaConfig.bannerImage || ""}
                  onChange={(e) =>
                    setCtaConfig((prev) => ({ ...prev, bannerImage: e.target.value }))
                  }
                  className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
                  placeholder="https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev/cta/..."
                />
                <label className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 cursor-pointer">
                  <Upload className={`h-4 w-4 ${isUploadingBanner ? "animate-bounce" : ""}`} />
                  <span>{isUploadingBanner ? "Subiendo..." : "Subir R2"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    disabled={isUploadingBanner}
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
                SQL: Sección Recuadro para Participar
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
