import { useState } from "react";
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  Sparkles,
  Clock,
  UserCheck,
  Layers,
  CheckSquare,
  Square,
  X,
  RefreshCw,
  SlidersHorizontal,
  Code2,
  Copy,
  User,
  Crown,
} from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { Button } from "../ui/Button";
import { BUILDER_SECTIONS_LIST, SUPER_ADMIN_EMAIL } from "../../data/initialData";
import type { BuilderSectionKey, BuilderUser } from "../../types/builder";

export function UsersManagementEditor() {
  const {
    usersList,
    approveUser,
    rejectUser,
    updateUserPermissions,
    updateUserRole,
    deleteUser,
    syncUsersWithSupabase,
    isSuperAdmin,
  } = useBuilder();

  const [isSyncing, setIsSyncing] = useState(false);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<BuilderUser | null>(null);
  const [selectedSections, setSelectedSections] = useState<BuilderSectionKey[]>([]);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const safeUsers = Array.isArray(usersList) ? usersList : [];
  const pendingUsers = safeUsers.filter((u) => u && u.status === "pending");
  const approvedUsers = safeUsers.filter((u) => u && u.status === "approved");

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncUsersWithSupabase();
      setSuccessNotice("Lista de usuarios sincronizada con Supabase.");
      setTimeout(() => setSuccessNotice(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleSuperAdmin = async (user: BuilderUser, targetRole: "superadmin" | "editor") => {
    if (targetRole === "superadmin") {
      const confirmMsg = `¿Estás seguro de convertir a "${user.username || user.email}" en Superadministrador?\n\nTendrá acceso total a todas las secciones del Builder y podrá gestionar usuarios.`;
      if (!window.confirm(confirmMsg)) return;

      await updateUserRole(user.id, "superadmin");
      setSuccessNotice(`👑 ¡${user.username || user.email} ahora es Superadministrador!`);
    } else {
      const confirmMsg = `¿Estás seguro de revocar el rol de Superadministrador a "${user.username || user.email}" y dejarlo como Colaborador/Editor?`;
      if (!window.confirm(confirmMsg)) return;

      await updateUserRole(user.id, "editor");
      setSuccessNotice(`Rol cambiado a Colaborador para ${user.username || user.email}`);
    }
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const openApproveOrEdit = (user: BuilderUser) => {
    setEditingPermissionsUser(user);
    if (user.allowedSections && Array.isArray(user.allowedSections) && user.allowedSections.length > 0) {
      setSelectedSections([...user.allowedSections]);
    } else {
      setSelectedSections(["news"]); // Default preset: news
    }
  };

  const toggleSection = (sectionKey: BuilderSectionKey) => {
    if (selectedSections.includes(sectionKey)) {
      setSelectedSections(selectedSections.filter((s) => s !== sectionKey));
    } else {
      setSelectedSections([...selectedSections, sectionKey]);
    }
  };

  const handleSelectAll = () => {
    setSelectedSections(BUILDER_SECTIONS_LIST.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedSections([]);
  };

  const handleSavePermissions = async () => {
    if (!editingPermissionsUser) return;

    if (editingPermissionsUser.status === "pending") {
      await approveUser(editingPermissionsUser.id, selectedSections);
      setSuccessNotice(`Acceso aprobado para ${editingPermissionsUser.email}`);
    } else {
      await updateUserPermissions(editingPermissionsUser.id, selectedSections);
      setSuccessNotice(
        `Permisos actualizados para ${editingPermissionsUser.username || editingPermissionsUser.email}`
      );
    }

    setEditingPermissionsUser(null);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const SQL_CREATE_USERS_TABLE = `-- =========================================================
-- TABLA INDEPENDIENTE: builder_users (USUARIOS Y ACCESOS)
-- =========================================================

-- 1. Crear tabla independiente para usuarios del Builder
CREATE TABLE IF NOT EXISTS public.builder_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'editor', -- 'superadmin' | 'editor'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  allowed_sections JSONB DEFAULT '[]'::jsonb, -- array con casillas autorizadas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- 2. Habilitar RLS y políticas de acceso
ALTER TABLE public.builder_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read builder_users" ON public.builder_users;
CREATE POLICY "Allow anonymous read builder_users"
  ON public.builder_users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous write builder_users" ON public.builder_users;
CREATE POLICY "Allow anonymous write builder_users"
  ON public.builder_users FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Insertar cuenta de Superadministrador Pamache
INSERT INTO public.builder_users (id, email, username, role, status, allowed_sections, created_at, updated_at, approved_at)
VALUES (
  'user-superadmin-pamache',
  'pamacheyt@gmail.com',
  'Pamache',
  'superadmin',
  'approved',
  '["about", "events", "competitive", "news", "allies", "hero", "ticker", "cta", "registrations", "email-template"]'::jsonb,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET role = 'superadmin',
    status = 'approved',
    username = 'Pamache',
    allowed_sections = '["about", "events", "competitive", "news", "allies", "hero", "ticker", "cta", "registrations", "email-template"]'::jsonb,
    updated_at = NOW();
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_CREATE_USERS_TABLE);
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
              Panel Exclusivo · Superadministrador
            </p>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
            Gestión de <span className="text-brand-gradient">Usuarios & Accesos</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Aprueba colaboradores y asigna de forma independiente las casillas que cada usuario puede ver y editar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-2"
          >
            <Code2 className="h-4 w-4 text-orange-400" />
            <span>Ver SQL Tabla</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Sincronizando..." : "Sincronizar Supabase"}</span>
          </Button>
        </div>
      </div>

      {/* Success Alert */}
      {successNotice && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Grid: Solicitudes Pendientes & Usuarios Activos */}
      <div className="mt-8 space-y-8">
        {/* Section 1: Solicitudes Pendientes */}
        <div className="card-surface rounded-3xl border border-amber-500/30 p-6 sm:p-8 bg-amber-500/[0.02]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold uppercase italic text-white">
                  Solicitudes Pendientes de Aprobación
                </h2>
                <p className="text-xs text-white/50">
                  Usuarios que han ingresado su correo y están a la espera de que actives sus casillas.
                </p>
              </div>
            </div>

            <span className="rounded-full bg-amber-500/20 px-3 py-1 font-display text-xs font-bold text-amber-300 border border-amber-500/30">
              {pendingUsers.length} {pendingUsers.length === 1 ? "solicitud" : "solicitudes"}
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-white/40 bg-white/[0.01]">
              No hay solicitudes pendientes en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-5 transition-all hover:border-amber-500/50 shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-white">{user.email}</span>
                      <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 uppercase">
                        Pendiente
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      Registrado: {user.createdAt ? new Date(user.createdAt).toLocaleString("es-ES") : "Reciente"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => openApproveOrEdit(user)}
                      className="flex-1 text-xs flex items-center justify-center gap-1.5 font-display uppercase tracking-wider"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span>Aprobar & Asignar Casillas</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => rejectUser(user.id)}
                      className="text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Rechazar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Usuarios Activos & Permisos */}
        <div className="card-surface rounded-3xl border border-white/10 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <UserCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold uppercase italic text-white">
                  Usuarios con Acceso Autorizado
                </h2>
                <p className="text-xs text-white/50">
                  Colaboradores con acceso activo al Builder y sus casillas asignadas.
                </p>
              </div>
            </div>

            <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-display text-xs font-bold text-emerald-300 border border-emerald-500/30">
              {approvedUsers.length} activos
            </span>
          </div>

          <div className="space-y-3">
            {approvedUsers.map((user) => {
              const isPrimaryOwner = (user.email || "").toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
              const isSuper = isPrimaryOwner || user.role === "superadmin";

              return (
                <div
                  key={user.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 transition-all ${
                    isSuper
                      ? "border-orange-500/30 bg-gradient-to-r from-orange-500/[0.05] via-amber-500/[0.02] to-transparent shadow-lg shadow-orange-500/5"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-base text-white">
                        {user.username || "(Sin nombre asignado aún)"}
                      </span>
                      <span className="text-xs text-white/50 font-mono">({user.email})</span>
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/40 bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-black text-orange-300 uppercase tracking-wider shadow-sm">
                          <Crown className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                          Superadministrador
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
                          <User className="h-3 w-3 text-emerald-400" />
                          Colaborador
                        </span>
                      )}
                    </div>

                    {/* Badges de Casillas Autorizadas */}
                    <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] text-white/40 mr-1 flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        Casillas permitidas:
                      </span>
                      {isSuper ? (
                        <span className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 font-display text-[9px] font-bold uppercase text-orange-200">
                          Todas las Casillas (Acceso Total de Superadmin)
                        </span>
                      ) : user.allowedSections && Array.isArray(user.allowedSections) && user.allowedSections.length > 0 ? (
                        user.allowedSections.map((secKey) => {
                          const foundSec = BUILDER_SECTIONS_LIST.find((s) => s.id === secKey);
                          return (
                            <span
                              key={secKey}
                              className="rounded-md border border-white/15 bg-white/[0.05] px-2 py-0.5 font-display text-[9px] font-semibold uppercase text-white/80"
                            >
                              {foundSec?.title || secKey}
                            </span>
                          );
                        })
                      ) : (
                        <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-display text-[9px] font-semibold uppercase text-red-300">
                          Ninguna casilla asignada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones para el usuario */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                    {/* Botón Convertir en Superadministrador / Degradar a Editor */}
                    {!isPrimaryOwner && (
                      isSuper ? (
                        <button
                          type="button"
                          onClick={() => handleToggleSuperAdmin(user, "editor")}
                          className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 hover:text-white transition-all cursor-pointer active:scale-95"
                          title="Revocar rol de Superadministrador y dejar como Editor"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Degradar a Editor</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleSuperAdmin(user, "superadmin")}
                          className="flex items-center gap-1.5 rounded-xl border border-orange-500/50 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-orange-200 hover:border-orange-400 hover:from-orange-500/30 hover:to-amber-500/30 hover:text-white transition-all cursor-pointer active:scale-95 shadow-lg shadow-orange-500/10"
                          title="Convertir a este usuario en Superadministrador con acceso total"
                        >
                          <Crown className="h-3.5 w-3.5 text-amber-400" />
                          <span>Hacer Superadmin</span>
                        </button>
                      )
                    )}

                    {!isSuper && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openApproveOrEdit(user)}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-orange-400" />
                        <span>Editar Casillas</span>
                      </Button>
                    )}

                    {!isPrimaryOwner && (
                      <button
                        onClick={() => deleteUser(user.id)}
                        title="Eliminar usuario"
                        className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-modal: Configurar Casillas Independientes */}
      {editingPermissionsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-orange-500/40 bg-[#0e0e14] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display text-lg font-bold uppercase italic text-white">
                  Permisos de Casillas del Builder
                </h3>
                <p className="text-xs text-white/50">
                  Selecciona a qué secciones tendrá acceso:{" "}
                  <span className="text-orange-400 font-semibold">{editingPermissionsUser.email}</span>
                </p>
              </div>

              <button
                onClick={() => setEditingPermissionsUser(null)}
                className="rounded-xl p-1.5 text-white/50 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                Marcar Todas
              </button>
              <button
                onClick={handleDeselectAll}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                Desmarcar Todas
              </button>
              <button
                onClick={() => setSelectedSections(["news"])}
                className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-500/20 cursor-pointer"
              >
                Solo Noticias
              </button>
              <button
                onClick={() => setSelectedSections(["events"])}
                className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-300 hover:bg-orange-500/20 cursor-pointer"
              >
                Solo Eventos
              </button>
              <button
                onClick={() => setSelectedSections(["competitive"])}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
              >
                Solo Competitivo
              </button>
            </div>

            {/* Checklist of Casillas */}
            <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1">
              {BUILDER_SECTIONS_LIST.map((sec) => {
                const isSelected = selectedSections.includes(sec.id);
                return (
                  <div
                    key={sec.id}
                    onClick={() => toggleSection(sec.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                      isSelected
                        ? "border-orange-500/50 bg-orange-500/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-orange-400" />
                      ) : (
                        <Square className="h-4 w-4 text-white/30" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-bold uppercase italic text-white">
                          {sec.title}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 font-display text-[8px] font-bold uppercase text-white/60">
                          {sec.tag}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-white/50">{sec.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPermissionsUser(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSavePermissions}
                disabled={selectedSections.length === 0}
                className="font-display text-xs font-bold uppercase tracking-wider"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {editingPermissionsUser.status === "pending"
                  ? `Aprobar con ${selectedSections.length} Casillas`
                  : `Guardar Permisos (${selectedSections.length})`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-[#0e0e14] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display text-lg font-bold uppercase italic text-white">
                SQL: Tabla Independiente <code className="text-orange-400 font-mono">builder_users</code>
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
                {SQL_CREATE_USERS_TABLE}
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
