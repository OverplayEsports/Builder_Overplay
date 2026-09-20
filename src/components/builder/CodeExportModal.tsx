import { useState } from "react";
import { Check, Copy, Download, FileCode, X } from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { Button } from "../ui/Button";

export function CodeExportModal({ onClose }: { onClose: () => void }) {
  const { generateTeamTSCode, exportToJSON } = useBuilder();
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<"ts" | "json">("ts");

  const tsCode = generateTeamTSCode();
  const jsonCode = exportToJSON();
  const currentCode = activeView === "ts" ? tsCode : jsonCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeView === "ts" ? "team.ts" : "overplay-data.json";
    const mime = activeView === "ts" ? "text/typescript" : "application/json";
    const blob = new Blob([currentCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="card-surface relative my-auto flex max-h-[calc(100vh-6rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-400">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold uppercase italic text-white">
                Exportar Código & Sincronización
              </h3>
              <p className="text-xs text-white/50">
                Pega este código directamente en tu archivo <code className="text-orange-400">src/data/team.ts</code> de Overplay 2.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-4 flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveView("ts")}
            className={`rounded-xl px-3.5 py-1.5 font-display text-xs font-bold uppercase tracking-wider cursor-pointer ${
              activeView === "ts"
                ? "bg-brand-gradient text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            TypeScript (team.ts)
          </button>
          <button
            onClick={() => setActiveView("json")}
            className={`rounded-xl px-3.5 py-1.5 font-display text-xs font-bold uppercase tracking-wider cursor-pointer ${
              activeView === "json"
                ? "bg-brand-gradient text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            JSON Completo
          </button>
        </div>

        {/* Code View Area */}
        <div className="mt-4 relative">
          <pre className="max-h-[50vh] overflow-auto rounded-2xl border border-white/10 bg-black/70 p-4 font-mono text-xs text-orange-200/90 leading-relaxed">
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="text-xs text-white/40">
            Los cambios se guardan automáticamente en tu almacenamiento local.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Descargar {activeView === "ts" ? "team.ts" : "data.json"}
            </Button>
            <Button size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "¡Copiado al Portapapeles!" : "Copiar Código"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
