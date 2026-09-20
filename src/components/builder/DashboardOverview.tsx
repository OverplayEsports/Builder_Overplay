import {
  Users,
  Flame,
  Swords,
  Trophy,
  Newspaper,
  Handshake,
  ArrowRight,
  Sparkles,
  Zap,
  Radio,
  Sliders,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import type { BuilderSectionKey } from "../../types/builder";

export function DashboardOverview({
  onOpenUsersManagement,
}: {
  onOpenUsersManagement?: () => void;
}) {
  const { state, setActiveTab, currentUser, isSuperAdmin, hasPermission, pendingUsersCount } =
    useBuilder();

  const totalMembers = state.teamGroups.reduce(
    (acc, g) => acc + g.members.length,
    0
  );

  const SECTIONS: {
    id: BuilderSectionKey;
    title: string;
    tag: string;
    icon: any;
    status: string;
    description: string;
    color: string;
    accentBorder: string;
    highlight?: boolean;
    actionLabel?: string;
    onAction?: () => void;
  }[] = [
    {
      id: "about",
      title: "Sobre Nosotros (Equipo)",
      tag: "CMS Completo",
      icon: Users,
      status: `${state.teamGroups.length} Apartados · ${totalMembers} Integrantes`,
      description: "Gestor de casillas uniformes, 5 iconos sociales independientes, avatares y textos.",
      actionLabel: "Abrir Editor",
      onAction: () => setActiveTab("about"),
      color: "from-violet-500/20 to-fuchsia-500/10",
      accentBorder: "border-violet-500/40",
      highlight: true,
    },
    {
      id: "events",
      title: "Eventos & Torneos",
      tag: "CMS Completo",
      icon: Trophy,
      status: `${state.events?.length || 1} Eventos · ${state.events?.[0]?.infoItems?.length || 6} Casillas Ficha`,
      description: "Edición de torneo principal, banner, 6 casillas técnicas, botones de registro y fases del proceso.",
      actionLabel: "Abrir Editor",
      onAction: () => setActiveTab("events"),
      color: "from-orange-600/20 to-rose-500/10",
      accentBorder: "border-orange-500/40",
      highlight: true,
    },
    {
      id: "competitive",
      title: "Competitivo (Roster UL)",
      tag: "CMS Completo",
      icon: Swords,
      status: `${state.competitiveRoster?.length || 9} Jugadores · ${state.competitiveEvents?.length || 4} Torneos`,
      description: "Alineación de jugadores, 5 redes sociales por ficha, selección de roles y subida directa de avatares a R2.",
      actionLabel: "Abrir Editor",
      onAction: () => setActiveTab("competitive"),
      color: "from-rose-500/20 to-red-500/10",
      accentBorder: "border-rose-500/40",
      highlight: true,
    },
    {
      id: "news",
      title: "Noticias & Anuncios",
      tag: "CMS WordPress",
      icon: Newspaper,
      status: `${state.news?.length || 5} Noticias · Cloudflare CDN`,
      description: "Estructura WordPress: Cabecera, título, subtítulo, texto enriquecido e integración con Cloudflare Images.",
      actionLabel: "Abrir Editor",
      onAction: () => setActiveTab("news"),
      color: "from-purple-500/20 to-indigo-500/10",
      accentBorder: "border-purple-500/40",
      highlight: true,
    },
    {
      id: "allies",
      title: "Nuestros Aliados",
      tag: "CMS Completo",
      icon: Handshake,
      status: `${state.allies?.length || 4} Aliados · Cloudflare R2`,
      description: "Espacios para creadores de contenido, 5 redes sociales por ficha y subida de imágenes a R2.",
      actionLabel: "Abrir Editor",
      onAction: () => setActiveTab("allies"),
      color: "from-emerald-500/20 to-teal-500/10",
      accentBorder: "border-emerald-500/40",
      highlight: true,
    },
    {
      id: "hero",
      title: "Hero (Portada)",
      tag: "CMS Completo",
      icon: Flame,
      status: "Título en 1 línea · Activo",
      description: "Cabecera con fondo cinematográfico, orbes y título Overplay en una sola línea.",
      actionLabel: "Abrir Editor",
      onAction: () => setActiveTab("hero"),
      color: "from-orange-500/20 to-red-500/10",
      accentBorder: "border-orange-500/40",
      highlight: true,
    },
    {
      id: "ticker",
      title: "Display Deslizante (Banner)",
      tag: "CMS Completo",
      icon: Zap,
      status: "Movimiento continuo · Activo",
      description: "Cinta horizontal con loop infinito de titulares y logotipo relámpago.",
      actionLabel: "Abrir Editor",
      onAction: () => setActiveTab("ticker"),
      color: "from-amber-500/20 to-orange-500/10",
      accentBorder: "border-amber-500/40",
      highlight: true,
    },
    {
      id: "cta",
      title: "Recuadro para Participar",
      tag: "CMS Completo",
      icon: Radio,
      status: "Inscripciones activas",
      description: "Tarjeta de conversión inferior para registrar equipos y unirse al Discord.",
      actionLabel: "Abrir Editor",
      onAction: () => setActiveTab("cta"),
      color: "from-orange-500/20 to-amber-500/10",
      accentBorder: "border-orange-500/40",
      highlight: true,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Super Admin Notice: Pending Access Requests */}
      {isSuperAdmin && pendingUsersCount > 0 && onOpenUsersManagement && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold uppercase italic text-white">
                Tienes {pendingUsersCount} {pendingUsersCount === 1 ? "solicitud pendiente" : "solicitudes pendientes"} de acceso
              </h3>
              <p className="text-xs text-amber-200/70">
                Hay colaboradores esperando que apruebes su entrada y asignes sus casillas de edición.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={onOpenUsersManagement}
            className="text-xs whitespace-nowrap"
          >
            <span>Revisar & Aprobar</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Top Banner */}
      <div className="card-surface relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-orange-300">
            <Sparkles className="h-3 w-3" />
            {isSuperAdmin ? "Superadministrador · Pamache" : `Colaborador · ${currentUser?.username || currentUser?.email}`}
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold uppercase italic text-white sm:text-4xl">
            Gestor de Secciones & Contenido
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">
            Bienvenido al Builder de Overplay. Edita las casillas asignadas a tu cuenta, sube fotos a Cloudflare R2 y sincroniza directamente con Supabase.
          </p>
        </div>
      </div>

      {/* Grid of Site Sections */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-bold uppercase italic text-white">
              Secciones & Casillas del Sitio Web
            </h2>
            <p className="text-xs text-white/50">
              {isSuperAdmin
                ? "Tienes acceso total como Superadministrador para editar cualquier casilla."
                : "Puedes editar las casillas autorizadas para tu perfil."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const allowed = hasPermission(sec.id);

            return (
              <div
                key={sec.id}
                className={cn(
                  "card-surface group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300",
                  allowed
                    ? cn(sec.accentBorder, "hover:-translate-y-1 hover:shadow-xl", sec.highlight && "ring-1 ring-orange-500/50")
                    : "border-white/5 bg-white/[0.01] opacity-50 grayscale"
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br transition-opacity",
                    allowed ? cn(sec.color, "opacity-30 group-hover:opacity-60") : "opacity-5"
                  )}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-white/70">
                      {sec.tag}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-bold uppercase italic text-white">
                    {sec.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-1.5 text-xs text-orange-400 font-semibold">
                    {allowed ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{sec.status}</span>
                      </>
                    ) : (
                      <span className="text-white/40 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Casilla no autorizada
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-white/55">
                    {sec.description}
                  </p>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
                  {allowed && sec.onAction && sec.actionLabel ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={sec.onAction}
                      className="w-full text-xs"
                    >
                      <span>{sec.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-white/30 font-medium">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Requiere permiso</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
