import { useState } from "react";
import { User, Sparkles, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { Button } from "../ui/Button";

export function SetUsernameModal() {
  const { currentUser, saveUsername } = useBuilder();
  const [usernameInput, setUsernameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser || currentUser.status !== "approved" || currentUser.username?.trim()) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setError("Por favor ingresa un nombre de usuario.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const ok = await saveUsername(usernameInput.trim());
      if (!ok) {
        setError("Error al guardar el nombre de usuario.");
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-orange-500/40 bg-[#0d0d12] p-6 sm:p-8 shadow-[0_0_60px_-15px_rgba(249,115,22,0.4)] text-white">
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative z-10 text-center">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            ¡Acceso Concedido por el Administrador!
          </div>

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-inner">
            <User className="h-8 w-8" />
          </div>

          <h2 className="font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
            Asigna tu Nombre de Usuario
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-white/60 sm:text-sm">
            Hola <span className="font-semibold text-orange-300">{currentUser.email}</span>. Elige el nombre o gamertag con el que te identificarás en el Builder de Overplay.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300 text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 text-left space-y-4">
            <div>
              <label className="block font-display text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Nombre de Usuario o Apodo
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/40">
                  <Sparkles className="h-4 w-4 text-orange-400" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={30}
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Ej. KRON, Viper, RedactorNoticias, etc."
                  className="w-full rounded-xl border border-white/15 bg-white/[0.05] py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 transition-all focus:border-orange-500 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSaving || !usernameInput.trim()}
              className="w-full flex items-center justify-center gap-2 font-display text-xs font-bold uppercase tracking-wider pt-3 pb-3"
            >
              <span>{isSaving ? "Guardando..." : "Guardar y Entrar al Builder"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
