import { useState } from "react";
import {
  Zap,
  Sparkles,
  Save,
  CheckCircle2,
  Code2,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Sliders,
} from "lucide-react";
import { useBuilder } from "../../context/BuilderContext";
import { Button } from "../ui/Button";
import { supabase } from "../../lib/supabase";
import { DEFAULT_TICKER_CONFIG } from "../../data/initialData";
import type { TickerConfig } from "../../types/builder";

export function TickerEditor() {
  const { state } = useBuilder();
  const [tickerConfig, setTickerConfig] = useState<TickerConfig>(
    state.tickerConfig || DEFAULT_TICKER_CONFIG
  );

  const [newItemText, setNewItemText] = useState("");
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setTickerConfig((prev) => ({
      ...prev,
      items: [...prev.items, newItemText.trim()],
    }));
    setNewItemText("");
  };

  const handleUpdateItem = (index: number, text: string) => {
    setTickerConfig((prev) => {
      const items = [...prev.items];
      items[index] = text;
      return { ...prev, items };
    });
  };

  const handleRemoveItem = (index: number) => {
    setTickerConfig((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tickerConfig.items.length) return;

    setTickerConfig((prev) => {
      const items = [...prev.items];
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return { ...prev, items };
    });
  };

  const handleSaveToSupabase = async () => {
    setIsSavingSupabase(true);
    setSyncError(null);

    try {
      const payload = {
        ticker: tickerConfig,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase.from("team_groups").upsert({
        id: "config_ticker",
        title: "Configuración de Display Deslizante (Banner)",
        description: JSON.stringify(payload),
        accent: "ember",
        order_index: 994,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error al sincronizar con Supabase:", err);
      setSyncError(`Error al guardar en Supabase: ${err.message || "Revisa las credenciales"}`);
    } finally {
      setIsSavingSupabase(false);
    }
  };

  const generateSqlScript = () => {
    const payload = JSON.stringify({
      ticker: tickerConfig,
    }).replace(/'/g, "''");

    return `-- =========================================================
-- SQL PARA SUPABASE: SECCIÓN DISPLAY DESLIZANTE (BANNER)
-- =========================================================

INSERT INTO public.team_groups (id, title, description, accent, order_index, updated_at)
VALUES (
  'config_ticker',
  'Configuración de Display Deslizante (Banner)',
  '${payload}',
  'ember',
  994,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  accent = EXCLUDED.accent,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();
`;
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(generateSqlScript());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const repeatedItems = [...tickerConfig.items, ...tickerConfig.items];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              Cinta Horizontal · Loop Continuo
            </p>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">
            Editor de <span className="text-brand-gradient">Display Deslizante</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Gestiona los titulares, frases y textos que se desplazan de manera continua e infinita en la cinta de la web.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-2"
          >
            <Code2 className="h-4 w-4" />
            <span>Generar SQL</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSaveToSupabase}
            disabled={isSavingSupabase}
            className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider"
          >
            {isSavingSupabase ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : syncSuccess ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{syncSuccess ? "¡Guardado!" : "Guardar en Supabase"}</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {syncSuccess && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>El Display Deslizante se ha actualizado en Supabase y sincronizado en vivo.</span>
        </div>
      )}

      {syncError && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {syncError}
        </div>
      )}

      {/* Marquee Visual Preview */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-400" />
            Vista Previa de la Cinta en Movimiento
          </h2>
        </div>

        <div className="relative select-none overflow-hidden rounded-2xl border border-white/10 bg-[#08080a] py-5 shadow-2xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#08080a] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#08080a] to-transparent" />

          <div className="flex w-max animate-marquee">
            {repeatedItems.map((item, idx) => (
              <span
                key={`${idx}-${item}`}
                className="flex items-center gap-6 pr-6 font-display text-sm font-semibold uppercase tracking-[0.3em] text-white/80"
              >
                <span>{item}</span>
                <Zap className="h-3.5 w-3.5 shrink-0 fill-orange-500 text-orange-500" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Item Management List */}
      <div className="mt-8 max-w-3xl space-y-6">
        <div className="card-surface rounded-3xl border border-white/10 p-6 space-y-5">
          <h2 className="font-display text-base font-bold uppercase italic text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Sliders className="h-4 w-4 text-amber-400" />
            Titulares y Frases Activas ({tickerConfig.items.length})
          </h2>

          {/* Add New Phrase Form */}
          <form onSubmit={handleAddItem} className="flex gap-2">
            <input
              type="text"
              required
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Ej. Torneo en vivo este fin de semana..."
              className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none placeholder-white/30"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!newItemText.trim()}
              className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider"
            >
              <Plus className="h-4 w-4" />
              <span>Añadir</span>
            </Button>
          </form>

          {/* List */}
          <div className="space-y-2.5">
            {tickerConfig.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 transition-all hover:border-white/20"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 font-display text-xs font-bold">
                  {index + 1}
                </span>

                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleUpdateItem(index, e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveItem(index, "up")}
                    className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === tickerConfig.items.length - 1}
                    onClick={() => handleMoveItem(index, "down")}
                    className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SQL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-[#0e0e14] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display text-lg font-bold uppercase italic text-white">
                SQL: Sección Display Deslizante
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
                {generateSqlScript()}
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
