import React, { useState } from "react";
import { CampoCodigo } from "@/components/CampoCodigo";

// Consulta rápida de código de atraso na primeira tela (não grava no dia).
export function ConsultaCodigo() {
  const [codigo, setCodigo] = useState("");
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-bold tracking-widest text-amber-400 uppercase font-display">
        Consulta de código de atraso
      </div>
      <CampoCodigo value={codigo} onChange={setCodigo} />
    </div>
  );
}

export default ConsultaCodigo;