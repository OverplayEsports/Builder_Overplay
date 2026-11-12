import { useState, useRef, useEffect } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  Plus,
  Trash2,
  Edit3,
  MoveLeft,
  MoveRight,
  Palette,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  X,
  Sparkles,
  Layers,
  Settings2,
  ExternalLink,
  Upload,
  ArrowLeft,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trophy,
  Crown,
  Calendar,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { GRADIENT_PRESETS, DEFAULT_PAST_CHAMPIONS_CONFIG } from "../../data/initialData";
import { supabase } from "../../lib/supabase";
import type {
  GroupAccent,
  SocialPlatform,
  TeamGroup,
  TeamMember,
  PastChampion,
  ChampionMember,
} from "../../types/builder";
import { MonogramAvatar } from "../ui/MonogramAvatar";
import { SocialButton, SOCIAL_META } from "../ui/SocialIcons";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

const ACCENT_OPTIONS: { id: GroupAccent; label: string; bg: string }[] = [
  { id: "ember", label: "Ember (Naranja)", bg: "from-orange-500 to-rose-600" },
  { id: "violet", label: "Violeta (Morado)", bg: "from-violet-500 to-fuchsia-600" },
  { id: "crimson", label: "Crimson (Rojo)", bg: "from-rose-500 to-red-600" },
  { id: "emerald", label: "Emerald (Verde)", bg: "from-emerald-500 to-teal-600" },
];

const SOCIAL_LIST: SocialPlatform[] = [
  "x",
  "twitch",
  "instagram",
  "youtube",
  "discord",
];

export function AboutEditor() {
  const {
    state,
    setActiveTab,
    addMember,
    updateMember,
    removeMember,
    moveMember,
    addGroup,
    updateGroup,
    removeGroup,
    setTeamGroups,
    toggleMemberSocial,
    updateMemberSocialUrl,
    updatePastChampionsConfig,
    addPastChampion,
    updatePastChampion,
    removePastChampion,
    movePastChampion,
    setPastChampionsList,
  } = useBuilder();

  const [selectedGroup, setSelectedGroup] = useState<string>(
    state.teamGroups[0]?.id || ""
  );
  const [editingMember, setEditingMember] = useState<{
    groupId: string;
    member: TeamMember;
  } | null>(null);

  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupAccent, setNewGroupAccent] = useState<GroupAccent>("ember");

  const [editingGroupMeta, setEditingGroupMeta] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const championLogoInputRef = useRef<HTMLInputElement>(null);

  // Estado para modal de Campeón
  const [editingChampion, setEditingChampion] = useState<PastChampion | null>(null);
  const [isUploadingChampLogo, setIsUploadingChampLogo] = useState(false);

  // Cargar automáticamente datos de equipo desde Supabase al montar
  useEffect(() => {
    handleLoadFromSupabase();
  }, []);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const currentGroup =
    state.teamGroups.find((g) => g.id === selectedGroup) ||
    state.teamGroups[0];

  const handleOpenEdit = (groupId: string, member: TeamMember) => {
    setEditingMember({ groupId, member: { ...member } });
  };

  const handleSaveMember = () => {
    if (!editingMember) return;
    updateMember(
      editingMember.groupId,
      editingMember.member.id,
      editingMember.member
    );
    setEditingMember(null);
  };

  const handleCreateNewGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;
    const newId = `group-${Date.now()}`;
    addGroup({
      id: newId,
      title: newGroupTitle.trim(),
      description: newGroupDescription.trim() || "Descripción del nuevo apartado.",
      accent: newGroupAccent,
      members: [],
    });
    setSelectedGroup(newId);
    setNewGroupTitle("");
    setNewGroupDescription("");
    setNewGroupAccent("ember");
    setShowNewGroupModal(false);
  };

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
    const fileKey = `members/${Date.now()}-${cleanBaseName}.${ext}`;

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
    if (!file || !editingMember) return;
    setIsUploadingAvatar(true);
    setSyncError(null);

    try {
      const cdnUrl = await uploadAvatarToR2(file);
      setEditingMember({
        ...editingMember,
        member: {
          ...editingMember.member,
          avatarType: "image",
          avatarImage: cdnUrl,
        },
      });
      setSyncSuccess("¡Foto de avatar subida a Cloudflare R2 con éxito!");
      setTimeout(() => setSyncSuccess(null), 3500);
    } catch (err: any) {
      console.error("Error al subir avatar:", err);
      setSyncError(err.message || "Error al subir avatar a Cloudflare R2");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Subida directa de Logo del Campeón al Cloudflare R2 Bucket
  const uploadChampLogoToR2 = async (file: File): Promise<string> => {
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
    const fileKey = `champions/${Date.now()}-${cleanBaseName}.${ext}`;

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

  const handleChampLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingChampion) return;
    setIsUploadingChampLogo(true);
    setSyncError(null);

    try {
      const cdnUrl = await uploadChampLogoToR2(file);
      setEditingChampion({
        ...editingChampion,
        teamLogo: cdnUrl,
      });
      setSyncSuccess("¡Logo del equipo subido a Cloudflare R2 con éxito!");
      setTimeout(() => setSyncSuccess(null), 3500);
    } catch (err: any) {
      console.error("Error al subir logo:", err);
      setSyncError(err.message || "Error al subir logo a Cloudflare R2");
    } finally {
      setIsUploadingChampLogo(false);
      if (championLogoInputRef.current) championLogoInputRef.current.value = "";
    }
  };

  // Guardar en Supabase
  const handleSaveToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSyncSuccess(null);
    setSyncError(null);

    try {
      // 1. Guardar o actualizar grupos
      const groupsToUpsert = state.teamGroups.map((g, index) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        accent: g.accent,
        order_index: index,
        updated_at: new Date().toISOString(),
      }));

      const { error: groupError } = await supabase
        .from("team_groups")
        .upsert(groupsToUpsert, { onConflict: "id" });

      if (groupError) throw groupError;

      // 2. Guardar o actualizar miembros
      const membersToUpsert = state.teamGroups.flatMap((g) =>
        g.members.map((m, mIndex) => {
          const socialsData = {
            ...(m.socials || {}),
            _description: m.description || "",
          };
          return {
            id: m.id,
            group_id: g.id,
            name: m.name,
            role: m.role,
            avatar_type: m.avatarType || "monogram",
            avatar_image: m.avatarImage || "",
            gradient: m.gradient || "from-orange-500 to-rose-600",
            socials: socialsData,
            order_index: mIndex,
            updated_at: new Date().toISOString(),
          };
        })
      );

      if (membersToUpsert.length > 0) {
        const { error: memberError } = await supabase
          .from("team_members")
          .upsert(membersToUpsert, { onConflict: "id" });

        if (memberError) throw memberError;
      }

      // 3. Guardar Antiguos Campeones en config_past_champions
      const championsConfigToSave = state.pastChampionsConfig || DEFAULT_PAST_CHAMPIONS_CONFIG;
      const { error: champError } = await supabase
        .from("team_groups")
        .upsert(
          {
            id: "config_past_champions",
            title: championsConfigToSave.title || "Antiguos Campeones",
            description: JSON.stringify(championsConfigToSave),
            accent: "ember",
            order_index: 996,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (champError) throw champError;

      setSyncSuccess("¡Equipo y Antiguos Campeones sincronizados y guardados con éxito en Supabase!");
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (err: any) {
      console.error("Error al guardar en Supabase:", err);
      setSyncError(err.message || "Error al conectar o guardar en Supabase");
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Cargar datos frescos de Supabase
  const handleLoadFromSupabase = async () => {
    setIsSyncingSupabase(true);
    setSyncSuccess(null);
    setSyncError(null);

    try {
      // Cargar Antiguos Campeones si existen
      const { data: champRow } = await supabase
        .from("team_groups")
        .select("description")
        .eq("id", "config_past_champions")
        .single();

      if (champRow?.description) {
        try {
          const parsedChamp =
            typeof champRow.description === "string"
              ? JSON.parse(champRow.description)
              : champRow.description;
          if (parsedChamp && Array.isArray(parsedChamp.champions)) {
            updatePastChampionsConfig(parsedChamp);
          }
        } catch (e) {
          console.warn("Error parseando campeones de Supabase:", e);
        }
      }

      const { data: dbGroups, error: gErr } = await supabase
        .from("team_groups")
        .select("*")
        .order("order_index", { ascending: true });

      if (gErr) throw gErr;
      if (!dbGroups || dbGroups.length === 0) {
        setSyncSuccess("No hay grupos en Supabase aún. Haz clic en Guardar.");
        return;
      }

      const { data: dbMembers, error: mErr } = await supabase
        .from("team_members")
        .select("*")
        .order("order_index", { ascending: true });

      if (mErr) throw mErr;

      const loadedGroups: TeamGroup[] = dbGroups
        .filter((group: any) => group && group.id && !String(group.id).startsWith("config_"))
        .map((group: any) => ({
          id: group.id,
          title: group.title,
          description: group.description || "",
          accent: group.accent || "ember",
          members: (dbMembers || [])
            .filter((m: any) => m.group_id === group.id && typeof m.name === "string" && m.name.trim().length > 0 && m.role !== "8==D")
            .map((m: any) => ({
              id: m.id,
              name: m.name,
              role: m.role,
              description: m.description || m.socials?._description || "",
              avatarType: m.avatar_type || "monogram",
              avatarImage: m.avatar_image || "",
              gradient: m.gradient || "from-orange-500 to-rose-600",
              socials: m.socials || {},
            })),
        }));

      setTeamGroups(loadedGroups);
      if (loadedGroups[0]) {
        setSelectedGroup(loadedGroups[0].id);
      }
      setSyncSuccess(`¡Se cargaron ${loadedGroups.length} apartados y ${dbMembers?.length || 0} integrantes desde Supabase!`);
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (err: any) {
      console.error("Error al cargar de Supabase:", err);
      setSyncError(err.message || "Error al consultar Supabase");
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Alert Notifications */}
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

      {/* Header with Title and Global Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
              Constructor de Equipo & Supabase
            </p>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
            Editor de <span className="text-brand-gradient">Sobre Nosotros</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Gestiona cada integrante, sube avatares a Cloudflare R2 y guarda los cambios en Supabase en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadFromSupabase}
            disabled={isSyncingSupabase}
            className="gap-2"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isSyncingSupabase && "animate-spin")} />
            <span>Cargar de Supabase</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveToSupabase}
            disabled={isSyncingSupabase}
            className="gap-2 shadow-[0_6px_20px_-4px_rgba(249,115,22,0.5)]"
          >
            {isSyncingSupabase ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Database className="h-3.5 w-3.5 text-orange-200" />
            )}
            <span>Guardar en Supabase</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewGroupModal(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Apartado</span>
          </Button>
        </div>
      </div>

      {/* Apartados Tabs Navigation */}
      <div className="mt-8 flex items-center gap-2 overflow-x-auto border-b border-white/[0.08] pb-3">
        {state.teamGroups.map((group) => {
          const isSelected = (currentGroup?.id || "") === group.id;
          return (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl border px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap",
                isSelected
                  ? "border-orange-500/50 bg-orange-500/10 text-white shadow-[0_4px_20px_-6px_rgba(249,115,22,0.4)]"
                  : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
              )}
            >
              <Layers className="h-3.5 w-3.5 text-orange-400/80" />
              <span>{group.title}</span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                {group.members.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Group Details & Card Grid */}
      {currentGroup && (
        <div className="mt-6 space-y-6">
          {/* Group Header Controls */}
          <div className="card-surface rounded-2xl p-5 border border-white/10">
            {editingGroupMeta === currentGroup.id ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                      Título del Apartado
                    </label>
                    <input
                      type="text"
                      value={currentGroup.title}
                      onChange={(e) =>
                        updateGroup(currentGroup.id, { title: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                      Acento de Color
                    </label>
                    <select
                      value={currentGroup.accent}
                      onChange={(e) =>
                        updateGroup(currentGroup.id, {
                          accent: e.target.value as GroupAccent,
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#101014] px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                    >
                      {ACCENT_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Descripción del Apartado
                  </label>
                  <input
                    type="text"
                    value={currentGroup.description}
                    onChange={(e) =>
                      updateGroup(currentGroup.id, {
                        description: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingGroupMeta(null)}
                  >
                    Listo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-xl font-bold uppercase italic text-white">
                      {currentGroup.title}
                    </h2>
                    <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-orange-300">
                      {currentGroup.accent}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/50">
                    {currentGroup.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingGroupMeta(currentGroup.id)}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 font-display text-xs font-bold uppercase tracking-wider text-white/70 hover:border-white/20 hover:text-white cursor-pointer"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Editar Apartado
                  </button>

                  <Button
                    size="sm"
                    onClick={() =>
                      addMember(currentGroup.id, {
                        name: "Nuevo Usuario",
                        role: "Staff",
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Integrante
                  </Button>

                  {state.teamGroups.length > 1 && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `¿Eliminar el apartado "${currentGroup.title}" y todos sus integrantes?`
                          )
                        ) {
                          removeGroup(currentGroup.id);
                        }
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      title="Eliminar apartado"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cards Grid — 3 columnas horizontales */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentGroup.members.map((member, index) => {
              // Filtrar solo las redes sociales activas con URL
              const activeSocials = SOCIAL_LIST.filter((platform) => {
                const setting = member.socials?.[platform];
                return setting?.enabled === true && typeof setting?.url === "string" && setting.url.trim().length > 0 && setting.url !== "#";
              });

              return (
                <div
                  key={member.id}
                  className="card-surface group relative flex h-full min-h-[110px] sm:min-h-[120px] flex-row items-stretch overflow-hidden rounded-2xl border border-white/10 p-3 sm:p-3.5 transition-all duration-300 hover:border-orange-400/40 hover:shadow-[0_12px_40px_-16px_rgba(249,115,22,0.3)]"
                >
                  {/* Top action quick tools */}
                  <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-20 bg-[#07070a]/95 rounded-lg p-1 border border-white/15 backdrop-blur-sm shadow-lg">
                    <button
                      onClick={() =>
                        moveMember(currentGroup.id, member.id, "left")
                      }
                      disabled={index === 0}
                      title="Mover a la izquierda"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() =>
                        moveMember(currentGroup.id, member.id, "right")
                      }
                      disabled={index === currentGroup.members.length - 1}
                      title="Mover a la derecha"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(currentGroup.id, member)}
                      title="Editar casilla"
                      className="p-1 text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar a ${member.name}?`)) {
                          removeMember(currentGroup.id, member.id);
                        }
                      }}
                      title="Eliminar integrante"
                      className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* 1. Lado Izquierdo: Imagen / Avatar usando el alto proporcional de la casilla */}
                  <div
                    onClick={() => handleOpenEdit(currentGroup.id, member)}
                    className="relative shrink-0 self-stretch aspect-square min-w-[72px] sm:min-w-[96px] max-w-[124px] overflow-hidden rounded-xl sm:rounded-2xl ring-1 ring-white/15 bg-white/[0.02] shadow-md group-hover:ring-orange-400/50 transition-all duration-300 cursor-pointer"
                  >
                    <MonogramAvatar
                      name={member.name}
                      gradient={member.gradient}
                      image={member.avatarImage}
                      avatarType={member.avatarType}
                      size="fill"
                      className="!h-full !w-full !rounded-xl sm:!rounded-2xl transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* 2. Centro: Nombre al costado derecho de la imagen arriba, rol y descripción */}
                  <div
                    onClick={() => handleOpenEdit(currentGroup.id, member)}
                    className="flex-1 min-w-0 px-3 sm:px-3.5 flex flex-col justify-center text-left cursor-pointer"
                  >
                    <h4 className="font-display text-base font-bold uppercase italic tracking-wide text-white truncate">
                      {member.name || "Sin nombre"}
                    </h4>
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-400/90 truncate">
                      {member.role || "Staff"}
                    </p>
                    {member.description ? (
                      <p className="mt-1 text-xs leading-relaxed text-white/55 line-clamp-2">
                        {member.description}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] italic text-white/25">
                        Sin descripción
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(currentGroup.id, member);
                      }}
                      className="mt-2 inline-flex w-fit items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Edit3 className="h-2.5 w-2.5 text-orange-400" />
                      Editar Casilla
                    </button>
                  </div>

                  {/* 3. Lado Derecho: Redes sociales en columna vertical compacta (solo las activas) */}
                  <div className="shrink-0 flex flex-col items-center justify-center gap-1 pl-2 sm:pl-2.5 border-l border-white/[0.08] my-auto">
                    {activeSocials.length > 0 ? (
                      activeSocials.map((platform) => {
                        const setting = member.socials?.[platform];
                        const url = setting?.url || "#";
                        return (
                          <SocialButton
                            key={platform}
                            platform={platform}
                            href={url}
                            label={`${member.name} en ${SOCIAL_META[platform].name}`}
                            className="h-5.5 w-5.5 sm:h-6 sm:w-6 shrink-0 rounded-full border border-white/10 bg-white/[0.03] text-white/50 hover:border-orange-400/60 hover:bg-orange-500/15 hover:text-white transition-all"
                            iconClassName="h-2.5 w-2.5 sm:h-3 sm:w-3"
                          />
                        );
                      })
                    ) : (
                      <span
                        title="Sin redes activadas - Clic en Editar Casilla"
                        onClick={() => handleOpenEdit(currentGroup.id, member)}
                        className="cursor-pointer text-[10px] text-white/20 hover:text-orange-400 py-1"
                      >
                        <LinkIcon className="h-3 w-3 opacity-30" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Add Member Card */}
            <button
              onClick={() =>
                addMember(currentGroup.id, {
                  name: "Nuevo Integrante",
                  role: "Staff",
                })
              }
              className="group flex min-h-[100px] flex-row items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.01] p-4 text-left transition-all duration-300 hover:border-orange-400/40 hover:bg-orange-500/[0.04] cursor-pointer"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/40 transition-transform duration-300 group-hover:scale-110 group-hover:border-orange-400/40 group-hover:text-orange-300">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-wider text-white/60 group-hover:text-white">
                  Agregar Integrante
                </p>
                <p className="mt-0.5 text-[11px] text-white/30">
                  Nuevo miembro a {currentGroup.title}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN DEDICADA: GESTOR DE ANTIGUOS CAMPEONES */}
      <div className="mt-14 pt-10 border-t border-white/10">
        <div className="card-surface rounded-2xl p-6 border border-amber-500/20 bg-amber-500/[0.02]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
                <Trophy className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    {state.pastChampionsConfig?.title || "Antiguos Campeones"}
                  </h3>
                  <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                    {(state.pastChampionsConfig?.champions || []).length} Torneos
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Gestiona las casillas de los equipos ganadores, fechas y jugadores con sus roles.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                const newC: PastChampion = {
                  id: `champ-${Date.now()}`,
                  tournamentName: "Nuevo Torneo",
                  date: "Mes 2026",
                  teamName: "Equipo Campeón",
                  teamLogo: "",
                  gradient: "from-amber-500 to-orange-600",
                  members: [
                    { name: "Jugador 1", role: "Tank" },
                    { name: "Jugador 2", role: "DPS" },
                    { name: "Jugador 3", role: "DPS" },
                    { name: "Jugador 4", role: "Support" },
                    { name: "Jugador 5", role: "Support" },
                  ],
                };
                addPastChampion(newC);
                setEditingChampion(newC);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              <Plus className="h-4 w-4" />
              Agregar Torneo Campeón
            </Button>
          </div>

          {/* Grid de Casillas de Campeones */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(state.pastChampionsConfig?.champions || []).map((champ, index) => {
              const membersCount = champ.members?.length || 0;
              const hasLogo = typeof champ.teamLogo === "string" && champ.teamLogo.trim().length > 0;

              return (
                <div
                  key={champ.id}
                  className="card-surface group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 p-3 sm:p-3.5 transition-all duration-300 hover:border-amber-400/40 hover:shadow-[0_12px_40px_-16px_rgba(251,191,36,0.3)]"
                >
                  {/* Controles de orden y acciones */}
                  <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-20 bg-[#07070a]/95 rounded-lg p-1 border border-white/15 backdrop-blur-sm shadow-lg">
                    <button
                      onClick={() => movePastChampion(champ.id, "left")}
                      disabled={index === 0}
                      title="Mover a la izquierda"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => movePastChampion(champ.id, "right")}
                      disabled={index === (state.pastChampionsConfig?.champions || []).length - 1}
                      title="Mover a la derecha"
                      className="p-1 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <MoveRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setEditingChampion({ ...champ })}
                      title="Editar casilla de campeón"
                      className="p-1 text-amber-400 hover:text-amber-300 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la casilla de "${champ.tournamentName}"?`)) {
                          removePastChampion(champ.id);
                        }
                      }}
                      title="Eliminar casilla"
                      className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* 1. Bloque Horizontal Principal (Estilo idéntico a Web) */}
                  <div
                    onClick={() => setEditingChampion({ ...champ })}
                    className="relative min-h-[105px] overflow-hidden cursor-pointer"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-24 sm:w-28 overflow-hidden pointer-events-none rounded-xl"
                      style={{
                        maskImage: "linear-gradient(to right, black 50%, transparent 95%)",
                        WebkitMaskImage: "linear-gradient(to right, black 50%, transparent 95%)",
                      }}
                    >
                      {hasLogo ? (
                        <img
                          src={champ.teamLogo}
                          alt={champ.teamName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            "h-full w-full flex items-center justify-center font-display text-amber-300 bg-gradient-to-br",
                            champ.gradient || "from-amber-500 to-orange-600"
                          )}
                        >
                          <Trophy className="h-8 w-8 text-white/90" />
                        </div>
                      )}
                      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#0b0b0e] pointer-events-none" />
                    </div>

                    <div className="relative z-10 flex h-full flex-col justify-between pl-20 sm:pl-24 pr-2 py-2">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-display text-sm sm:text-base font-bold uppercase italic tracking-wide text-white truncate">
                            {champ.tournamentName}
                          </h4>
                          <span className="inline-flex items-center gap-0.5 rounded-md border border-amber-400/30 bg-amber-400/10 px-1 py-0.5 font-display text-[8px] font-bold uppercase text-amber-300 shrink-0">
                            <Crown className="h-2 w-2" />
                            Campeón
                          </span>
                        </div>
                        <p className="flex items-center gap-1 text-[11px] font-semibold text-white/50 font-display mt-0.5 truncate">
                          <Calendar className="h-2.5 w-2.5 text-amber-400/80" />
                          <span>{champ.date}</span>
                        </p>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide truncate">
                          {champ.teamName}
                        </span>
                        <span className="text-[9px] text-white/40 font-mono">
                          {membersCount} jugadores
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botón rápido editar */}
                  <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] text-white/40 italic">Haz clic para editar roster</span>
                    <button
                      type="button"
                      onClick={() => setEditingChampion({ ...champ })}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300"
                    >
                      <Edit3 className="h-2.5 w-2.5" />
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Champion Button */}
            <button
              onClick={() => {
                const newC: PastChampion = {
                  id: `champ-${Date.now()}`,
                  tournamentName: "Nuevo Torneo",
                  date: "Mes 2026",
                  teamName: "Equipo Campeón",
                  teamLogo: "",
                  gradient: "from-amber-500 to-orange-600",
                  members: [
                    { name: "Jugador 1", role: "Tank" },
                    { name: "Jugador 2", role: "DPS" },
                    { name: "Jugador 3", role: "DPS" },
                    { name: "Jugador 4", role: "Support" },
                    { name: "Jugador 5", role: "Support" },
                  ],
                };
                addPastChampion(newC);
                setEditingChampion(newC);
              }}
              className="group flex min-h-[105px] flex-row items-center justify-center gap-3 rounded-2xl border border-dashed border-amber-400/25 bg-amber-500/[0.02] p-4 text-left transition-all duration-300 hover:border-amber-400/50 hover:bg-amber-500/[0.06] cursor-pointer"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-400 transition-transform duration-300 group-hover:scale-110">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-wider text-amber-300 group-hover:text-amber-200">
                  Agregar Torneo
                </p>
                <p className="mt-0.5 text-[11px] text-white/40">
                  Nuevo campeón al Hall of Fame
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Member Edit Modal / Drawer */}
      {editingMember && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-[#0a0a0e] p-4 sm:p-6 md:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    Editar Casilla de Integrante
                  </h3>
                  <p className="text-xs text-white/50">
                    Ajusta los textos, avatar y los 5 enlaces de redes sociales independientes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-6 flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Preview & Basic Info Row */}
              <div className="grid gap-6 sm:grid-cols-[140px_1fr] items-center card-surface p-4 rounded-2xl border border-white/10">
                <div className="flex flex-col items-center gap-2">
                  <MonogramAvatar
                    name={editingMember.member.name}
                    gradient={editingMember.member.gradient}
                    image={editingMember.member.avatarImage}
                    avatarType={editingMember.member.avatarType}
                    size="xl"
                  />
                  <span className="font-display text-[10px] uppercase tracking-wider text-white/40">
                    Vista previa
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                      Nombre del Integrante
                    </label>
                    <input
                      type="text"
                      value={editingMember.member.name}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          member: {
                            ...editingMember.member,
                            name: e.target.value,
                          },
                        })
                      }
                      placeholder="Ej. Nosotros, Aner, Sher..."
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm font-semibold text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                      Rol / Cargo
                    </label>
                    <input
                      type="text"
                      value={editingMember.member.role}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          member: {
                            ...editingMember.member,
                            role: e.target.value,
                          },
                        })
                      }
                      placeholder="Ej. Dirección, Operaciones, Staff..."
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                      Descripción / Biografía
                    </label>
                    <textarea
                      rows={2}
                      value={editingMember.member.description || ""}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          member: {
                            ...editingMember.member,
                            description: e.target.value,
                          },
                        })
                      }
                      placeholder="Breve reseña o funciones dentro del equipo..."
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:border-orange-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Avatar Type & Image Customization */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Tipo de Avatar & Casilla
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingMember({
                        ...editingMember,
                        member: {
                          ...editingMember.member,
                          avatarType: "monogram",
                        },
                      })
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3 font-display text-xs font-bold uppercase tracking-wider cursor-pointer",
                      editingMember.member.avatarType === "monogram"
                        ? "border-orange-500 bg-orange-500/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.05]"
                    )}
                  >
                    <Palette className="h-4 w-4 text-orange-400" />
                    Monograma de Iniciales
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingMember({
                        ...editingMember,
                        member: {
                          ...editingMember.member,
                          avatarType: "image",
                        },
                      })
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3 font-display text-xs font-bold uppercase tracking-wider cursor-pointer",
                      editingMember.member.avatarType === "image"
                        ? "border-orange-500 bg-orange-500/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.05]"
                    )}
                  >
                    <ImageIcon className="h-4 w-4 text-purple-400" />
                    Imagen / Foto
                  </button>
                </div>

                {editingMember.member.avatarType === "image" ? (
                  <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                      URL de la Imagen o Subir Archivo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingMember.member.avatarImage || ""}
                        onChange={(e) =>
                          setEditingMember({
                            ...editingMember,
                            member: {
                              ...editingMember.member,
                              avatarImage: e.target.value,
                            },
                          })
                        }
                        placeholder="https://ejemplo.com/foto.jpg"
                        className="flex-1 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-bold text-orange-200 hover:bg-orange-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 text-orange-400" />
                        )}
                        <span>{isUploadingAvatar ? "Subiendo a R2..." : "Subir a R2"}</span>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                      Paleta de Degradado
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {GRADIENT_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setEditingMember({
                              ...editingMember,
                              member: {
                                ...editingMember.member,
                                gradient: preset.value,
                              },
                            })
                          }
                          title={preset.name}
                          className={cn(
                            "relative h-10 rounded-xl bg-gradient-to-br transition-transform hover:scale-105 cursor-pointer",
                            preset.value,
                            editingMember.member.gradient === preset.value &&
                              "ring-2 ring-white ring-offset-2 ring-offset-black"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5 Independent Social Links & Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/80">
                    Redes Sociales (5 Plataformas Independientes)
                  </label>
                  <span className="text-[11px] text-white/40">
                    Activa/desactiva y personaliza el enlace para cada una
                  </span>
                </div>

                <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/40 p-4">
                  {SOCIAL_LIST.map((platform) => {
                    const meta = SOCIAL_META[platform];
                    const setting =
                      editingMember.member.socials[platform] || {
                        enabled: false,
                        url: "#",
                      };

                    return (
                      <div
                        key={platform}
                        className={cn(
                          "flex flex-col gap-2 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
                          setting.enabled
                            ? "border-white/15 bg-white/[0.02]"
                            : "border-white/5 bg-transparent opacity-50"
                        )}
                      >
                        {/* Platform info + Toggle */}
                        <div className="flex items-center gap-3">
                          <SocialButton
                            platform={platform}
                            href={setting.url}
                            className="h-8 w-8"
                          />
                          <div>
                            <p className={cn("text-xs font-bold", meta.color)}>
                              {meta.name}
                            </p>
                            <span className="text-[10px] text-white/40">
                              {setting.enabled ? "Activo" : "Desactivado"}
                            </span>
                          </div>
                        </div>

                        {/* Switch & URL Input */}
                        <div className="flex flex-1 items-center gap-2 sm:max-w-xs">
                          <input
                            type="text"
                            value={setting.url === "#" ? "" : setting.url}
                            disabled={!setting.enabled}
                            onChange={(e) =>
                              setEditingMember({
                                ...editingMember,
                                member: {
                                  ...editingMember.member,
                                  socials: {
                                    ...editingMember.member.socials,
                                    [platform]: {
                                      ...setting,
                                      url: e.target.value,
                                    },
                                  },
                                },
                              })
                            }
                            placeholder={meta.placeholder}
                            className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none disabled:opacity-40"
                          />

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() =>
                              setEditingMember({
                                ...editingMember,
                                member: {
                                  ...editingMember.member,
                                  socials: {
                                    ...editingMember.member.socials,
                                    [platform]: {
                                      ...setting,
                                      enabled: !setting.enabled,
                                      url: setting.url || meta.placeholder,
                                    },
                                  },
                                },
                              })
                            }
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              setting.enabled ? "bg-orange-500" : "bg-white/10"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                setting.enabled ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm(`¿Eliminar a ${editingMember.member.name}?`)) {
                    removeMember(
                      editingMember.groupId,
                      editingMember.member.id
                    );
                    setEditingMember(null);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingMember(null)}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveMember}>
                  <Check className="h-4 w-4" />
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    Nuevo Apartado
                  </h3>
                  <p className="text-xs text-white/50">
                    Crea una nueva categoría de integrantes para el equipo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateNewGroup} className="mt-6 space-y-5 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Nombre del Apartado <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  placeholder="Ej: Producción, Casters, Directiva, etc."
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-semibold text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Ej: Equipo encargado de la creación audiovisual y retransmisión de torneos."
                  className="w-full resize-none rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  Acento de Color
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {ACCENT_OPTIONS.map((opt) => {
                    const isSelected = newGroupAccent === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNewGroupAccent(opt.id)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-orange-500 bg-orange-500/10 text-white"
                            : "border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white"
                        )}
                      >
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full bg-gradient-to-br shrink-0",
                            opt.bg
                          )}
                        />
                        <span className="font-display text-xs font-bold uppercase tracking-wider truncate">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-8 flex shrink-0 items-center justify-end gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewGroupModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newGroupTitle.trim()}
                >
                  <Plus className="h-4 w-4" />
                  Crear Apartado
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* MODAL PARA EDITAR TORNEO CAMPEÓN */}
      {editingChampion && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-[#0a0a0e] p-4 sm:p-6 md:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-400">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase italic text-white">
                    Editar Torneo Campeón
                  </h3>
                  <p className="text-xs text-white/50">
                    Ajusta los detalles del torneo, equipo ganador y lista de participantes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingChampion(null)}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-6 flex-1 overflow-y-auto space-y-5 pr-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Nombre del Torneo <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingChampion.tournamentName}
                    onChange={(e) =>
                      setEditingChampion({
                        ...editingChampion,
                        tournamentName: e.target.value,
                      })
                    }
                    placeholder="Ej: Overplay Tourney 3"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Fecha del Torneo
                  </label>
                  <input
                    type="text"
                    value={editingChampion.date}
                    onChange={(e) =>
                      setEditingChampion({
                        ...editingChampion,
                        date: e.target.value,
                      })
                    }
                    placeholder="Ej: Noviembre 2025"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Nombre del Equipo Campeón <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingChampion.teamName}
                    onChange={(e) =>
                      setEditingChampion({
                        ...editingChampion,
                        teamName: e.target.value,
                      })
                    }
                    placeholder="Ej: Dark Pulse"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Degradado de Respaldo
                  </label>
                  <select
                    value={editingChampion.gradient || "from-amber-500 to-orange-600"}
                    onChange={(e) =>
                      setEditingChampion({
                        ...editingChampion,
                        gradient: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#101014] px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  >
                    {GRADIENT_PRESETS.map((g) => (
                      <option key={g.id} value={g.value}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subida o URL del Logo */}
              <div className="card-surface p-4 rounded-2xl border border-white/10 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Logo / Imagen del Equipo
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-white/15 bg-black/50 flex items-center justify-center">
                    {editingChampion.teamLogo ? (
                      <img
                        src={editingChampion.teamLogo}
                        alt="Logo Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Trophy className="h-7 w-7 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={editingChampion.teamLogo || ""}
                      onChange={(e) =>
                        setEditingChampion({
                          ...editingChampion,
                          teamLogo: e.target.value,
                        })
                      }
                      placeholder="https://... URL directa de imagen o sube un archivo"
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        ref={championLogoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChampLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => championLogoInputRef.current?.click()}
                        disabled={isUploadingChampLogo}
                        className="text-xs"
                      >
                        {isUploadingChampLogo ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5 text-amber-400" />
                            Subir Imagen a R2
                          </>
                        )}
                      </Button>
                      {editingChampion.teamLogo && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingChampion({
                              ...editingChampion,
                              teamLogo: "",
                            })
                          }
                          className="text-[11px] text-white/40 hover:text-rose-400"
                        >
                          Quitar logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Roster de Participantes y sus Roles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                    Alineación / Participantes ({editingChampion.members?.length || 0})
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const updated = [
                        ...(editingChampion.members || []),
                        { name: "Nuevo Jugador", role: "DPS" },
                      ];
                      setEditingChampion({
                        ...editingChampion,
                        members: updated,
                      });
                    }}
                    className="text-xs text-amber-300 hover:text-amber-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar Jugador
                  </Button>
                </div>

                <div className="space-y-2">
                  {(editingChampion.members || []).map((member, mIdx) => (
                    <div
                      key={mIdx}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2"
                    >
                      <span className="font-mono text-xs text-white/30 px-1">
                        #{mIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => {
                          const updated = [...editingChampion.members];
                          updated[mIdx] = { ...updated[mIdx], name: e.target.value };
                          setEditingChampion({
                            ...editingChampion,
                            members: updated,
                          });
                        }}
                        placeholder="Nombre / Tag"
                        className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white focus:border-amber-500 focus:outline-none font-semibold"
                      />
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => {
                          const updated = [...editingChampion.members];
                          updated[mIdx] = { ...updated[mIdx], role: e.target.value };
                          setEditingChampion({
                            ...editingChampion,
                            members: updated,
                          });
                        }}
                        placeholder="Rol (Tank, DPS, Support...)"
                        className="w-32 sm:w-40 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-amber-300 focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingChampion.members.filter(
                            (_, idx) => idx !== mIdx
                          );
                          setEditingChampion({
                            ...editingChampion,
                            members: updated,
                          });
                        }}
                        className="p-1 text-white/40 hover:text-rose-400 cursor-pointer"
                        title="Eliminar jugador"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex shrink-0 items-center justify-end gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingChampion(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (!editingChampion.tournamentName.trim()) return;
                  updatePastChampion(editingChampion.id, editingChampion);
                  setEditingChampion(null);
                  setSyncSuccess("Casilla de campeón actualizada. ¡No olvides hacer clic en Guardar en Supabase!");
                  setTimeout(() => setSyncSuccess(null), 3500);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                <Check className="h-4 w-4" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}
