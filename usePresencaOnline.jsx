const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState, useCallback } from "react";

const ONLINE_JANELA = 60 * 1000; // 60s

// Indica se existe algum OUTRO usuário online, usando o mesmo sistema de
// presença (PresencaChat) já utilizado no chat.
export function usePresencaOnline(meuId) {
  const [presencas, setPresencas] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const pres = await db.entities.PresencaChat.list("-updated_date", 100);
      setPresencas(pres || []);
    } catch {}
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    const unsub = db.entities.PresencaChat.subscribe((event) => {
      setPresencas((prev) => {
        if (event.type === "delete") return prev.filter((p) => p.id !== event.data?.id);
        const idx = prev.findIndex((p) => p.id === event.data?.id);
        if (event.type === "create") return [event.data, ...prev];
        if (event.type === "update") {
          const n = [...prev];
          if (idx >= 0) n[idx] = event.data; else n.unshift(event.data);
          return n;
        }
        return prev;
      });
    });
    return () => unsub && unsub();
  }, []);

  return presencas.some((p) =>
    p.created_by_id !== meuId &&
    p.ultima_vez && Date.now() - new Date(p.ultima_vez).getTime() < ONLINE_JANELA
  );
}

export default usePresencaOnline;