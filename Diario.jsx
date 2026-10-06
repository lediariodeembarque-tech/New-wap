const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState, useCallback, useRef } from "react";

import { useNavigate } from "react-router-dom";
import { LogOut, Plus, Calendar, Trash2, MessageCircle, Settings } from "lucide-react";
import { CampoLinha } from "@/components/CampoLinha";
import { SeletorLinha } from "@/components/SeletorLinha";
import { CartaoVoo } from "@/components/CartaoVoo";
import { TicketButton } from "@/components/TicketButton";
import { Divider } from "@/components/Divider";
import { useSync } from "@/components/SyncProvider";
import { IndicadorSync } from "@/components/IndicadorSync";
import { useAlertasEmbarque } from "@/hooks/useAlertasEmbarque";
import { SugestaoGru } from "@/components/SugestaoGru";
import { BuscaVooGru } from "@/components/BuscaVooGru";
import SplashDiario from "@/components/SplashDiario";
import { usePresencaOnline } from "@/hooks/usePresencaOnline";
import { DiasRegistrados } from "@/components/DiasRegistrados";
import { ConsultaCodigo } from "@/components/ConsultaCodigo";
import { getPerfil } from "@/lib/perfil";

const uid = () => Math.random().toString(36).slice(2, 10);

const diaVazio = (data) => ({
  data,
  pda: "", mochila: "", radio: "", dws: "",
  itinerario: [],
  observacoes: "",
  voos: [],
});

export default function Diario() {
  const navigate = useNavigate();
  const hoje = new Date().toISOString().slice(0, 10);
  const [dataSel, setDataSel] = useState(hoje);
  const [dia, setDia] = useState(diaVazio(hoje));
  const [dias, setDias] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvoLocal, setSalvoLocal] = useState(false);
  const [me, setMe] = useState(null);
  const diasRef = useRef([]);
  const initRef = useRef(false);
  const { salvarDia, pendentes, removerPendente } = useSync();
  const [splash, setSplash] = useState(true);
  const [perfil] = useState(() => getPerfil());
  const somenteLeitura = perfil === "hcc";
  const algumOnline = usePresencaOnline(me?.id);

  useAlertasEmbarque(dia);

  useEffect(() => { db.auth.me().then(setMe).catch(() => {}); }, []);

  useEffect(() => { diasRef.current = dias; }, [dias]);

  const popularDia = useCallback((data) => {
    const existente = diasRef.current.find((d) => d.data === data);
    if (existente) {
      const { data: dd, pda, mochila, radio, dws, itinerario, observacoes, voos } = existente;
      setDia({ data: dd, pda: pda || "", mochila: mochila || "", radio: radio || "", dws: dws || "", itinerario: itinerario || [], observacoes: observacoes || "", voos: voos || [] });
    } else {
      setDia(diaVazio(data));
    }
    setSalvoLocal(false);
  }, []);

  const carregarDias = useCallback(async () => {
    setCarregando(true);
    const extras = (pendentes || []).map((p) => p.dia);
    try {
      const lista = await db.entities.DiaEmbarque.list("-updated_date", 200);
      const datasNuvem = new Set((lista || []).map((d) => d.data));
      setDias([...(lista || []), ...extras.filter((d) => !datasNuvem.has(d.data))]);
    } catch (e) {
      setDias(extras);
    } finally {
      setCarregando(false);
    }
  }, [pendentes]);

  useEffect(() => { carregarDias(); }, [carregarDias]);

  useEffect(() => { popularDia(dataSel); }, [dataSel, popularDia]);

  useEffect(() => {
    if (!carregando && !initRef.current) {
      initRef.current = true;
      popularDia(dataSel);
    }
  }, [carregando, popularDia, dataSel]);

  // Salvamento automático (debounce ~800ms) — passa pelo SyncProvider
  useEffect(() => {
    if (somenteLeitura || !dia.data) return;
    const t = setTimeout(async () => {
      const temConteudo = dia.itinerario.length || dia.voos.length || dia.observacoes || dia.pda || dia.mochila || dia.radio || dia.dws;
      if (!temConteudo) return;
      setSalvando(true);
      const existente = diasRef.current.find((d) => d.data === dia.data);
      const salvo = await salvarDia(dia, existente?.id);
      if (salvo && !existente?.id) {
        setDias((prev) => [salvo, ...prev.filter((d) => d.id !== salvo.id)]);
      }
      setSalvando(false);
    }, 800);
    return () => clearTimeout(t);
  }, [dia, salvarDia, somenteLeitura]);

  const setDiaField = (campo, valor) => setDia((p) => ({ ...p, [campo]: valor }));

  const addLinhaItinerario = () => setDiaField("itinerario", [...dia.itinerario, { id: uid(), voo: "", destino: "", horario: "", agente: "" }]);
  const updLinha = (id, campo, valor) => setDiaField("itinerario", dia.itinerario.map((l) => l.id === id ? { ...l, [campo]: valor } : l));
  const rmLinha = (id) => setDiaField("itinerario", dia.itinerario.filter((l) => l.id !== id));

  const addVoo = () => setDiaField("voos", [...dia.voos, { id: uid(), voo: "", destino: "", horario: "", fotos: [] }]);
  const usarDadosVoo = (d) => {
    const novo = { id: uid(), voo: d.voo || "", destino: d.destino || "", horario: d.horario || "", porta: d.porta || "", fotos: [] };
    setDiaField("voos", [...dia.voos, novo]);
  };
  const updVoo = (id, voo) => setDiaField("voos", dia.voos.map((v) => v.id === id ? voo : v));
  const rmVoo = (id) => setDiaField("voos", dia.voos.filter((v) => v.id !== id));

  const excluirDia = async (d) => {
    if (!confirm(`Excluir o dia ${d.data}?`)) return;
    if (d.id) { try { await db.entities.DiaEmbarque.delete(d.id); } catch (e) {} }
    removerPendente?.(d.data);
    setDias((prev) => prev.filter((x) => x.data !== d.data));
    if (d.data === dataSel) setDia(diaVazio(d.data));
  };

  const sair = async () => {
    await db.auth.logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-slate-100">
      {splash && <SplashDiario onDone={() => setSplash(false)} />}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-secondary/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <img
              src="https://media.db.com/images/public/6a96c1bc1e3242900d4cf54d/b5b4a6c23_diario-de-embarque-icone.jpg"
              alt="Diário de Embarque"
              className="h-11 w-auto max-w-[200px] rounded-md object-contain"
            />
          </div>
          <button onClick={() => navigate("/personalizar")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300" title="Personalizar">
            <Settings size={14} />
          </button>
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => navigate("/chat")}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                algumOnline ? "border-green-500/50 text-green-400" : "border-white/10 text-slate-300"
              }`}>
              <MessageCircle size={14} className={algumOnline ? "text-green-400" : ""} /> Chat
            </button>
            <IndicadorSync />
          </div>
          {me?.role === "admin" && (
            <button onClick={() => navigate("/admin")}
              className="rounded-lg border border-amber-400/40 px-3 py-2 text-xs font-semibold text-amber-300">
              Admin
            </button>
          )}
          {perfil === "admin" && me?.role !== "admin" && (
            <button onClick={() => navigate("/dashboard")}
              className="rounded-lg border border-amber-400/40 px-3 py-2 text-xs font-semibold text-amber-300">
              Painel
            </button>
          )}
          <button onClick={sair} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-5 pb-20">
        <section className="painel rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-amber-400" />
            <input type="date" value={dataSel} onChange={(e) => setDataSel(e.target.value)}
              className="bg-transparent font-display text-base font-bold tracking-wide text-slate-100 outline-none" />
            <span className="ml-auto rounded-lg bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
              {me?.full_name || me?.email || ""}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <CampoLinha label="PDA" value={dia.pda} onChange={(v) => setDiaField("pda", v)} mono readOnly={somenteLeitura} />
            <CampoLinha label="Mochila" value={dia.mochila} onChange={(v) => setDiaField("mochila", v)} readOnly={somenteLeitura} />
            <CampoLinha label="Rádio" value={dia.radio} onChange={(v) => setDiaField("radio", v)} readOnly={somenteLeitura} />
            <CampoLinha label="DWS" value={dia.dws} onChange={(v) => setDiaField("dws", v)} readOnly={somenteLeitura} />
          </div>

          <Divider className="my-4" />
          <ConsultaCodigo />

          <Divider className="my-4" />
          <div className="mb-1.5 text-[11px] font-bold tracking-widest text-amber-400 uppercase font-display">Voos do dia</div>
          <div className="space-y-2">
            {dia.itinerario.map((l) => (
              <div key={l.id} className="painel-2 rounded-lg p-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <CampoLinha label="Voo" value={l.voo} onChange={(v) => updLinha(l.id, "voo", v)} mono readOnly={somenteLeitura} />
                    <CampoLinha label="Destino" value={l.destino} onChange={(v) => updLinha(l.id, "destino", v)} readOnly={somenteLeitura} />
                    <CampoLinha label="Horário" type="time" value={l.horario} onChange={(v) => updLinha(l.id, "horario", v)} readOnly={somenteLeitura} />
                    <SeletorLinha label="Agente" value={l.agente} onChange={(v) => updLinha(l.id, "agente", v)} options={["1", "2", "3", "4", "5", "6"]} readOnly={somenteLeitura} />
                  </div>
                  {!somenteLeitura && (
                    <button onClick={() => rmLinha(l.id)} className="rounded-lg p-2 text-red-400">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <SugestaoGru voo={l.voo} onAceitar={(d) => {
                  if (d.horario) updLinha(l.id, "horario", d.horario);
                  if (d.destino && !l.destino) updLinha(l.id, "destino", d.destino);
                }} />
              </div>
            ))}
          </div>
          {!somenteLeitura && (
            <button onClick={addLinhaItinerario} className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-amber-400">
              <Plus size={16} /> Adicionar linha
            </button>
          )}

          <div className="mt-4">
            <CampoLinha label="Observações do dia a relatar" multiline value={dia.observacoes} onChange={(v) => setDiaField("observacoes", v)} readOnly={somenteLeitura} />
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold tracking-widest text-amber-400 uppercase">
              Controle de voos · {dia.voos.length}
            </h2>
            {!somenteLeitura && (
              <TicketButton onClick={addVoo} icon={Plus} className="!text-xs">
                Novo voo
              </TicketButton>
            )}
          </div>
          <div className="space-y-3">
            {dia.voos.map((v, i) => (
              <CartaoVoo key={v.id} voo={v} indice={i} dia={dia} usuario={me?.full_name} onChange={(nv) => updVoo(v.id, nv)} onRemover={() => rmVoo(v.id)} readOnly={somenteLeitura} />
            ))}
            {dia.voos.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
                Nenhum voo registrado. Toque em "Novo voo" para começar.
              </div>
            )}
          </div>
          {!somenteLeitura && <BuscaVooGru onUsarDados={usarDadosVoo} />}
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold tracking-widest text-amber-400 uppercase">Dias registrados</h2>
          <DiasRegistrados
            dias={dias}
            carregando={carregando}
            onSelecionar={setDataSel}
            onExcluir={excluirDia}
            readOnly={somenteLeitura}
          />
        </section>
      </main>
    </div>
  );
}