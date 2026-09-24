import { useState, useMemo } from "react";
import {
  Mail,
  Eye,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sparkles,
  Send,
  Loader2,
  Crown,
  Shield,
  Swords,
  Heart,
  HelpCircle,
  Settings,
  RefreshCw,
} from "lucide-react";
import { OVERWATCH_RANKS, TournamentRole, CompetitiveRank } from "../../types/tournament";

export function EmailTemplateEditor() {
  // Configuración de Textos del Correo
  const [tournamentName, setTournamentName] = useState("Overplay Tourney 4");
  const [headerBadge, setHeaderBadge] = useState("COMPROBANTE OFICIAL DE INSCRIPCIÓN");
  const [welcomeText, setWelcomeText] = useState(
    "¡Hola {draft_name}! Tu solicitud de inscripción ha sido registrada con éxito."
  );
  const [staffWelcomeText, setStaffWelcomeText] = useState(
    "Se ha recibido un nuevo registro de {draft_name}."
  );
  const [captainBadgeText, setCaptainBadgeText] = useState("👑 POSTULANTE A CAPITÁN DEL TORNEO");
  const [playerBadgeText, setPlayerBadgeText] = useState("🎮 ROL: JUGADOR EN EL DRAFT");
  const [staffBattleTag, setStaffBattleTag] = useState("OVERPLAY#11220");
  const [step1Text, setStep1Text] = useState("Acepta la solicitud de amistad en Battle.net de: ");
  const [step2Text, setStep2Text] = useState(
    "Revisa tus mensajes y solicitudes de amistad en Discord."
  );
  const [step3Text, setStep3Text] = useState(
    "El staff revisará tu perfil de carrera para confirmar tu plaza en el bracket oficial."
  );
  const [footerDisclaimer, setFooterDisclaimer] = useState(
    "Este es un mensaje automático de respaldo. Si no solicitaste esta inscripción, puedes ignorar este correo."
  );
  const [logoUrl, setLogoUrl] = useState(
    "https://pub-def6d9ceb4ef4e8f84ee8a391d2b0b27.r2.dev/branding/Logo_Overplay.png"
  );

  // Mock / Simulador de Datos
  const [mockDraftName, setMockDraftName] = useState("KillerWolf");
  const [mockBattleNet, setMockBattleNet] = useState("KillerWolf#1234");
  const [mockDiscord, setMockDiscord] = useState("killerwolf_ow");
  const [mockEmail, setMockEmail] = useState("jugador@gmail.com");
  const [mockRole, setMockRole] = useState<TournamentRole>("Tanque");
  const [mockHero, setMockHero] = useState("Reinhardt");
  const [mockRankTank, setMockRankTank] = useState<CompetitiveRank>("Master");
  const [mockRankDps, setMockRankDps] = useState<CompetitiveRank>("Diamante");
  const [mockRankSupport, setMockRankSupport] = useState<CompetitiveRank>("Platino");
  const [mockIsCaptain, setMockIsCaptain] = useState(true);
  const [previewMode, setPreviewMode] = useState<"player" | "staff">("player");

  // UI state
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [sendTestStatus, setSendTestStatus] = useState<string | null>(null);

  const getRankImgUrl = (rankName: string) => {
    const found = OVERWATCH_RANKS.find((r) => r.id === rankName);
    return found?.image || "";
  };

  // Generador de HTML en tiempo real
  const generatedHtml = useMemo(() => {
    const isStaff = previewMode === "staff";
    const tankImg = getRankImgUrl(mockRankTank);
    const dpsImg = getRankImgUrl(mockRankDps);
    const supportImg = getRankImgUrl(mockRankSupport);

    const formattedWelcome = isStaff
      ? staffWelcomeText.replace("{draft_name}", `<strong>${mockDraftName}</strong>`)
      : welcomeText.replace("{draft_name}", `<strong>${mockDraftName}</strong>`);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Comprobante de Inscripción — Overplay Tourney</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050508; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #050508; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0b0b12; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.8);">
          
          <!-- Barra Superior Neón -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #f97316 0%, #fbbf24 50%, #8b5cf6 100%);"></td>
          </tr>

          <!-- Cabecera con Logo -->
          <tr>
            <td style="padding: 32px 28px 20px 28px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <img src="${logoUrl}" alt="Overplay Esports" width="60" height="60" style="display: inline-block; margin-bottom: 12px; border-radius: 12px;" />
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; color: #f97316; margin-bottom: 6px;">
                ${isStaff ? "⚡ NUEVA INSCRIPCIÓN RECIBIDA (STAFF)" : headerBadge}
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #ffffff; text-transform: uppercase;">
                ${tournamentName}
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.65); line-height: 1.5;">
                ${formattedWelcome}
              </p>
            </td>
          </tr>

          <!-- Badge Capitán / Jugador -->
          <tr>
            <td style="padding: 20px 28px 10px 28px;">
              <div style="background-color: ${mockIsCaptain ? "rgba(245, 158, 11, 0.12)" : "rgba(249, 115, 22, 0.1)"}; border: 1px solid ${mockIsCaptain ? "rgba(245, 158, 11, 0.4)" : "rgba(249, 115, 22, 0.3)"}; border-radius: 12px; padding: 12px 16px; text-align: center;">
                <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${mockIsCaptain ? "#fbbf24" : "#fdba74"};">
                  ${mockIsCaptain ? captainBadgeText : playerBadgeText}
                </span>
              </div>
            </td>
          </tr>

          <!-- Ficha de Datos del Participante -->
          <tr>
            <td style="padding: 10px 28px 24px 28px;">
              <table role="presentation" width="100%" style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px;">
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: rgba(255, 255, 255, 0.5);">Nombre en Draft:</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-weight: 700; color: #fdba74; text-align: right;">${mockDraftName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: rgba(255, 255, 255, 0.5);">Battle.net Tag:</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-family: monospace; font-weight: 700; color: #fbbf24; text-align: right;">${mockBattleNet}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: rgba(255, 255, 255, 0.5);">Discord ID:</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-family: monospace; font-weight: 700; color: #a5b4fc; text-align: right;">${mockDiscord}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: rgba(255, 255, 255, 0.5);">Correo de Contacto:</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-family: monospace; color: #ffffff; text-align: right;">${mockEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: rgba(255, 255, 255, 0.5);">Rol Preferido:</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-weight: 700; color: #38bdf8; text-align: right;">${mockRole}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-size: 12px; color: rgba(255, 255, 255, 0.5);">Héroe Favorito:</td>
                  <td style="padding: 8px 12px; font-size: 13px; font-weight: 700; color: #f472b6; text-align: right;">${mockHero}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Medallas de Rangos Declarados -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255, 255, 255, 0.6); margin-bottom: 10px;">
                Rangos Declarados por Rol:
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- Tanque -->
                  <td width="32%" style="background-color: rgba(59, 130, 246, 0.06); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 10px; padding: 10px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 800; color: #60a5fa; text-transform: uppercase;">TANQUE</div>
                    ${tankImg ? `<img src="${tankImg}" alt="${mockRankTank}" width="32" height="32" style="display: block; margin: 6px auto;" />` : ""}
                    <div style="font-size: 11px; font-weight: 700; color: #ffffff;">${mockRankTank}</div>
                  </td>
                  <td width="2%"></td>
                  <!-- DPS -->
                  <td width="32%" style="background-color: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px; padding: 10px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 800; color: #f87171; text-transform: uppercase;">DPS</div>
                    ${dpsImg ? `<img src="${dpsImg}" alt="${mockRankDps}" width="32" height="32" style="display: block; margin: 6px auto;" />` : ""}
                    <div style="font-size: 11px; font-weight: 700; color: #ffffff;">${mockRankDps}</div>
                  </td>
                  <td width="2%"></td>
                  <!-- Support -->
                  <td width="32%" style="background-color: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 10px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 800; color: #34d399; text-transform: uppercase;">SUPPORT</div>
                    ${supportImg ? `<img src="${supportImg}" alt="${mockRankSupport}" width="32" height="32" style="display: block; margin: 6px auto;" />` : ""}
                    <div style="font-size: 11px; font-weight: 700; color: #ffffff;">${mockRankSupport}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Próximos Pasos (Solo para el jugador) -->
          ${
            !isStaff
              ? `
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <div style="background-color: #12121e; border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 12px; padding: 16px 20px;">
                <div style="font-size: 13px; font-weight: 800; color: #f97316; margin-bottom: 8px;">
                  📌 PRÓXIMOS PASOS IMPORTANTES:
                </div>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: rgba(255, 255, 255, 0.8); line-height: 1.6;">
                  <li>${step1Text}<strong style="color: #fbbf24; font-family: monospace;">${staffBattleTag}</strong></li>
                  <li>${step2Text}</li>
                  <li>${step3Text}</li>
                </ul>
              </div>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background-color: #07070b; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
              <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.45);">
                © ${new Date().getFullYear()} <strong>Overplay Esports</strong>. Todos los derechos reservados.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: rgba(255, 255, 255, 0.3);">
                ${footerDisclaimer}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }, [
    tournamentName,
    headerBadge,
    welcomeText,
    staffWelcomeText,
    captainBadgeText,
    playerBadgeText,
    staffBattleTag,
    step1Text,
    step2Text,
    step3Text,
    footerDisclaimer,
    logoUrl,
    mockDraftName,
    mockBattleNet,
    mockDiscord,
    mockEmail,
    mockRole,
    mockHero,
    mockRankTank,
    mockRankDps,
    mockRankSupport,
    mockIsCaptain,
    previewMode,
  ]);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([generatedHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `plantilla-correo-overplay-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenPreviewTab = () => {
    const blob = new Blob([generatedHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              CMS de Notificaciones
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            Editor de Plantilla de Correo
          </h1>
          <p className="mt-1 text-xs text-white/60 sm:text-sm">
            Personaliza los textos, insignias, BattleTag del staff e instrucciones del comprobante que reciben los jugadores por Gmail.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyHtml}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95"
          >
            {copiedHtml ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300">¡HTML Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-orange-400" />
                <span>Copiar HTML</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadHtml}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95"
            title="Descargar archivo HTML para pruebas"
          >
            <Download className="h-4 w-4 text-amber-400" />
            <span>Descargar HTML</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPreviewTab}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Abrir en Pestaña</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Editor Izquierda / Vista Previa Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO: CONTROLES Y FORMULARIO (5 columnas) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Selector de Modo de Vista */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">
              Modo de Vista Previa:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode("player")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                  previewMode === "player"
                    ? "border-orange-500 bg-orange-500/20 text-orange-300"
                    : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <span>👤 Vista del Jugador</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("staff")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                  previewMode === "staff"
                    ? "border-amber-500 bg-amber-500/20 text-amber-300"
                    : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <span>⚡ Copia para el Staff</span>
              </button>
            </div>
          </div>

          {/* 1. TEXTOS PRINCIPALES */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <Settings className="h-4 w-4" /> Textos Principales
            </h3>

            <div>
              <label className="block text-xs font-medium text-white/70">Nombre del Torneo:</label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70">Etiqueta Superior:</label>
              <input
                type="text"
                value={headerBadge}
                onChange={(e) => setHeaderBadge(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70">
                Mensaje de Bienvenida al Jugador:
              </label>
              <textarea
                rows={2}
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none resize-none"
              />
              <span className="text-[10px] text-white/40">* Usa {"{draft_name}"} para el nombre del jugador.</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70">BattleTag Oficial del Staff:</label>
              <input
                type="text"
                value={staffBattleTag}
                onChange={(e) => setStaffBattleTag(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 font-mono text-xs text-amber-300 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. INSTRUCCIONES / PRÓXIMOS PASOS */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <Sparkles className="h-4 w-4" /> Instrucciones para el Jugador
            </h3>

            <div>
              <label className="block text-xs font-medium text-white/70">Paso 1 (Battle.net):</label>
              <input
                type="text"
                value={step1Text}
                onChange={(e) => setStep1Text(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70">Paso 2 (Discord):</label>
              <input
                type="text"
                value={step2Text}
                onChange={(e) => setStep2Text(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70">Paso 3 (Perfil de Carrera):</label>
              <input
                type="text"
                value={step3Text}
                onChange={(e) => setStep3Text(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. SIMULADOR DE DATOS (MOCK) */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <RefreshCw className="h-4 w-4" /> Simulador de Datos de Prueba
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/60">Nombre Draft:</label>
                <input
                  type="text"
                  value={mockDraftName}
                  onChange={(e) => setMockDraftName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-white/60">BattleTag:</label>
                <input
                  type="text"
                  value={mockBattleNet}
                  onChange={(e) => setMockBattleNet(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-white/60">Rol Preferido:</label>
                <select
                  value={mockRole}
                  onChange={(e) => setMockRole(e.target.value as TournamentRole)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0e0e13] px-3 py-1.5 text-xs text-white"
                >
                  <option value="Tanque">Tanque</option>
                  <option value="DPS">DPS</option>
                  <option value="Support">Support</option>
                  <option value="Todos los Roles">Todos los Roles</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-white/60">¿Es Capitán?:</label>
                <button
                  type="button"
                  onClick={() => setMockIsCaptain(!mockIsCaptain)}
                  className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    mockIsCaptain
                      ? "border-amber-500 bg-amber-500/20 text-amber-300"
                      : "border-white/10 bg-white/5 text-white/50"
                  }`}
                >
                  <Crown className="h-3.5 w-3.5" />
                  <span>{mockIsCaptain ? "SÍ (Capitán)" : "NO (Jugador)"}</span>
                </button>
              </div>
            </div>

            {/* Rangos */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="block text-[11px] text-blue-400 font-bold">Tanque:</label>
                <select
                  value={mockRankTank}
                  onChange={(e) => setMockRankTank(e.target.value as CompetitiveRank)}
                  className="mt-1 w-full rounded border border-white/10 bg-[#0e0e13] p-1 text-[11px] text-white"
                >
                  {OVERWATCH_RANKS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-red-400 font-bold">DPS:</label>
                <select
                  value={mockRankDps}
                  onChange={(e) => setMockRankDps(e.target.value as CompetitiveRank)}
                  className="mt-1 w-full rounded border border-white/10 bg-[#0e0e13] p-1 text-[11px] text-white"
                >
                  {OVERWATCH_RANKS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-emerald-400 font-bold">Support:</label>
                <select
                  value={mockRankSupport}
                  onChange={(e) => setMockRankSupport(e.target.value as CompetitiveRank)}
                  className="mt-1 w-full rounded border border-white/10 bg-[#0e0e13] p-1 text-[11px] text-white"
                >
                  {OVERWATCH_RANKS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: VISTA PREVIA INTERACTIVA EN VIVO (7 columnas) */}
        <div className="lg:col-span-7">
          <div className="sticky top-20 rounded-2xl border border-white/10 bg-[#0b0b12] p-4 shadow-2xl">
            
            {/* Barra Superior estilo Cliente de Correo */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-bold text-white/70 ml-2">
                  Previsualización en Vivo (Email HTML)
                </span>
              </div>

              <span className="text-[11px] font-mono text-white/40">
                {previewMode === "player" ? "Remitente: overplaypage@gmail.com" : "Copia Staff"}
              </span>
            </div>

            {/* Iframe Interactivo con el HTML generado */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#050508] shadow-inner">
              <iframe
                title="Vista previa del correo"
                srcDoc={generatedHtml}
                className="h-[680px] w-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
