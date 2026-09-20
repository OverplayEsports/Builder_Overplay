import { ArrowLeft, Users, LogOut, Shield, User } from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { Logo } from "../ui/Logo";

export function BuilderNavbar({
  onOpenUsersManagement,
}: {
  onOpenUsersManagement?: () => void;
}) {
  const { activeTab, setActiveTab, currentUser, logout, isSuperAdmin, pendingUsersCount } =
    useBuilder();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#050506]/90 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Logo & Back Button */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setActiveTab("dashboard")}
            className="cursor-pointer transition-opacity hover:opacity-90"
          >
            <Logo />
          </div>

          {activeTab !== "dashboard" && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-white/80 transition-all duration-200 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-white cursor-pointer active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 text-orange-400 transition-transform duration-200 group-hover:-translate-x-1" />
              <span>Atrás</span>
            </button>
          )}
        </div>

        {/* Right: User Profile, Super Admin Controls & Logout */}
        <div className="flex items-center gap-3">
          {/* Superadmin: Users Management Button */}
          {isSuperAdmin && onOpenUsersManagement && (
            <button
              onClick={onOpenUsersManagement}
              className="relative flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-orange-300 transition-all duration-200 hover:border-orange-500/60 hover:bg-orange-500/20 hover:text-white cursor-pointer active:scale-95"
            >
              <Users className="h-4 w-4 text-orange-400" />
              <span className="hidden sm:inline">Gestión de Usuarios</span>
              {pendingUsersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 font-bold text-[10px] text-black shadow-md animate-pulse">
                  {pendingUsersCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile Pill */}
          {currentUser && (
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-500/30 bg-gradient-to-tr from-orange-500 to-rose-600 font-display text-xs font-bold text-white shadow-sm">
                {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-bold text-xs leading-tight text-white">
                  {currentUser.username || "Colaborador"}
                </span>
                <span className="text-[10px] leading-tight text-orange-400/90 font-medium">
                  {isSuperAdmin ? "Super Admin" : "Editor"}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Cerrar Sesión"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 cursor-pointer active:scale-95"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

