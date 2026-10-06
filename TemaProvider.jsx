const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

import { hslChannels, textoEscuro } from "@/lib/tema-utils";
import { WallpaperLayer } from "@/components/WallpaperLayer";

const TemaContext = createContext(null);
const PADRAO = { modo: "automatico", cor: null, imagem_url: null };

function resolverEscuro(modo, osEscuro) {
  if (modo === "claro") return false;
  if (modo === "escuro") return true;
  return osEscuro;
}

async function carregarPreferencia() {
  try {
    const lista = await db.entities.PreferenciaTema.filter({}, "-updated_date", 1);
    const r = (lista && lista[0]) || null;
    if (!r) return { tema: PADRAO, id: null };
    return {
      tema: { modo: r.modo || "automatico", cor: r.cor || null, imagem_url: r.imagem_url || null },
      id: r.id,
    };
  } catch {
    return { tema: PADRAO, id: null };
  }
}

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(PADRAO);
  const [id, setId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pronto, setPronto] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const [osEscuro, setOsEscuro] = useState(true);
  const mountedRef = useRef(true);

  // Acompanha a preferência claro/escuro do sistema (para o modo "automático").
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setOsEscuro(mq.matches);
    const handler = (e) => setOsEscuro(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const aplicar = useCallback((t) => {
    const root = document.documentElement;
    const ativo = t || PADRAO;
    if (ativo.imagem_url) {
      root.style.setProperty("--background", "transparent");
      root.style.setProperty("--foreground", "40 41% 92%");
      root.style.setProperty("--muted-foreground", "218 14% 61%");
      setImgUrl(ativo.imagem_url);
      return;
    }
    setImgUrl(null);
    if (ativo.cor) {
      root.style.setProperty("--background", hslChannels(ativo.cor));
      const esc = textoEscuro(ativo.cor);
      root.style.setProperty("--foreground", esc ? "219 54% 8%" : "40 41% 92%");
      root.style.setProperty("--muted-foreground", esc ? "218 25% 26%" : "218 14% 61%");
      return;
    }
    // Modo base (automático/claro/escuro) quando não há cor nem papel de parede.
    const esc = resolverEscuro(ativo.modo, osEscuro);
    if (esc) {
      root.style.setProperty("--background", "219 54% 8%");
      root.style.setProperty("--foreground", "40 41% 92%");
      root.style.setProperty("--muted-foreground", "218 14% 61%");
    } else {
      root.style.setProperty("--background", "210 40% 96%");
      root.style.setProperty("--foreground", "219 54% 10%");
      root.style.setProperty("--muted-foreground", "219 16% 35%");
    }
  }, [osEscuro]);

  useEffect(() => {
    mountedRef.current = true;
    db.auth.isAuthenticated().then(async (ok) => {
      if (!mountedRef.current) return;
      if (!ok) { setPronto(true); return; }
      const { tema: t, id: rid } = await carregarPreferencia();
      if (!mountedRef.current) return;
      setTema(t); setId(rid); setPronto(true);
    }).catch(() => { if (mountedRef.current) setPronto(true); });
    return () => { mountedRef.current = false; };
  }, []);

  const ativo = preview ?? tema;
  useEffect(() => { if (pronto) aplicar(ativo); }, [ativo, aplicar, pronto]);

  const salvar = useCallback(async (novo) => {
    setPreview(null);
    let salvoId = id;
    try {
      if (id) { await db.entities.PreferenciaTema.update(id, novo); }
      else { const cri = await db.entities.PreferenciaTema.create(novo); salvoId = cri.id; setId(cri.id); }
      setTema(novo);
    } catch (e) { throw e; }
    return salvoId;
  }, [id]);

  const cancelar = useCallback(() => setPreview(null), []);
  const restaurar = useCallback(async () => {
    setPreview(null);
    if (id) { try { await db.entities.PreferenciaTema.delete(id); } catch {} }
    setId(null); setTema(PADRAO);
  }, [id]);

  const definir = useCallback((t) => setPreview(t), []);

  return (
    <TemaContext.Provider value={{ tema, preview, ativo, definir, setPreview, salvar, cancelar, restaurar, pronto }}>
      <WallpaperLayer url={imgUrl} />
      {children}
    </TemaContext.Provider>
  );
}

export const useTema = () => useContext(TemaContext);