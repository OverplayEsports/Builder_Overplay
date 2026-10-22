import { useState, useEffect, useRef } from "react";
import {
  Video,
  Play,
  Pause,
  Upload,
  Plus,
  Trash2,
  Check,
  Copy,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { supabase } from "../../lib/supabase";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { HomeClipItem, HomeClipsConfig } from "../../types/builder";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export function HomeClipsEditor() {
  const { state } = useBuilder();

  // Estados principales de configuración de clips
  const [title, setTitle] = useState("Highlight Reel");
  const [activeClipUrl, setActiveClipUrl] = useState("");
  const [clips, setClips] = useState<HomeClipItem[]>([]);

  // Estados para nuevo clip manual
  const [newClipTitle, setNewClipTitle] = useState("");
  const [newClipUrl, setNewClipUrl] = useState("");

  // Estados de carga / sincronización
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estado del reproductor visualizador en la vista previa
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePreviewPlay = () => {
    if (!videoPreviewRef.current) return;
    if (isPreviewPlaying) {
      videoPreviewRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      videoPreviewRef.current.play();
      setIsPreviewPlaying(true);
    }
  };

  // Cargar datos desde Supabase al montar
  useEffect(() => {
    let alive = true;

    async function loadData() {
      setIsLoading(true);
      try {
        // 1. Intentar cargar de config_home_clips
        const { data: clipsRow } = await supabase
          .from("team_groups")
          .select("description")
          .eq("id", "config_home_clips")
          .maybeSingle();

        if (!alive) return;

        let loaded = false;
        if (clipsRow?.description) {
          try {
            const parsed = JSON.parse(clipsRow.description);
            if (parsed) {
              if (parsed.title) setTitle(parsed.title);
              if (parsed.activeClipUrl) setActiveClipUrl(parsed.activeClipUrl);
              if (Array.isArray(parsed.clips)) setClips(parsed.clips);
              loaded = true;
            }
          } catch (e) {
            console.warn("Error parsing config_home_clips:", e);
          }
        }

        // 2. Si no existía, intentar fallback desde config_hero
        if (!loaded) {
          const { data: heroRow } = await supabase
            .from("team_groups")
            .select("description")
            .eq("id", "config_hero")
            .maybeSingle();

          if (heroRow?.description) {
            try {
              const heroParsed = JSON.parse(heroRow.description);
              if (heroParsed?.hero) {
                if (heroParsed.hero.clipTitle) setTitle(heroParsed.hero.clipTitle);
                if (heroParsed.hero.clipVideoUrl) {
                  setActiveClipUrl(heroParsed.hero.clipVideoUrl);
                  setClips([
                    {
                      id: "clip-initial",
                      title: heroParsed.hero.clipTitle || "Clip Principal",
                      url: heroParsed.hero.clipVideoUrl,
                      createdAt: new Date().toISOString(),
                    },
                  ]);
                }
              }
            } catch (e) {
              console.warn("Error fallback from config_hero:", e);
            }
          }
        }
      } catch (err: any) {
        console.error("Error al cargar configuración de clips:", err);
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  // Subir video MP4 a Cloudflare R2 en la carpeta clips/
  const uploadVideoToR2 = async (file: File): Promise<string> => {
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
    const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
    const fileKey = `clips/${Date.now()}-${cleanBaseName}.${ext}`;

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
      ContentType: file.type || "video/mp4",
      ContentLength: fileBytes.byteLength,
    });

    await s3Client.send(uploadCmd);
    return `${publicUrl.replace(/\/+$/, "")}/${fileKey}`;
  };

  // Manejar selección y subida de archivo MP4
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación básica de formato
    if (!file.type.includes("video") && !file.name.toLowerCase().endsWith(".mp4")) {
      setSyncError("Por favor selecciona un archivo de video en formato MP4 válido.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Subiendo "${file.name}" a Cloudflare R2...`);
    setSyncError(null);

    try {
      const uploadedUrl = await uploadVideoToR2(file);

      const newClip: HomeClipItem = {
        id: `clip-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        url: uploadedUrl,
        createdAt: new Date().toISOString(),
      };

      setClips((prev) => [newClip, ...prev]);
      setActiveClipUrl(uploadedUrl);
      setSyncSuccess(`¡Video MP4 subido con éxito a la carpeta clips/ de R2!`);
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (err: any) {
      console.error("Error al subir video a R2:", err);
      setSyncError(`Error al subir video a Cloudflare R2: ${err.message || "Verifica credenciales"}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (e.target) e.target.value = "";
    }
  };

  // Agregar clip manual por URL
  const handleAddManualClip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClipUrl.trim()) return;

    const newClip: HomeClipItem = {
      id: `clip-${Date.now()}`,
      title: newClipTitle.trim() || `Clip #${clips.length + 1}`,
      url: newClipUrl.trim(),
      createdAt: new Date().toISOString(),
    };

    setClips((prev) => [newClip, ...prev]);
    if (!activeClipUrl) {
      setActiveClipUrl(newClip.url);
    }
    setNewClipTitle("");
    setNewClipUrl("");
    setSyncSuccess("¡Clip agregado a la lista!");
    setTimeout(() => setSyncSuccess(null), 3000);
  };

  // Eliminar clip
  const handleDeleteClip = (id: string) => {
    const toDelete = clips.find((c) => c.id === id);
    if (!confirm(`¿Eliminar el clip "${toDelete?.title || "seleccionado"}"?`)) return;

    const remaining = clips.filter((c) => c.id !== id);
    setClips(remaining);

    // Si el eliminado era el activo, asignar el primero restante
    if (toDelete && toDelete.url === activeClipUrl) {
      setActiveClipUrl(remaining[0]?.url || "");
    }
  };

  // Copiar URL al portapapeles
  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Guardar en Supabase (guarda en config_home_clips y sincroniza en config_hero)
  const handleSaveToSupabase = async () => {
    setIsSaving(true);
    setSyncError(null);
    setSyncSuccess(null);

    try {
      const payload: HomeClipsConfig = {
        title: title.trim() || "Highlight Reel",
        activeClipUrl,
        clips,
      };

      // 1. Guardar en config_home_clips
      const { error: clipsErr } = await supabase.from("team_groups").upsert({
        id: "config_home_clips",
        title: "Configuración de Clips del Home",
        description: JSON.stringify(payload),
        updated_at: new Date().toISOString(),
      });

      if (clipsErr) throw clipsErr;

      // 2. Sincronizar también con config_hero para retrocompatibilidad
      const { data: heroRow } = await supabase
        .from("team_groups")
        .select("description")
        .eq("id", "config_hero")
        .maybeSingle();

      let currentHeroObj: any = {};
      if (heroRow?.description) {
        try {
          currentHeroObj = JSON.parse(heroRow.description)?.hero || {};
        } catch {
          // ignore
        }
      }

      currentHeroObj.clipTitle = title.trim();
      currentHeroObj.clipVideoUrl = activeClipUrl;

      await supabase.from("team_groups").upsert({
        id: "config_hero",
        title: "Configuración de Hero (Portada)",
        description: JSON.stringify({
          hero: currentHeroObj,
          updatedAt: new Date().toISOString(),
        }),
        updated_at: new Date().toISOString(),
      });

      setSyncSuccess("¡Configuración de clips y título guardados con éxito en Supabase!");
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (err: any) {
      console.error("Error al guardar en Supabase:", err);
      setSyncError(`Error al guardar: ${err.message || "Consulta fallida"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Notificaciones de éxito o error */}
      {syncSuccess && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 font-display text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{syncSuccess}</span>
        </div>
      )}

      {syncError && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 font-display text-xs font-semibold text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Cabecera principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Video className="h-5 w-5" />
            </span>
            <h1 className="font-display text-2xl font-bold uppercase italic tracking-wide text-white">
              Clips del Home
            </h1>
          </div>
          <p className="mt-1 text-xs text-white/50 max-w-2xl">
            Gestiona la pantalla visualizador del Home: sube videos MP4 a Cloudflare R2 en la carpeta clips/, elige el video activo y define el título que se despliega en el borde inferior.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveToSupabase}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid en 2 columnas: Configuración y Gestión a la izquierda, Vista Previa en Vivo a la derecha */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Columna Izquierda: Casillas de configuración y subida */}
        <div className="space-y-6 lg:col-span-7">
          {/* 1. Casilla para el TÍTULO que va abajo del player */}
          <div className="rounded-3xl border border-white/10 bg-[#0c0c10] p-6 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Título Inferior del Player
              </h2>
            </div>
            <p className="text-xs text-white/50 mb-3">
              Texto que se despliega en la casilla ubicada directamente bajo el borde inferior del visualizador.
            </p>
            <div className="space-y-1.5">
              <label className="font-display text-[11px] font-bold uppercase tracking-wider text-white/70">
                Título del Clip / Visualizador
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Highlight Reel, Final del Torneo, etc."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 font-display text-sm text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* 2. Casilla para SUBIR video MP4 directo a Cloudflare R2 */}
          <div className="rounded-3xl border border-white/10 bg-[#0c0c10] p-6 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <Upload className="h-4 w-4 text-orange-400" />
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Subir Video MP4 a Cloudflare R2
              </h2>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Sube tus clips de jugadas directamente al bucket de R2 en la carpeta <code className="text-orange-300 font-mono">clips/</code>. Se asignará automáticamente como video activo.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 text-center transition-all cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/[0.04]",
                isUploading && "pointer-events-none opacity-60"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-orange-400 transition-transform group-hover:scale-110 group-hover:border-orange-500/40">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  {isUploading ? "Subiendo archivo..." : "Haz clic para seleccionar un video MP4"}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {uploadProgress || "Formatos admitidos: .mp4 (guardado en carpeta clips/ de Cloudflare R2)"}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Casilla para agregar clip por URL manual */}
          <div className="rounded-3xl border border-white/10 bg-[#0c0c10] p-6 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <LinkIcon className="h-4 w-4 text-orange-400" />
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Agregar Clip por Enlace / URL Directa
              </h2>
            </div>

            <form onSubmit={handleAddManualClip} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-display text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Nombre o Etiqueta
                  </label>
                  <input
                    type="text"
                    value={newClipTitle}
                    onChange={(e) => setNewClipTitle(e.target.value)}
                    placeholder="Ej. Clutch Tracer Ronda 5"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-display text-[11px] font-bold uppercase tracking-wider text-white/70">
                    URL del archivo MP4
                  </label>
                  <input
                    type="url"
                    value={newClipUrl}
                    onChange={(e) => setNewClipUrl(e.target.value)}
                    placeholder="https://pub-....r2.dev/clips/video.mp4"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newClipUrl.trim()}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white hover:border-orange-500/50 hover:bg-orange-500/10 cursor-pointer disabled:opacity-40 transition-all"
                >
                  <Plus className="h-3.5 w-3.5 text-orange-400" />
                  <span>Agregar a la lista</span>
                </button>
              </div>
            </form>
          </div>

          {/* 4. Lista de Clips / Videos cargados */}
          <div className="rounded-3xl border border-white/10 bg-[#0c0c10] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-orange-400" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  Clips Registrados ({clips.length})
                </h2>
              </div>
              <span className="text-xs text-white/40">
                Selecciona cuál se reproducirá en el Home
              </span>
            </div>

            {clips.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/40">
                No hay clips registrados aún. Sube un MP4 arriba o agrega una URL.
              </div>
            ) : (
              <div className="space-y-3">
                {clips.map((clip) => {
                  const isActive = clip.url === activeClipUrl;

                  return (
                    <div
                      key={clip.id}
                      className={cn(
                        "flex flex-col gap-3 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between",
                        isActive
                          ? "border-orange-500/60 bg-orange-500/[0.06] shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-sm font-bold uppercase italic tracking-wide text-white truncate">
                            {clip.title}
                          </h4>
                          {isActive && (
                            <span className="rounded-full bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-300">
                              Activo en Home
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate font-mono text-[11px] text-white/40 max-w-md">
                          {clip.url}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => setActiveClipUrl(clip.url)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-white/80 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-white cursor-pointer transition-all"
                            title="Reproducir este clip en el Home"
                          >
                            <Play className="h-3 w-3 text-orange-400" />
                            <span>Activar</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-orange-400">
                            <Check className="h-3.5 w-3.5" />
                            <span>En reproducción</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopyUrl(clip.id, clip.url)}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-white/50 hover:border-white/20 hover:text-white transition-colors cursor-pointer"
                          title="Copiar enlace de R2"
                        >
                          {copiedId === clip.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteClip(clip.id)}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar clip"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Vista Previa en Vivo (exacta a como se verá en el Home) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="sticky top-24 rounded-3xl border border-white/10 bg-[#0c0c10] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-orange-400" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  Vista Previa en Vivo (Home)
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 font-display">
                Sin marcos
              </span>
            </div>

            {/* Visualizador idéntico al Home: sin marcos, solo pantalla visualizador */}
            <div className="relative">
              {/* Glow ambiental */}
              <div
                aria-hidden
                className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-orange-500/20 via-rose-500/15 to-purple-600/20 blur-2xl opacity-75 pointer-events-none"
              />

              {/* Pantalla visualizador con click para pausar/continuar */}
              <div
                onClick={togglePreviewPlay}
                className="group relative aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-black shadow-2xl ring-1 ring-white/10 cursor-pointer select-none"
              >
                {activeClipUrl ? (
                  <video
                    ref={videoPreviewRef}
                    key={activeClipUrl}
                    src={activeClipUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c0c10] via-[#120a1a] to-[#1a0c08] p-6 text-center">
                    <div className="absolute inset-0 bg-grid opacity-30" />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.35)]">
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </div>
                      <p className="font-display text-xs font-bold uppercase tracking-wider text-white">
                        Sin video asignado
                      </p>
                      <p className="mt-1 max-w-[200px] text-[11px] leading-relaxed text-white/40">
                        Sube un archivo MP4 o activa uno de la lista izquierda
                      </p>
                    </div>
                  </div>
                )}

                {/* Overlay interactivo para pausar / continuar */}
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 pointer-events-none",
                    isPreviewPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100 bg-black/55"
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white backdrop-blur-md shadow-2xl transition-transform duration-200 group-hover:scale-110">
                    {isPreviewPlaying ? (
                      <Pause className="h-5 w-5 fill-current text-orange-400" />
                    ) : (
                      <Play className="h-5 w-5 fill-current text-orange-400 ml-0.5" />
                    )}
                  </div>
                  <span className="absolute bottom-3 right-3 rounded-lg border border-white/10 bg-black/70 px-2.5 py-1 font-display text-[9px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-md">
                    {isPreviewPlaying ? "Clic para pausar" : "Clic para continuar"}
                  </span>
                </div>
              </div>

              {/* Casilla de título desplegada desde el borde inferior */}
              {title && (
                <div className="mt-3.5 flex justify-center">
                  <div className="inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0c0c10]/90 px-5 py-2 shadow-xl backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                    </span>
                    <h4 className="font-display text-xs sm:text-sm font-bold uppercase italic tracking-wider text-white">
                      {title}
                    </h4>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-white/50 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-display font-semibold uppercase tracking-wider text-white/70">
                <span>Estado en vivo:</span>
                <span className={activeClipUrl ? "text-emerald-400" : "text-amber-400"}>
                  {activeClipUrl ? "Video MP4 Conectado" : "Esperando video"}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                El reproductor se reproduce en bucle continuo, en silencio total (sin audio) y permite pausar y reanudar con un solo clic o al pasar por encima.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
