import { useState } from "react";
import { Mail, ShieldCheck, Clock, RefreshCw, LogOut, Sparkles, AlertCircle, ArrowRight, ShieldAlert } from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { Logo } from "../ui/Logo";
import { Button } from "../ui/Button";

export function AuthGate() {
  const { currentUser, loginWithEmail, logout, syncUsersWithSupabase } = useBuilder();
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await loginWithEmail(emailInput.trim());
      if (!res.success && res.message) {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await syncUsersWithSupabase();
    } finally {
      setTimeout(() => setIsChecking(false), 600);
    }
  };

  // 1. Vista: Esperando aprobación de acceso
  if (currentUser && currentUser.status === "pending") {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#050506] px-4 py-12 text-white selection:bg-orange-500 selection:text-white">
        <div aria-hidden className="noise-overlay" />

        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-amber-600/15 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-80 w-80 rounded-full bg-orange-600/10 blur-[120px]" />

        <div className="relative z-10 w-full max-w-md">
          {/* Card Container */}
          <div className="card-surface overflow-hidden rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Logo />
            </div>

            {/* Pulsing Clock Icon */}
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)]">
              <span className="absolute -inset-1 rounded-2xl bg-amber-500/20 animate-ping opacity-50" />
              <Clock className="relative h-10 w-10 text-amber-400 animate-pulse" />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-3">
              <Sparkles className="h-3 w-3" />
              Solicitud de Acceso Registrada
            </div>

            <h2 className="font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
              Esperando Aprobación de Acceso
            </h2>

            <p className="mt-3 text-xs leading-relaxed text-white/65 sm:text-sm">
              Tu solicitud con el correo <span className="font-semibold text-amber-300 underline">{currentUser.email}</span> ha sido enviada al Superadministrador (<span className="text-white font-medium">Pamache</span>).
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left text-xs text-white/60">
              <p className="flex items-center gap-2 font-semibold text-white/80 mb-1">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                Permisos por Casilla
              </p>
              <p className="leading-normal">
                En cuanto el administrador active tu cuenta y te asigne los módulos correspondientes, la pantalla se actualizará automáticamente.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={handleManualCheck}
                disabled={isChecking}
                className="w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin text-orange-400" : ""}`} />
                <span>{isChecking ? "Comprobando aprobación..." : "Verificar Estado Ahora"}</span>
              </Button>

              <button
                onClick={logout}
                className="group flex items-center justify-center gap-2 rounded-xl py-2 font-display text-xs font-bold uppercase tracking-wider text-white/50 transition-colors hover:text-white cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Usar otro correo / Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Vista: Acceso Rechazado
  if (currentUser && currentUser.status === "rejected") {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#050506] px-4 py-12 text-white">
        <div aria-hidden className="noise-overlay" />
        <div className="relative z-10 w-full max-w-md">
          <div className="card-surface overflow-hidden rounded-3xl border border-red-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center">
            <div className="flex justify-center mb-6">
              <Logo />
            </div>

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h2 className="font-display text-2xl font-bold uppercase italic text-white">
              Acceso Denegado
            </h2>

            <p className="mt-3 text-xs leading-relaxed text-white/60">
              La solicitud para <span className="font-semibold text-red-300">{currentUser.email}</span> no ha sido aprobada por el administrador.
            </p>

            <div className="mt-6">
              <Button variant="secondary" size="md" onClick={logout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Probar con otro correo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Vista: Formulario de Ingreso / Registro
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050506] px-4 py-12 text-white selection:bg-orange-500 selection:text-white">
      <div aria-hidden className="noise-overlay" />

      {/* Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-orange-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-20 right-1/4 h-80 w-80 rounded-full bg-violet-600/10 blur-[130px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="card-surface overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <Logo />
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-orange-300">
              <Sparkles className="h-3 w-3" />
              Panel de Control CMS · Builder
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
              Control de Acceso
            </h1>
            <p className="mt-2 text-xs text-white/50 sm:text-sm">
              Ingresa tu correo electrónico para acceder o solicitar permisos al Superadministrador.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/40">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="ejemplo@overplay.gg o pamacheyt@gmail.com"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 transition-all focus:border-orange-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-white/40">
                Superadministrador: <span className="font-mono text-orange-400/80">pamacheyt@gmail.com</span>
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting || !emailInput.trim()}
              className="w-full flex items-center justify-center gap-2 font-display text-xs font-bold uppercase tracking-wider mt-2"
            >
              <span>{isSubmitting ? "Verificando..." : "Ingresar al Builder"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Footer note */}
          <div className="mt-6 border-t border-white/10 pt-4 text-center text-[11px] text-white/40">
            Overplay Esports · Sistema Seguro de Permisos y Roles
          </div>
        </div>
      </div>
    </div>
  );
}
