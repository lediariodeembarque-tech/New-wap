const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane } from "lucide-react";

import { SplitFlap } from "@/components/SplitFlap";
import { TicketButton } from "@/components/TicketButton";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    db.auth.isAuthenticated().then((ok) => {
      if (ok) navigate("/diario", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-400 shadow-2xl shadow-amber-400/20">
          <Plane size={40} className="text-slate-900" />
        </div>
        <SplitFlap text="DIÁRIO DE EMBARQUE" className="text-xl sm:text-3xl mb-4" />
        <p className="mt-3 max-w-sm text-sm text-muted-foreground font-body">
          Registro de embarques do dia no aeroporto: itinerário, controle de voos, fotos e relatório em PDF.
        </p>
        <div className="mt-8">
          <TicketButton onClick={() => navigate("/login")}>
            Entrar ou criar conta
          </TicketButton>
        </div>
      </div>
      <hr className="dashed-amber mx-6" />
      <footer className="px-6 py-6 text-center text-xs text-muted-foreground font-body">
        Salvo automaticamente · Sincronizado com a nuvem
      </footer>
    </div>
  );
}