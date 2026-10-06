import React from "react";
import { PERFIS } from "@/lib/perfil";

// Escolha do perfil de acesso na tela de login.
export default function SeletorPerfil({ valor, onChange }) {
  const atual = PERFIS.find((p) => p.id === valor);

  return (
    <div className="mb-5">
      <span className="label-strip text-amber-400">Perfil de acesso</span>
      <div className="grid grid-cols-3 gap-2">
        {PERFIS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={`rounded-lg border px-2 py-2 text-center transition ${
              valor === p.id
                ? "border-primary bg-primary/15 text-amber-400"
                : "border-border text-amber-300/80 hover:border-primary/40"
            }`}
          >
            <span className="font-display text-sm font-bold tracking-wide">{p.nome}</span>
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-amber-300">{atual?.descricao}</p>
    </div>
  );
}