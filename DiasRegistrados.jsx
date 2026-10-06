import React, { useEffect, useMemo, useState } from "react";
import { Cloud, CloudOff, Trash2 } from "lucide-react";

function rotuloMes(chave) {
  if (!chave) return "Sem data";
  return new Date(`${chave}-01T00:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function DiasRegistrados({ dias = [], carregando, onSelecionar, onExcluir, readOnly = false }) {
  const meses = useMemo(() => {
    const acc = {};
    dias.forEach((d) => {
      const chave = (d.data || "").slice(0, 7); // AAAA-MM
      (acc[chave] ||= []).push(d);
    });
    return Object.entries(acc).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [dias]);

  const [mesSel, setMesSel] = useState(null);

  useEffect(() => {
    if (meses.length && !meses.some(([m]) => m === mesSel)) setMesSel(meses[0][0]);
  }, [meses, mesSel]);

  if (carregando) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  if (!dias.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
        Nenhum dia registrado ainda.
      </div>
    );
  }

  const lista = meses.find(([m]) => m === mesSel)?.[1] || [];

  return (
    <div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {meses.map(([mes, ls]) => (
          <button
            key={mes}
            onClick={() => setMesSel(mes)}
            className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize ${
              mes === mesSel ? "border-amber-400 bg-amber-400/10 text-amber-300" : "border-white/10 text-slate-400"
            }`}
          >
            {rotuloMes(mes)} · {ls.length}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {lista.map((d) => (
          <div key={d.data} className="flex items-center gap-3 painel rounded-xl p-3">
            <button onClick={() => onSelecionar(d.data)} className="flex-1 text-left">
              <div className="font-display font-bold tracking-wide text-slate-100 font-mono">{d.data}</div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{[d.pda, d.mochila, d.radio, d.dws].filter(Boolean).length || 0} recursos</span>
                <span>{d.voos?.length || 0} voos</span>
                <span className="flex items-center gap-1">
                  {d.id ? <Cloud size={11} className="text-amber-400" /> : <CloudOff size={11} className="text-muted-foreground" />}
                  {d.id ? "Nuvem" : "Aparelho"}
                </span>
              </div>
            </button>
            {!readOnly && (
              <button onClick={() => onExcluir(d)} className="rounded-lg p-2 text-red-400">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiasRegistrados;