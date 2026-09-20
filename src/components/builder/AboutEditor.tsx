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
} from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { GRADIENT_PRESETS } from "../../data/initialData";
import { supabase } from "../../lib/supabase";
import type {
  GroupAccent,
  SocialPlatform,
  TeamGroup,
  TeamMember,
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

  // Estados de sincronización con Supabase y subida a R2
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
        g.members.map((m, mIndex) => ({
          id: m.id,
          group_id: g.id,
          name: m.name,
          role: m.role,
          avatar_type: m.avatarType || "monogram",
          avatar_image: m.avatarImage || "",
          gradient: m.gradient || "from-orange-500 to-rose-600",
          socials: m.socials || {},
          order_index: mIndex,
          updated_at: new Date().toISOString(),
        }))
      );

      if (membersToUpsert.length > 0) {
        const { error: memberError } = await supabase
          .from("team_members")
          .upsert(membersToUpsert, { onConflict: "id" });

        if (memberError) throw memberError;
      }

      setSyncSuccess("¡Equipo sincronizado y guardado con éxito en Supabase!");
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

      const loadedGroups: TeamGroup[] = dbGroups.map((group: any) => ({
        id: group.id,
        title: group.title,
        description: group.description || "",
        accent: group.accent || "ember",
        members: (dbMembers || [])
          .filter((m: any) => m.group_id === group.id)
          .map((m: any) => ({
            id: m.id,
            name: m.name,
            role: m.role,
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

          {/* Cards Grid — Exact Same Size (6 columns uniform) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {currentGroup.members.map((member, index) => {
              return (
                <div
                  key={member.id}
                  className="card-surface group relative flex h-full flex-col items-center gap-3 overflow-hidden rounded-2xl border border-white/10 p-4 text-center transition-all duration-300 hover:border-orange-400/40 hover:shadow-[0_12px_40px_-16px_rgba(249,115,22,0.3)]"
                >
                  {/* Top action quick tools */}
                  <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-20 bg-[#07070a]/90 rounded-lg p-1 border border-white/10">
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

                  {/* Avatar */}
                  <div
                    onClick={() => handleOpenEdit(currentGroup.id, member)}
                    className="cursor-pointer transition-transform duration-300 group-hover:scale-105 mt-2"
                  >
                    <MonogramAvatar
                      name={member.name}
                      gradient={member.gradient}
                      image={member.avatarImage}
                      avatarType={member.avatarType}
                      size="lg"
                    />
                  </div>

                  {/* Name & Role */}
                  <div className="w-full">
                    <h4 className="font-display text-base font-bold uppercase italic tracking-wide text-white truncate">
                      {member.name}
                    </h4>
                    <p className="mt-0.5 text-xs text-white/50 truncate">
                      {member.role}
                    </p>
                  </div>

                  {/* 5 Social Media Icons in 1 single line with live click */}
                  <div className="mt-auto flex w-full flex-nowrap items-center justify-center gap-1.5 border-t border-white/[0.07] pt-3">
                    {SOCIAL_LIST.map((platform) => {
                      const setting = member.socials?.[platform];
                      const isEnabled = setting?.enabled ?? false;
                      const url = setting?.url || "#";

                      if (!isEnabled) {
                        return (
                          <span
                            key={platform}
                            title={`${SOCIAL_META[platform].name} (Desactivado)`}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/[0.01] text-white/15 opacity-40"
                          >
                            <span className="text-[9px]">✕</span>
                          </span>
                        );
                      }

                      return (
                        <SocialButton
                          key={platform}
                          platform={platform}
                          href={url}
                          label={`${member.name} en ${SOCIAL_META[platform].name}`}
                          className="h-6.5 w-6.5 sm:h-7 sm:w-7 shrink-0 rounded-full border-white/10 bg-white/[0.03] text-white/50 hover:border-orange-400/60 hover:bg-orange-500/15 hover:text-white"
                          iconClassName="h-3 w-3 sm:h-3.5 sm:w-3.5"
                        />
                      );
                    })}
                  </div>

                  {/* Quick Edit Button */}
                  <button
                    onClick={() => handleOpenEdit(currentGroup.id, member)}
                    className="w-full mt-2 rounded-lg border border-white/10 bg-white/[0.02] py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                  >
                    Editar Casilla
                  </button>
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
              className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.01] p-6 text-center transition-all duration-300 hover:border-orange-400/40 hover:bg-orange-500/[0.04] cursor-pointer"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/40 transition-transform duration-300 group-hover:scale-110 group-hover:border-orange-400/40 group-hover:text-orange-300">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-wider text-white/60 group-hover:text-white">
                  Agregar Integrante
                </p>
                <p className="mt-1 text-[11px] text-white/30">
                  Nuevo miembro a {currentGroup.title}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Member Edit Modal / Drawer */}
      {editingMember && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
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
    </div>
  );
}
