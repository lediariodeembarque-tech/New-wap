import React from "react";

export function StatusLuz({ estado, className = "" }) {
  // estado: "nao_iniciado" | "em_andamento" | "concluido"
  const cls = estado === "concluido" ? "green" : estado === "em_andamento" ? "amber" : "red";
  return <span className={`status-luz ${cls} ${className}`} />;
}

export default StatusLuz;