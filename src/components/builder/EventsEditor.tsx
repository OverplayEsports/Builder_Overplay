import { useState, useEffect, useRef } from "react";
import {
  Radio,
  CalendarDays,
  Clock,
  Swords,
  UserPlus,
  Trophy,
  Medal,
  FilePenLine,
  BadgeCheck,
  Flame,
  Zap,
  Shield,
  Target,
  Crown,
  Gamepad2,
  Award,
  Plus,
  Trash2,
  Edit3,
  MoveLeft,
  MoveRight,
  X,
  Check,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Layers,
  Tag,
  Eye,
  Sliders,
  BookOpen,
  FileText,
  AlertTriangle,
  Scale,
  Download,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { useBuilder } from "../../context/BuilderContext";
import type { EventRuleSection, ProcessPhase, TourneyInfoItem } from "../../types/builder";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export const AVAILABLE_ICONS: Record<string, any> = {
  Radio,
  CalendarDays,
  Clock,
  Swords,
  UserPlus,
  Trophy,
  Medal,
  FilePenLine,
  BadgeCheck,
  Flame,
  Zap,
  Shield,
  Target,
  Crown,
  Gamepad2,
  Award,
  BookOpen,
  FileText,
  Scale,
};

export const ICON_OPTIONS = [
  { name: "Radio", label: "En Vivo / Radio", icon: Radio },
  { name: "CalendarDays", label: "Calendario", icon: CalendarDays },
  { name: "Clock", label: "Horario / Reloj", icon: Clock },
  { name: "Swords", label: "Espadas / Versus", icon: Swords },
  { name: "UserPlus", label: "Registro / Jugadores", icon: UserPlus },
  { name: "Trophy", label: "Trofeo / Premios", icon: Trophy },
  { name: "Medal", label: "Medalla / Ranking", icon: Medal },
  { name: "FilePenLine", label: "Reglas / Formulario", icon: FilePenLine },
  { name: "BadgeCheck", label: "Verificación", icon: BadgeCheck },
  { name: "Flame", label: "Fuego / Destacado", icon: Flame },
  { name: "Zap", label: "Rayo / Energía", icon: Zap },
  { name: "Shield", label: "Escudo / Defensa", icon: Shield },
  { name: "Target", label: "Objetivo / Puntería", icon: Target },
  { name: "Crown", label: "Corona / Campeón", icon: Crown },
  { name: "Gamepad2", label: "Control / Gaming", icon: Gamepad2 },
  { name: "Award", label: "Galardón / Mérito", icon: Award },
];

export function EventsEditor() {
  const {
    state,
    updateEvent,
    addEvent,
    setSelectedEventId,
    updateTourneyInfoItem,
    addTourneyInfoItem,
    removeTourneyInfoItem,
    moveTourneyInfoItem,
    updateProcessPhase,
    addProcessPhase,
    removeProcessPhase,
    moveProcessPhase,
    addEventChip,
    removeEventChip,
    updateEventRules,
    addRuleSection,
    updateRuleSection,
    removeRuleSection,
  } = useBuilder();

  const currentEvent =
    state.events.find((e) => e.id === state.selectedEventId) ||
    state.events[0];

  const [activeSectionTab, setActiveSectionTab] = useState<
    "general" | "infoCards" | "phases" | "rules"
  >("general");

  // Modals state
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventEdition, setNewEventEdition] = useState("5");

  // Info Card Modal state
  const [editingInfoCard, setEditingInfoCard] = useState<TourneyInfoItem | null>(null);
  const [isNewInfoCard, setIsNewInfoCard] = useState(false);

  // Phase Modal state
  const [editingPhase, setEditingPhase] = useState<ProcessPhase | null>(null);
  const [isNewPhase, setIsNewPhase] = useState(false);

  // Rule Section Modal state
  const [editingRuleSection, setEditingRuleSection] = useState<EventRuleSection | null>(null);
  const [isNewRuleSection, setIsNewRuleSection] = useState(false);
  const [rulePointsText, setRulePointsText] = useState("");

  // Full Rules Page Preview state in builder
  const [showFullRulesPreview, setShowFullRulesPreview] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Chip input
  const [newChipInput, setNewChipInput] = useState("");

  const bannerFileRef = useRef<HTMLInputElement>(null);
  const rulesImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingRulesImage, setIsUploadingRulesImage] = useState(false);
  const [rulesImageUploadSuccess, setRulesImageUploadSuccess] = useState(false);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [saveRulesSuccess, setSaveRulesSuccess] = useState(false);

  // Cargar configuración de reglas desde Supabase al iniciar
  useEffect(() => {
    supabase
      .from("team_groups")
      .select("*")
      .eq("id", "config_tournament_rules")
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data && data.description && currentEvent) {
          try {
            const parsed = JSON.parse(data.description);
            if (parsed && typeof parsed === "object") {
              updateEventRules(currentEvent.id, parsed);
            }
          } catch (e) {
            console.warn("Error parsing rules from supabase:", e);
          }
        }
      });
  }, [currentEvent?.id]);

  // Convierte un DataURL base64 a File para subir a R2 si quedó en memoria
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Subida de imagen oficial del reglamento al R2 Bucket
  const uploadRulesImageToR2 = async (file: File): Promise<string> => {
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
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const fileKey = `rules/${Date.now()}-${cleanBaseName}.${ext}`;

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
      ContentType: file.type || "image/png",
      ContentLength: fileBytes.byteLength,
    });

    await s3Client.send(uploadCmd);
    return `${publicUrl.replace(/\/+$/, "")}/${fileKey}`;
  };

  const syncRulesToSupabase = async (updatedRules: any) => {
    try {
      let payload = { ...updatedRules };
      // Si la URL es un base64, no saturar Supabase; subirla antes a R2
      if (payload.downloadImageUrl && payload.downloadImageUrl.startsWith("data:")) {
        const file = dataURLtoFile(payload.downloadImageUrl, "reglamento-oficial.png");
        const r2Url = await uploadRulesImageToR2(file);
        payload.downloadImageUrl = r2Url;
        updateEventRules(currentEvent.id, { downloadImageUrl: r2Url });
      }

      const { error } = await supabase.from("team_groups").upsert({
        id: "config_tournament_rules",
        title: "Reglamento Oficial",
        description: JSON.stringify(payload),
        accent: "ember",
        order_index: 999,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error("Error al sincronizar reglas con Supabase:", error);
        throw error;
      }
    } catch (e) {
      console.warn("Error al sincronizar reglas con Supabase:", e);
      throw e;
    }
  };

  const handleSaveAllRulesToSupabase = async () => {
    if (!currentEvent?.rules) return;
    setIsSavingRules(true);
    try {
      await syncRulesToSupabase(currentEvent.rules);
      setSaveRulesSuccess(true);
      setTimeout(() => setSaveRulesSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error al guardar reglas:", err);
      alert(`Error al guardar en Supabase: ${err?.message || "Verifica tu conexión."}`);
    } finally {
      setIsSavingRules(false);
    }
  };

  const handleRulesImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingRulesImage(true);
    try {
      const url = await uploadRulesImageToR2(file);
      const newRules = { ...(currentEvent.rules || {}), downloadImageUrl: url };
      updateEventRules(currentEvent.id, { downloadImageUrl: url });
      await syncRulesToSupabase(newRules);
      setRulesImageUploadSuccess(true);
      setTimeout(() => setRulesImageUploadSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error al subir imagen del reglamento a R2:", err);
      alert(`Error al subir la imagen a Cloudflare R2: ${err?.message || "Verifica tu conexión."}`);
    } finally {
      setIsUploadingRulesImage(false);
      if (e.target) e.target.value = "";
    }
  };

  if (!currentEvent) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center">
        <p className="text-white/60">No hay eventos disponibles.</p>
        <Button
          className="mt-4"
          onClick={() => addEvent({ title: "Overplay Tourney 4" })}
        >
          Crear Evento Inicial
        </Button>
      </div>
    );
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateEvent(currentEvent.id, { bannerImage: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInfoCard = () => {
    if (!editingInfoCard) return;
    if (isNewInfoCard) {
      addTourneyInfoItem(currentEvent.id, editingInfoCard);
    } else {
      updateTourneyInfoItem(currentEvent.id, editingInfoCard.id, editingInfoCard);
    }
    setEditingInfoCard(null);
    setIsNewInfoCard(false);
  };

  const handleSavePhase = () => {
    if (!editingPhase) return;
    if (isNewPhase) {
      addProcessPhase(currentEvent.id, editingPhase);
    } else {
      updateProcessPhase(currentEvent.id, editingPhase.id, editingPhase);
    }
    setEditingPhase(null);
    setIsNewPhase(false);
  };

  const handleOpenRuleSectionEdit = (section: EventRuleSection, isNew = false) => {
    setEditingRuleSection({ ...section });
    setIsNewRuleSection(isNew);
    setRulePointsText(section.points.join("\n"));
  };

  const handleSaveRuleSection = () => {
    if (!editingRuleSection) return;
    const parsedPoints = rulePointsText
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const updated = {
      ...editingRuleSection,
      points: parsedPoints.length > 0 ? parsedPoints : ["Punto de la normativa."],
    };

    if (isNewRuleSection) {
      addRuleSection(currentEvent.id, updated);
    } else {
      updateRuleSection(currentEvent.id, updated.id, updated);
    }

    setEditingRuleSection(null);
    setIsNewRuleSection(false);
    setRulePointsText("");
  };

  const handleCreateNewEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    addEvent({
      title: newEventTitle.trim(),
      edition: newEventEdition.trim() || "1",
      titleMain: "Tourney",
      titlePrefix: "Overplay",
      statusBadge: "Inscripciones abiertas",
    });
    setNewEventTitle("");
    setNewEventEdition("");
    setShowNewEventModal(false);
  };

  const handleAddChipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChipInput.trim()) {
      addEventChip(currentEvent.id, newChipInput.trim());
      setNewChipInput("");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header with Title and Global Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
              Constructor de Eventos & Torneos
            </p>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
            Editor de <span className="text-brand-gradient">Eventos</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Gestiona la información principal del torneo, banner, casillas de ficha técnica, fases competitivas y el reglamento oficial.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewEventModal(true)}
          >
            <Plus className="h-4 w-4" />
            Nuevo Evento / Torneo
          </Button>
        </div>
      </div>

      {/* Events Selector Tabs */}
      {state.events.length > 1 && (
        <div className="mt-6 flex items-center gap-2 overflow-x-auto border-b border-white/[0.08] pb-3">
          {state.events.map((evt) => {
            const isSelected = (currentEvent?.id || "") === evt.id;
            return (
              <button
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl border px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap",
                  isSelected
                    ? "border-orange-500/50 bg-orange-500/10 text-white shadow-[0_4px_20px_-6px_rgba(249,115,22,0.4)]"
                    : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <Trophy className="h-3.5 w-3.5 text-orange-400/80" />
                <span>{evt.title}</span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                  Edición {evt.edition}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Section Subtabs: General, Technical Sheet Cards, Process Phases, Rules */}
      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveSectionTab("general")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
            activeSectionTab === "general"
              ? "bg-orange-500 text-white shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
              : "bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
          )}
        >
          <Sliders className="h-4 w-4" />
          <span>1. Portada & Info General</span>
        </button>

        <button
          onClick={() => setActiveSectionTab("infoCards")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
            activeSectionTab === "infoCards"
              ? "bg-orange-500 text-white shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
              : "bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
          )}
        >
          <Layers className="h-4 w-4" />
          <span>2. Ficha Técnica ({currentEvent.infoItems.length} Casillas)</span>
        </button>

        <button
          onClick={() => setActiveSectionTab("phases")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
            activeSectionTab === "phases"
              ? "bg-orange-500 text-white shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
              : "bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
          )}
        >
          <Sparkles className="h-4 w-4" />
          <span>3. Fases del Proceso ({currentEvent.processPhases.length} Fases)</span>
        </button>

        <button
          onClick={() => setActiveSectionTab("rules")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
            activeSectionTab === "rules"
              ? "bg-orange-500 text-white shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
              : "bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
          )}
        >
          <Scale className="h-4 w-4" />
          <span>4. Reglas del Torneo ({currentEvent.rules?.sections?.length || 0} Artículos)</span>
        </button>
      </div>

      {/* SUBTAB 1: PORTADA & INFO GENERAL */}
      {activeSectionTab === "general" && (
        <div className="mt-8 space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Card: Text Info */}
            <div className="card-surface space-y-5 rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Sliders className="h-4 w-4 text-orange-400" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  Títulos, Estado y Textos
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                  Estado / Insignia Superior (Badge)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentEvent.statusBadge}
                    onChange={(e) =>
                      updateEvent(currentEvent.id, { statusBadge: e.target.value })
                    }
                    placeholder="Ej. Inscripciones abiertas, Próximamente, En vivo..."
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Prefijo Título
                  </label>
                  <input
                    type="text"
                    value={currentEvent.titlePrefix}
                    onChange={(e) =>
                      updateEvent(currentEvent.id, { titlePrefix: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Nombre Principal
                  </label>
                  <input
                    type="text"
                    value={currentEvent.titleMain}
                    onChange={(e) =>
                      updateEvent(currentEvent.id, { titleMain: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Edición / Número
                  </label>
                  <input
                    type="text"
                    value={currentEvent.edition}
                    onChange={(e) =>
                      updateEvent(currentEvent.id, { edition: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none font-bold text-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                  Descripción Oficial del Evento
                </label>
                <textarea
                  rows={4}
                  value={currentEvent.description}
                  onChange={(e) =>
                    updateEvent(currentEvent.id, { description: e.target.value })
                  }
                  className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm leading-relaxed text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Botones de acción del evento */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-white/10">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Botón Principal (Registro)
                  </label>
                  <input
                    type="text"
                    value={currentEvent.registerButton.text}
                    onChange={(e) =>
                      updateEvent(currentEvent.id, {
                        registerButton: {
                          ...currentEvent.registerButton,
                          text: e.target.value,
                        },
                      })
                    }
                    placeholder="Texto botón (Ej. Inscribirse)"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={currentEvent.registerButton.url}
                    onChange={(e) =>
                      updateEvent(currentEvent.id, {
                        registerButton: {
                          ...currentEvent.registerButton,
                          url: e.target.value,
                        },
                      })
                    }
                    placeholder="URL o enlace destino"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/70 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Botón Secundario (Reglas)
                  </label>
                  <input
                    type="text"
                    value={currentEvent.rulesButton.text}
                    onChange={(e) =>
                      updateEvent(currentEvent.id, {
                        rulesButton: {
                          ...currentEvent.rulesButton,
                          text: e.target.value,
                        },
                      })
                    }
                    placeholder="Texto botón (Ej. Ver reglas)"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={currentEvent.rulesButton.url}
                    onChange={(e) =>
                      updateEvent(currentEvent.id, {
                        rulesButton: {
                          ...currentEvent.rulesButton,
                          url: e.target.value,
                        },
                      })
                    }
                    placeholder="URL o enlace destino"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/70 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Card: Banner Image & Floating Chips */}
            <div className="card-surface space-y-5 rounded-2xl border border-white/10 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <ImageIcon className="h-4 w-4 text-orange-400" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                    Banner Visual & Etiquetas (Chips)
                  </h3>
                </div>

                {/* Banner Preview */}
                <div className="mt-4 relative h-48 w-full overflow-hidden rounded-2xl border border-white/15 bg-black/60">
                  <img
                    src={currentEvent.bannerImage}
                    alt="Banner del evento"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                    {currentEvent.chips.map((chip, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-black/60 backdrop-blur-md px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white/90 border border-white/10"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Banner URL / Upload */}
                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    URL de la Imagen del Banner
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentEvent.bannerImage}
                      onChange={(e) =>
                        updateEvent(currentEvent.id, {
                          bannerImage: e.target.value,
                        })
                      }
                      placeholder="/images/tourney-banner.jpg o URL web"
                      className="flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => bannerFileRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Subir
                    </button>
                    <input
                      type="file"
                      ref={bannerFileRef}
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Floating Chips Editor */}
                <div className="mt-5 space-y-3 pt-4 border-t border-white/10">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Etiquetas Flotantes (Chips)
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {currentEvent.chips.map((chip, idx) => (
                      <span
                        key={idx}
                        className="group flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-white/90"
                      >
                        <Tag className="h-3 w-3 text-orange-400" />
                        <span>{chip}</span>
                        <button
                          type="button"
                          onClick={() => removeEventChip(currentEvent.id, idx)}
                          className="ml-1 text-white/30 hover:text-rose-400 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleAddChipSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={newChipInput}
                      onChange={(e) => setNewChipInput(e.target.value)}
                      placeholder="Nueva etiqueta (Ej: 5v5, Marzo 2026, LAN...)"
                      className="flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    />
                    <Button type="submit" size="sm" variant="outline">
                      <Plus className="h-3.5 w-3.5" />
                      Agregar
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: FICHA TÉCNICA (CASILLAS DE INFORMACIÓN) */}
      {activeSectionTab === "infoCards" && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between card-surface p-5 rounded-2xl border border-white/10">
            <div>
              <h2 className="font-display text-lg font-bold uppercase italic text-white">
                Ficha Técnica del Torneo
              </h2>
              <p className="text-xs text-white/50">
                Casillas con datos clave: Estado, Fechas, Horarios, Formatos, Reglas y Premios.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setEditingInfoCard({
                  id: `info-${Date.now()}`,
                  icon: "Trophy",
                  label: "Nuevo Dato",
                  value: "Valor",
                });
                setIsNewInfoCard(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Agregar Casilla
            </Button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {currentEvent.infoItems.map((item, index) => {
              const IconComponent = AVAILABLE_ICONS[item.icon] || Trophy;

              return (
                <div
                  key={item.id}
                  className="card-surface group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-5 transition-all duration-300 hover:border-orange-400/40 hover:shadow-[0_12px_40px_-16px_rgba(249,115,22,0.3)]"
                >
                  {/* Quick Controls */}
                  <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-20 bg-[#07070a]/90 rounded-lg p-1 border border-white/10">
                    <button
                      onClick={() =>
                        moveTourneyInfoItem(currentEvent.id, item.id, "left")
                      }
                      disabled={index === 0}
                      title="Mover a la izquierda"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() =>
                        moveTourneyInfoItem(currentEvent.id, item.id, "right")
                      }
                      disabled={index === currentEvent.infoItems.length - 1}
                      title="Mover a la derecha"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingInfoCard({ ...item });
                        setIsNewInfoCard(false);
                      }}
                      title="Editar casilla"
                      className="p-1 text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar casilla "${item.label}"?`)) {
                          removeTourneyInfoItem(currentEvent.id, item.id);
                        }
                      }}
                      title="Eliminar casilla"
                      className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-400/20 text-orange-400">
                        <IconComponent className="h-4 w-4" />
                      </span>
                      <dt className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50 truncate">
                        {item.label}
                      </dt>
                    </div>

                    <dd className="mt-3.5 text-sm font-bold text-white/95 leading-snug">
                      {item.value}
                    </dd>
                  </div>

                  <button
                    onClick={() => {
                      setEditingInfoCard({ ...item });
                      setIsNewInfoCard(false);
                    }}
                    className="w-full mt-4 rounded-lg border border-white/10 bg-white/[0.02] py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                  >
                    Editar Casilla
                  </button>
                </div>
              );
            })}

            {/* Add Card Quick Button */}
            <button
              onClick={() => {
                setEditingInfoCard({
                  id: `info-${Date.now()}`,
                  icon: "Trophy",
                  label: "Nuevo Dato",
                  value: "Valor",
                });
                setIsNewInfoCard(true);
              }}
              className="group flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.01] p-5 text-center transition-all duration-300 hover:border-orange-400/40 hover:bg-orange-500/[0.04] cursor-pointer"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/40 transition-transform duration-300 group-hover:scale-110 group-hover:border-orange-400/40 group-hover:text-orange-300">
                <Plus className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-wider text-white/60 group-hover:text-white">
                  Agregar Casilla
                </p>
                <p className="mt-0.5 text-[10px] text-white/30">
                  Añadir dato técnico
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 3: FASES DEL PROCESO */}
      {activeSectionTab === "phases" && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between card-surface p-5 rounded-2xl border border-white/10">
            <div>
              <h2 className="font-display text-lg font-bold uppercase italic text-white">
                Así funciona el torneo (Fases del Proceso)
              </h2>
              <p className="text-xs text-white/50">
                Pasos secuenciales del torneo: Inscripción, Confirmación, Competencia, Resultados...
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                const nextStep = (currentEvent.processPhases.length + 1)
                  .toString()
                  .padStart(2, "0");
                setEditingPhase({
                  id: `phase-${Date.now()}`,
                  step: nextStep,
                  icon: "Swords",
                  title: "Nueva Fase",
                  text: "Descripción del paso o fase del torneo.",
                });
                setIsNewPhase(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Agregar Fase
            </Button>
          </div>

          {/* Phases Grid */}
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {currentEvent.processPhases.map((phase, index) => {
              const IconComponent = AVAILABLE_ICONS[phase.icon] || Swords;

              return (
                <div
                  key={phase.id}
                  className="card-surface group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 border border-white/10 hover:border-orange-400/30 hover:shadow-[0_20px_50px_-20px_rgba(249,115,22,0.35)]"
                >
                  {/* Watermark Step Number */}
                  <span
                    aria-hidden
                    className="absolute -right-3 -top-6 select-none font-display text-7xl font-bold italic text-white/[0.04] transition-colors duration-500 group-hover:text-orange-500/10"
                  >
                    {phase.step}
                  </span>

                  {/* Top Action Tools */}
                  <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-20 bg-[#07070a]/90 rounded-lg p-1 border border-white/10">
                    <button
                      onClick={() =>
                        moveProcessPhase(currentEvent.id, phase.id, "left")
                      }
                      disabled={index === 0}
                      title="Mover a la izquierda"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() =>
                        moveProcessPhase(currentEvent.id, phase.id, "right")
                      }
                      disabled={index === currentEvent.processPhases.length - 1}
                      title="Mover a la derecha"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingPhase({ ...phase });
                        setIsNewPhase(false);
                      }}
                      title="Editar fase"
                      className="p-1 text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la fase "${phase.title}"?`)) {
                          removeProcessPhase(currentEvent.id, phase.id);
                        }
                      }}
                      title="Eliminar fase"
                      className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div>
                    <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-500/10 text-orange-300">
                      <IconComponent className="h-5 w-5" />
                    </span>

                    <p className="mt-5 font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-300/80">
                      Fase {phase.step}
                    </p>

                    <h4 className="mt-1 font-display text-xl font-bold uppercase italic text-white">
                      {phase.title}
                    </h4>

                    <p className="mt-2.5 text-sm leading-relaxed text-white/55">
                      {phase.text}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingPhase({ ...phase });
                      setIsNewPhase(false);
                    }}
                    className="w-full mt-5 rounded-lg border border-white/10 bg-white/[0.02] py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                  >
                    Editar Fase
                  </button>
                </div>
              );
            })}

            {/* Add Phase Quick Button */}
            <button
              onClick={() => {
                const nextStep = (currentEvent.processPhases.length + 1)
                  .toString()
                  .padStart(2, "0");
                setEditingPhase({
                  id: `phase-${Date.now()}`,
                  step: nextStep,
                  icon: "Swords",
                  title: "Nueva Fase",
                  text: "Descripción del paso o fase del torneo.",
                });
                setIsNewPhase(true);
              }}
              className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.01] p-6 text-center transition-all duration-300 hover:border-orange-400/40 hover:bg-orange-500/[0.04] cursor-pointer"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/40 transition-transform duration-300 group-hover:scale-110 group-hover:border-orange-400/40 group-hover:text-orange-300">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-wider text-white/60 group-hover:text-white">
                  Agregar Fase
                </p>
                <p className="mt-1 text-[11px] text-white/30">
                  Añadir nuevo paso al torneo
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 4: REGLAS DEL TORNEO (EDITOR Y VISTA COMPLETA DEL REGLAMENTO) */}
      {activeSectionTab === "rules" && (
        <div className="mt-8 space-y-8">
          {showFullRulesPreview ? (
            /* VISTA COMPLETA DE PÁGINA DEL REGLAMENTO (NO EMERGENTE CON EL DISEÑO OFICIAL DEL VISOR) */
            <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
              {/* Barra superior de control */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                <button
                  onClick={() => setShowFullRulesPreview(false)}
                  className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 transition-all hover:border-orange-400/40 hover:bg-orange-500/10 hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Volver al Editor de Reglas
                </button>

                <div className="flex items-center gap-3">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                    Vista Completa de la Web · Temporada 2026
                  </span>
                </div>
              </div>

              {/* Tarjeta Principal — Diseño idéntico al visor pero en vista de página completa */}
              <div className="card-surface relative flex w-full flex-col overflow-hidden rounded-3xl border border-white/20 bg-[#08080c] shadow-[0_30px_100px_rgba(0,0,0,0.9)]">
                {/* Top Header */}
                <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-6 sm:px-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
                      <Scale className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                        <span className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-orange-300">
                          Overplay League
                        </span>
                      </div>
                      <h2 className="font-display text-xl font-bold uppercase italic text-white sm:text-2xl lg:text-3xl mt-0.5">
                        {currentEvent.rules?.modalTitle || "Reglamento Oficial de Competición"}
                      </h2>
                      <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                        {currentEvent.rules?.modalSubtitle || "Normativa oficial de Overplay"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contenido / Body de la Normativa */}
                <div className="px-6 py-6 sm:px-8 space-y-6">
                  {/* Fair Play Summary Alert */}
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.05] p-5 text-xs sm:text-sm leading-relaxed text-orange-200/90">
                    <p className="font-semibold text-orange-300 mb-1.5 flex items-center gap-2 uppercase font-display text-xs tracking-wider">
                      <BadgeCheck className="h-4 w-4" /> Declaración de Fair Play
                    </p>
                    {currentEvent.rules?.summary}
                  </div>

                  {/* Rules Sections */}
                  <div className="space-y-4">
                    {currentEvent.rules?.sections?.map((sec) => (
                      <article
                        key={sec.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 transition-colors hover:border-white/20"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="rounded-md border border-orange-400/30 bg-orange-500/10 px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-orange-300">
                            {sec.category}
                          </span>
                        </div>

                        <h3 className="font-display text-base sm:text-lg font-bold uppercase italic text-white">
                          {sec.title}
                        </h3>

                        {sec.description && (
                          <p className="mt-1 text-xs sm:text-sm text-white/50">{sec.description}</p>
                        )}

                        <ul className="mt-4 space-y-2.5 border-t border-white/[0.06] pt-3.5">
                          {sec.points.map((pt, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-white/75"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/10 px-6 py-5 sm:px-8 bg-black/40">
                  <span className="text-xs text-white/40">
                    Normativa oficial Overplay 2026
                  </span>
                  <span className="font-display text-[10px] font-bold uppercase tracking-wider text-orange-400/80">
                    Documento Oficial
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* EDITOR DE REGLAMENTO */
            <>
              {/* General Rules Settings */}
              <div className="card-surface space-y-5 rounded-2xl border border-white/10 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-orange-400" />
                    <div>
                      <h3 className="font-display text-base font-bold uppercase italic text-white">
                        Configuración del Apartado de Reglas en la Web
                      </h3>
                      <p className="text-xs text-white/50">
                        Controla los textos que aparecen en la sección de la web y en la página oficial del reglamento.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveAllRulesToSupabase}
                      disabled={isSavingRules}
                      className={cn(
                        "transition-all",
                        saveRulesSuccess && "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white"
                      )}
                    >
                      {isSavingRules ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : saveRulesSuccess ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          <span>¡Reglas Guardadas!</span>
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
                      variant="outline"
                      onClick={() => setShowFullRulesPreview(true)}
                    >
                      <Eye className="h-4 w-4 text-orange-400" />
                      Vista Completa de Reglas
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Descripción General del Funcionamiento de las Reglas (Texto en la Web)
                    </label>
                    <textarea
                      rows={3}
                      value={currentEvent.rules?.summary || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateEventRules(currentEvent.id, { summary: val });
                        syncRulesToSupabase({ ...(currentEvent.rules || {}), summary: val });
                      }}
                      placeholder="Normativa oficial aplicable a todos los participantes..."
                      className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm leading-relaxed text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                        Texto del Botón en la Web
                      </label>
                      <input
                        type="text"
                        value={currentEvent.rules?.rulesButtonText || "Reglas del Torneo"}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateEventRules(currentEvent.id, { rulesButtonText: val });
                          syncRulesToSupabase({ ...(currentEvent.rules || {}), rulesButtonText: val });
                        }}
                        placeholder="Reglas del Torneo"
                        className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                        Título en la Página de Reglas
                      </label>
                      <input
                        type="text"
                        value={currentEvent.rules?.modalTitle || "Reglamento Oficial"}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateEventRules(currentEvent.id, { modalTitle: val });
                          syncRulesToSupabase({ ...(currentEvent.rules || {}), modalTitle: val });
                        }}
                        placeholder="Reglamento Oficial"
                        className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                        Subtítulo en la Página de Reglas
                      </label>
                      <input
                        type="text"
                        value={currentEvent.rules?.modalSubtitle || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateEventRules(currentEvent.id, { modalSubtitle: val });
                          syncRulesToSupabase({ ...(currentEvent.rules || {}), modalSubtitle: val });
                        }}
                        placeholder="Normativas y código de conducta"
                        className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rule Articles / Sections List (CRUD) */}
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between card-surface p-5 rounded-2xl border border-white/10">
                  <div>
                    <h2 className="font-display text-lg font-bold uppercase italic text-white">
                      Artículos & Cláusulas del Reglamento ({currentEvent.rules?.sections?.length || 0})
                    </h2>
                    <p className="text-xs text-white/50">
                      Agrega o edita los artículos que componen la página completa del reglamento.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() =>
                      handleOpenRuleSectionEdit(
                        {
                          id: `rule-${Date.now()}`,
                          category: "Normativa",
                          title: `${(currentEvent.rules?.sections?.length || 0) + 1}. Nuevo Artículo`,
                          description: "Descripción breve del artículo.",
                          points: [
                            "Cláusula 1 de la normativa.",
                            "Cláusula 2 de la normativa.",
                          ],
                        },
                        true
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Artículo
                  </Button>
                </div>

                {/* Sections Grid */}
                <div className="grid gap-5 md:grid-cols-2">
                  {currentEvent.rules?.sections?.map((section) => (
                    <div
                      key={section.id}
                      className="card-surface group relative flex flex-col justify-between rounded-2xl border border-white/10 p-6 transition-all duration-300 hover:border-orange-400/30 hover:shadow-[0_16px_40px_-16px_rgba(249,115,22,0.25)]"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-orange-300">
                            {section.category}
                          </span>

                          <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <button
                              onClick={() => handleOpenRuleSectionEdit(section, false)}
                              title="Editar artículo"
                              className="p-1.5 text-orange-400 hover:text-orange-300 cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`¿Eliminar artículo "${section.title}"?`)) {
                                  removeRuleSection(currentEvent.id, section.id);
                                  const updatedSections = (currentEvent.rules?.sections || []).filter(
                                    (s) => s.id !== section.id
                                  );
                                  await syncRulesToSupabase({
                                    ...(currentEvent.rules || {}),
                                    sections: updatedSections,
                                  });
                                }
                              }}
                              title="Eliminar artículo"
                              className="p-1.5 text-rose-400 hover:text-rose-300 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-display text-base font-bold uppercase italic text-white">
                          {section.title}
                        </h4>

                        {section.description && (
                          <p className="text-xs text-white/50 leading-relaxed">
                            {section.description}
                          </p>
                        )}

                        <ul className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                          {section.points.map((point, pIdx) => (
                            <li
                              key={pIdx}
                              className="flex items-start gap-2 text-xs leading-relaxed text-white/75"
                            >
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleOpenRuleSectionEdit(section, false)}
                        className="mt-5 w-full rounded-lg border border-white/10 bg-white/[0.02] py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                      >
                        Editar Artículo
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Imagen Oficial para Descargar en la Web (Cloudflare R2 Bucket) */}
              <div className="card-surface space-y-5 rounded-2xl border border-white/10 p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
                      <Download className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold uppercase italic text-white">
                        Imagen Oficial del Reglamento para Descarga (Web)
                      </h3>
                      <p className="text-xs text-white/50">
                        Sube aquí la imagen o documento que se descargará automáticamente cuando los usuarios pulsen &quot;DESCARGAR&quot; en la web.
                      </p>
                    </div>
                  </div>

                  {currentEvent.rules?.downloadImageUrl && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Imagen Activa
                    </span>
                  )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2 items-start">
                  {/* Columna Izquierda: Botón de Subida y URL */}
                  <div className="space-y-4">
                    <div>
                      <input
                        ref={rulesImageInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleRulesImageUpload}
                      />

                      <div
                        onClick={() => rulesImageInputRef.current?.click()}
                        className={cn(
                          "group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.01] p-6 text-center transition-all duration-300 hover:border-orange-400/50 hover:bg-orange-500/[0.04] cursor-pointer",
                          isUploadingRulesImage && "pointer-events-none opacity-60"
                        )}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-400/30 text-orange-400 transition-transform duration-300 group-hover:scale-110">
                          {isUploadingRulesImage ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            <Upload className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <p className="font-display text-xs font-bold uppercase tracking-wider text-white group-hover:text-orange-300 transition-colors">
                            {isUploadingRulesImage
                              ? "Subiendo a Cloudflare R2..."
                              : rulesImageUploadSuccess
                              ? "¡Imagen subida con éxito!"
                              : "Haz clic para subir la imagen del reglamento"}
                          </p>
                          <p className="mt-1 text-[11px] text-white/40">
                            Formatos soportados: PNG, JPG, WebP o PDF · Almacenado en R2
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                        O escribe / edita la URL de la imagen directamente:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentEvent.rules?.downloadImageUrl || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateEventRules(currentEvent.id, {
                              downloadImageUrl: val,
                            });
                            syncRulesToSupabase({
                              ...(currentEvent.rules || {}),
                              downloadImageUrl: val,
                            });
                          }}
                          placeholder="https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev/rules/..."
                          className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                        />
                        {currentEvent.rules?.downloadImageUrl && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(currentEvent.rules?.downloadImageUrl || "");
                              alert("¡Enlace copiado al portapapeles!");
                            }}
                            title="Copiar URL"
                            className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer shrink-0"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Vista Previa de la Imagen */}
                  <div>
                    {currentEvent.rules?.downloadImageUrl ? (
                      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/60 p-3 space-y-3">
                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
                          <img
                            src={currentEvent.rules.downloadImageUrl}
                            alt="Vista previa de imagen de descarga"
                            className="h-full w-full object-contain"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1.5">
                            <a
                              href={currentEvent.rules.downloadImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-black/80 p-1.5 text-white/80 hover:text-white backdrop-blur-md transition-colors"
                              title="Ver tamaño completo"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => {
                                updateEventRules(currentEvent.id, { downloadImageUrl: "" });
                                syncRulesToSupabase({
                                  ...(currentEvent.rules || {}),
                                  downloadImageUrl: "",
                                });
                              }}
                              className="rounded-lg bg-rose-600/80 p-1.5 text-white hover:bg-rose-600 backdrop-blur-md transition-colors cursor-pointer"
                              title="Eliminar imagen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] text-white/50 truncate max-w-[240px]">
                            {currentEvent.rules.downloadImageUrl}
                          </span>
                          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-orange-400">
                            Listo para la web
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center">
                        <ImageIcon className="h-10 w-10 text-white/20 mb-2" />
                        <p className="text-xs text-white/40">
                          No se ha seleccionado ninguna imagen de descarga.
                        </p>
                        <p className="text-[10px] text-white/25 mt-1">
                          Sube una imagen para que los usuarios la descarguen desde la web.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL 1: EDIT / CREATE INFO CARD */}
      {editingInfoCard && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    {isNewInfoCard ? "Nueva Casilla Técnica" : "Editar Casilla Técnica"}
                  </h3>
                  <p className="text-xs text-white/50">
                    Personaliza el icono, etiqueta y valor de esta casilla.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingInfoCard(null)}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Etiqueta / Título de la Casilla
                </label>
                <input
                  type="text"
                  value={editingInfoCard.label}
                  onChange={(e) =>
                    setEditingInfoCard({
                      ...editingInfoCard,
                      label: e.target.value,
                    })
                  }
                  placeholder="Ej. Estado, Fecha, Horario, Formato..."
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Valor del Dato
                </label>
                <input
                  type="text"
                  value={editingInfoCard.value}
                  onChange={(e) =>
                    setEditingInfoCard({
                      ...editingInfoCard,
                      value: e.target.value,
                    })
                  }
                  placeholder="Ej. 21 – 22 Mar 2026, 5v5 Doble eliminación..."
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  Selecciona el Icono
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {ICON_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = editingInfoCard.icon === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() =>
                          setEditingInfoCard({
                            ...editingInfoCard,
                            icon: opt.name,
                          })
                        }
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-all cursor-pointer",
                          isSelected
                            ? "border-orange-500 bg-orange-500/10 text-white"
                            : "border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white"
                        )}
                      >
                        <IconComp className="h-4 w-4 text-orange-400" />
                        <span className="text-[10px] font-bold truncate max-w-full">
                          {opt.label.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex shrink-0 items-center justify-end gap-3 border-t border-white/10 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingInfoCard(null)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveInfoCard}>
                <Check className="h-4 w-4" />
                Guardar Casilla
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT / CREATE PHASE */}
      {editingPhase && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    {isNewPhase ? "Nueva Fase del Torneo" : "Editar Fase del Torneo"}
                  </h3>
                  <p className="text-xs text-white/50">
                    Define el número de paso, título y descripción del proceso.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPhase(null)}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-[100px_1fr] gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Paso #
                  </label>
                  <input
                    type="text"
                    value={editingPhase.step}
                    onChange={(e) =>
                      setEditingPhase({
                        ...editingPhase,
                        step: e.target.value,
                      })
                    }
                    placeholder="01"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm text-center font-bold text-orange-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Título de la Fase
                  </label>
                  <input
                    type="text"
                    value={editingPhase.title}
                    onChange={(e) =>
                      setEditingPhase({
                        ...editingPhase,
                        title: e.target.value,
                      })
                    }
                    placeholder="Ej. Inscripción, Confirmación, Competencia..."
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Descripción Detallada
                </label>
                <textarea
                  rows={3}
                  value={editingPhase.text}
                  onChange={(e) =>
                    setEditingPhase({
                      ...editingPhase,
                      text: e.target.value,
                    })
                  }
                  placeholder="Explica qué sucede en esta etapa..."
                  className="w-full resize-none rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  Icono de la Fase
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                  {ICON_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = editingPhase.icon === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() =>
                          setEditingPhase({
                            ...editingPhase,
                            icon: opt.name,
                          })
                        }
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-all cursor-pointer",
                          isSelected
                            ? "border-orange-500 bg-orange-500/10 text-white"
                            : "border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white"
                        )}
                      >
                        <IconComp className="h-4 w-4 text-orange-400" />
                        <span className="text-[10px] font-bold truncate max-w-full">
                          {opt.label.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex shrink-0 items-center justify-end gap-3 border-t border-white/10 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPhase(null)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSavePhase}>
                <Check className="h-4 w-4" />
                Guardar Fase
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW EVENT MODAL */}
      {showNewEventModal && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    Nuevo Torneo / Evento
                  </h3>
                  <p className="text-xs text-white/50">
                    Crea una nueva edición o competición para Overplay.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewEventModal(false)}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewEventSubmit} className="mt-6 flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Nombre Completo del Evento <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Ej: Overplay Tourney 5 (Comunidad)"
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-semibold text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Número de Edición
                </label>
                <input
                  type="text"
                  value={newEventEdition}
                  onChange={(e) => setNewEventEdition(e.target.value)}
                  placeholder="5"
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-bold text-orange-400 placeholder:text-white/20 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="mt-8 flex shrink-0 items-center justify-end gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewEventModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newEventTitle.trim()}
                >
                  <Plus className="h-4 w-4" />
                  Crear Evento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT / CREATE RULE SECTION */}
      {editingRuleSection && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    {isNewRuleSection ? "Nuevo Artículo de Reglas" : "Editar Artículo de Reglas"}
                  </h3>
                  <p className="text-xs text-white/50">
                    Define la categoría, título y las cláusulas o puntos de la normativa.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRuleSection(null)}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Categoría / Etiqueta
                  </label>
                  <input
                    type="text"
                    value={editingRuleSection.category}
                    onChange={(e) =>
                      setEditingRuleSection({
                        ...editingRuleSection,
                        category: e.target.value,
                      })
                    }
                    placeholder="Ej. Elegibilidad, Formato, Anticheat..."
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none font-semibold text-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Título del Artículo
                  </label>
                  <input
                    type="text"
                    value={editingRuleSection.title}
                    onChange={(e) =>
                      setEditingRuleSection({
                        ...editingRuleSection,
                        title: e.target.value,
                      })
                    }
                    placeholder="Ej. 1. Requisitos de los Jugadores"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Descripción Breve (Opcional)
                </label>
                <input
                  type="text"
                  value={editingRuleSection.description}
                  onChange={(e) =>
                    setEditingRuleSection({
                      ...editingRuleSection,
                      description: e.target.value,
                    })
                  }
                  placeholder="Ej. Condiciones mínimas de registro y validación."
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                    Puntos / Cláusulas de la Normativa
                  </label>
                  <span className="text-[10px] text-white/40">
                    (Cada salto de línea será una viñeta separada)
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={rulePointsText}
                  onChange={(e) => setRulePointsText(e.target.value)}
                  placeholder="Escribe cada punto en una línea diferente..."
                  className="w-full resize-none rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-xs leading-relaxed text-white focus:border-orange-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="mt-8 flex shrink-0 items-center justify-end gap-3 border-t border-white/10 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingRuleSection(null)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveRuleSection}>
                <Check className="h-4 w-4" />
                Guardar Artículo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
