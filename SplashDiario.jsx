const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useCallback, useEffect, useRef, useState } from "react";

const VIDEO =
  "https://media.db.com/videos/public/6a96c1bc1e3242900d4cf54d/09f77a2ea_Entadadoappaposocliquenoiconedatela.mp4";

// Vídeo de abertura exibido logo após o login.
export default function SplashDiario({ onDone }) {
  const [saindo, setSaindo] = useState(false);
  const fim = useRef(false);
  const videoRef = useRef(null);

  const encerrar = useCallback(() => {
    if (fim.current) return;
    fim.current = true;
    setSaindo(true);
    setTimeout(() => onDone?.(), 450);
  }, [onDone]);

  // Tenta reproduzir com som; se o navegador bloquear, reproduz mudo.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && p.catch) {
      p.catch(() => {
        v.muted = true;
        const p2 = v.play();
        if (p2 && p2.catch) p2.catch(() => encerrar());
      });
    }
  }, [encerrar]);

  // Segurança: não deixa o vídeo travar a navegação.
  useEffect(() => {
    const t = setTimeout(encerrar, 25000);
    return () => clearTimeout(t);
  }, [encerrar]);

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 overflow-hidden bg-black transition-opacity duration-500 ${
        saindo ? "opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        src={VIDEO}
        className="h-full w-full object-contain"
        playsInline
        onEnded={encerrar}
        onError={encerrar}
      />
      <button
        type="button"
        onClick={encerrar}
        className="absolute right-4 top-4 rounded-lg border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white"
      >
        Pular
      </button>
    </div>
  );
}