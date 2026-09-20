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
} from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { Button } from "../ui/Button";
import { BUILDER_SECTIONS_LIST, SUPER_ADMIN_EMAIL } from "../../data/initialData";
import type { BuilderSectionKey, BuilderUser } from "../../types/builder";

export function UsersManagementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    usersList,
    approveUser,
    rejectUser,
    updateUserPermissions,
    deleteUser,
    syncUsersWithSupabase,
    isSuperAdmin,
  } = useBuilder();

  const [isSyncing, setIsSyncing] = useState(false);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<BuilderUser | null>(null);
  const [selectedSections, setSelectedSections] = useState<BuilderSectionKey[]>([]);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen || !isSuperAdmin) return null;

  const pendingUsers = usersList.filter((u) => u.status === "pending");
  const approvedUsers = usersList.filter((u) => u.status === "approved");
  const rejectedUsers = usersList.filter((u) => u.status === "rejected");

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

  const openApproveOrEdit = (user: BuilderUser) => {
    setEditingPermissionsUser(user);
    // If user has allowedSections already, load them. Else default to all or empty
    if (user.allowedSections && user.allowedSections.length > 0) {
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
      setSuccessNotice(`Permisos actualizados para ${editingPermissionsUser.username || editingPermissionsUser.email}`);
    }

    setEditingPermissionsUser(null);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

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
  '["about", "events", "competitive", "news", "allies", "hero", "ticker", "cta"]'::jsonb,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET role = 'superadmin',
    status = 'approved',
    username = 'Pamache',
    allowed_sections = '["about", "events", "competitive", "news", "allies", "hero", "ticker", "cta"]'::jsonb,
    updated_at = NOW();
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_CREATE_USERS_TABLE);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0f] shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold uppercase italic text-white">
                  Control de Accesos & Solicitudes
                </h2>
                <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-2.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-orange-300">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-white/50">
                Gestiona las cuentas en la tabla independiente <code className="text-orange-400 font-mono">builder_users</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSqlModal(true)}
              className="text-xs"
            >
              <span>Ver SQL Tabla</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="text-xs"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSyncing ? "animate-spin text-orange-400" : ""}`} />
              <span>Sincronizar</span>
            </Button>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Success alert */}
        {successNotice && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Section 1: Solicitudes Pendientes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Clock className="h-3.5 w-3.5" />
                </span>
                <h3 className="font-display text-base font-bold uppercase italic text-white">
                  Solicitudes Pendientes de Aprobación
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-display text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  {pendingUsers.length}
                </span>
              </div>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40 bg-white/[0.01]">
                No hay solicitudes pendientes en este momento.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-4 transition-all hover:border-amber-500/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-white">{user.email}</span>
                        <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          Pendiente
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/45">
                        Solicitado: {new Date(user.createdAt).toLocaleString("es-ES")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => openApproveOrEdit(user)}
                        className="text-xs flex items-center gap-1.5"
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
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Rechazar</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Usuarios Aprobados & Permisos */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <UserCheck className="h-3.5 w-3.5" />
                </span>
                <h3 className="font-display text-base font-bold uppercase italic text-white">
                  Usuarios con Acceso Activo
                </h3>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-display text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  {approvedUsers.length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {approvedUsers.map((user) => {
                const isSuper = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                return (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-white/20"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {user.username || "(Sin nombre asignado aún)"}
                        </span>
                        <span className="text-xs text-white/50">({user.email})</span>
                        {isSuper ? (
                          <span className="rounded-md border border-orange-500/40 bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-300 uppercase tracking-wider">
                            Superadministrador
                          </span>
                        ) : (
                          <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
                            Colaborador
                          </span>
                        )}
                      </div>

                      {/* Badges de Casillas Autorizadas */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] text-white/40 mr-1 flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          Casillas:
                        </span>
                        {isSuper ? (
                          <span className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 font-display text-[9px] font-bold uppercase text-orange-200">
                            Todas las Casillas (Acceso Total)
                          </span>
                        ) : user.allowedSections && user.allowedSections.length > 0 ? (
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

                    {!isSuper && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openApproveOrEdit(user)}
                          className="text-xs flex items-center gap-1.5"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-orange-400" />
                          <span>Editar Casillas</span>
                        </Button>

                        <button
                          onClick={() => deleteUser(user.id)}
                          title="Eliminar usuario"
                          className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modal: Configurar Casillas Independientes */}
      {editingPermissionsUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-150">
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
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10 hover:text-white"
              >
                Marcar Todas
              </button>
              <button
                onClick={handleDeselectAll}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10 hover:text-white"
              >
                Desmarcar Todas
              </button>
              <button
                onClick={() => setSelectedSections(["news"])}
                className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-500/20"
              >
                Solo Noticias
              </button>
              <button
                onClick={() => setSelectedSections(["events"])}
                className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-300 hover:bg-orange-500/20"
              >
                Solo Eventos
              </button>
              <button
                onClick={() => setSelectedSections(["competitive"])}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20"
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

      {/* Sub-modal: SQL para crear tabla builder_users */}
      {showSqlModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-[#0e0e14] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display text-lg font-bold uppercase italic text-white">
                  SQL: Tabla Independiente <code className="text-orange-400 font-mono">builder_users</code>
                </h3>
                <p className="text-xs text-white/50">
                  Ejecuta este código en el SQL Editor de Supabase para tener la tabla separada.
                </p>
              </div>

              <button
                onClick={() => setShowSqlModal(false)}
                className="rounded-xl p-1.5 text-white/50 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSqlModal(false)}
                >
                  Cerrar
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCopySql}
                  className="font-display text-xs font-bold uppercase tracking-wider"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
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
