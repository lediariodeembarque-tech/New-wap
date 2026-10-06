const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useRef, useState } from "react";

import { Image } from "@/components/ui/image";
import { TicketButton } from "@/components/TicketButton";
import { Download, Loader2 } from "lucide-react";

function bytesFmt(n) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function urlAssinada(anexo_uri) {
  const res = await db.functions.invoke("GerarUrlAnexo", { anexo_uri });
  return res?.signed_url || res?.data?.signed_url;
}

function AnexoImagem({ anexo_uri, anexo_nome }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErro(false);
    urlAssinada(anexo_uri)
      .then((u) => { if (alive) setUrl(u || null); if (!u) setErro(true); })
      .catch(() => { if (alive) setErro(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [anexo_uri]);

  if (loading) {
    return (
      <div className="mt-2 flex h-28 w-40 items-center justify-center rounded-lg bg-black/20">
        <Loader2 size={18} className="animate-spin text-slate-300" />
      </div>
    );
  }
  if (erro || !url) {
    return <span className="mt-2 block text-xs text-red-300">Falha ao carregar imagem</span>;
  }
  return (
    <button type="button" onClick={() => window.open(url, "_blank")} className="mt-2 block">
      <div className="h-28 w-40 overflow-hidden rounded-lg border border-white/20">
        <Image src={url} alt={anexo_nome || "imagem"} fittingType="fill" className="h-full w-full" />
      </div>
    </button>
  );
}

function AnexoArquivo({ msg, meu }) {
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef(null);

  const baixar = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let u = cacheRef.current;
      if (!u) { u = await urlAssinada(msg.anexo_uri); cacheRef.current = u; }
      if (u) window.open(u, "_blank");
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 flex flex-col items-start gap-1">
      <TicketButton onClick={baixar} disabled={loading} icon={Download} tone={meu ? "dark" : "amber"} type="button" className="!text-xs">
        {loading ? "Preparando…" : (msg.anexo_nome || "anexo")}
      </TicketButton>
      <span className="px-1 text-[10px] text-slate-400">{bytesFmt(msg.anexo_tamanho)}</span>
    </div>
  );
}

export function AnexoMensagem({ msg, meu }) {
  if (!msg?.anexo_uri) return null;
  const isImage = (msg.anexo_tipo || "").startsWith("image/");
  return isImage
    ? <AnexoImagem anexo_uri={msg.anexo_uri} anexo_nome={msg.anexo_nome} />
    : <AnexoArquivo msg={msg} meu={meu} />;
}

export default AnexoMensagem;