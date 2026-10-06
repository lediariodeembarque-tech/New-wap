import { useEffect, useRef } from "react";
import { agendarAlerta, cancelarAlerta } from "@/lib/alertas";

// Mantém os alertas locais sincronizados com os voos do dia atual:
// - agenda/reagenda quando um voo ganha (ou troca) horário
// - cancela quando o voo perde o horário ou é removido
export function useAlertasEmbarque(dia) {
  const prevIds = useRef(new Set());

  useEffect(() => {
    const voos = dia?.voos || [];
    const curIds = new Set(voos.map((v) => v.id));

    voos.forEach((v) => {
      if (v.horario) agendarAlerta(v);
      else cancelarAlerta(v.id);
    });

    prevIds.current.forEach((id) => {
      if (!curIds.has(id)) cancelarAlerta(id);
    });

    prevIds.current = curIds;
  }, [dia?.voos]);
}

export default useAlertasEmbarque;