import React from "react";

export default function KpiCard({ titulo, valor, cor }) {
  return (
    <div className="painel rounded-2xl p-4">
      <div className="label-strip">{titulo}</div>
      <div className="font-display text-3xl font-bold leading-tight" style={{ color: cor }}>
        {valor}
      </div>
    </div>
  );
}