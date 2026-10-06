const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Plane, ChevronDown, MessageCircle, Settings } from "lucide-react";
import { CartaoVoo, estadoVoo } from "@/components/CartaoVoo";
import { StatusLuz } from "@/components/StatusLuz";
import { Divider } from "@/components/Divider";

function VoosAdminItem({ item, numero, onClick, aberto }) {
  const { voo, nomeUsuario } = item;
  const estado = estadoVoo(voo);
  return (
    <div className="painel rounded-xl">
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 p-3 text-left">
        <StatusLuz estado={estado} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold tracking-wide text-slate-100 font-mono">
              {voo.voo || `Voo ${numero}`} {voo.destino && `→ ${voo.destino}`}
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {nomeUsuario} · {voo.horario || "—"} · {voo.controle || "—"}
          </div>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition ${aberto ? "rotate-180" : ""}`} />
      </button>
      {aberto && (
        <div className="border-t border-white/10 p-3">
          <CartaoVoo voo={voo} indice={numero - 1} dia={item.dia} usuario={item.nomeUsuario !== "—" ? item.nomeUsuario : ""} readOnly defaultOpen />
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [dias, setDias] = useState([]);
  const [usuarios, setUsuarios] = useState({});
  const [ehAdmin, setEhAdmin] = useState(null);
  const [abertoId, setAbertoId] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Checagem de papel (client — só pra esconder a tela; RLS protege de fato)
  useEffect(() => {
    db.auth.me().then((u) => setEhAdmin(u?.role === "admin")).catch(() => setEhAdmin(false));
  }, []);

  // Carrega usuários (admins podem listar)
  useEffect(() => {
    db.entities.User.list().then((lista) => {
      const map = {};
      (lista || []).forEach((u) => { map[u.id] = u.full_name || u.email; });
      setUsuarios(map);
    }).catch(() => setUsuarios({}));
  }, []);

  // Carrega dias + inscription realtime
  useEffect(() => {
    if (ehAdmin === false) return;
    let mounted = true;
    const carregar = async () => {
      setCarregando(true);
      try {
        const lista = await db.entities.DiaEmbarque.list("-updated_date", 500);
        if (mounted) setDias(lista || []);
      } finally { if (mounted) setCarregando(false); }
    };
    carregar();
    const unsub = db.entities.DiaEmbarque.subscribe((event) => {
      setDias((prev) => {
        if (event.type === "delete") return prev.filter((d) => d.id !== event.data?.id);
        const idx = prev.findIndex((d) => d.id === event.data?.id);
        if (event.type === "create") return [event.data, ...prev];
        if (event.type === "update") {
          const n = [...prev]; if (idx >= 0) n[idx] = event.data; else n.unshift(event.data);
          return n;
        }
        return prev;
      });
    });
    return () => { mounted = false; unsub && unsub(); };
  }, [ehAdmin]);

  // Achata voos com referência ao dia/usuário
  const voos = useMemo(() => {
    const out = [];
    dias.forEach((d) => {
      (d.voos || []).forEach((v, i) => {
        out.push({
          key: `${d.id}-${v.id}`,
          dia: d,
          voo: v,
          numero: i + 1,
          nomeUsuario: usuarios[d.created_by_id] || d.created_by || "—",
        });
      });
    });
    return out;
  }, [dias, usuarios]);

  const emAndamento = voos.filter((x) => estadoVoo(x.voo) === "em_andamento");
  const concluidos = voos.filter((x) => estadoVoo(x.voo) === "concluido");
  const naoIniciados = voos.filter((x) => estadoVoo(x.voo) === "nao_iniciado");

  if (ehAdmin === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="mb-4">Acesso restrito a administradores.</p>
          <button onClick={() => navigate("/diario")} className="rounded-lg bg-amber-400 px-4 py-2 font-bold text-slate-900">
            Voltar ao diário
          </button>
        </div>
      </div>
    );
  }

  if (ehAdmin === null) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Verificando acesso…</div>;
  }

  const Lista = ({ titulo, items, luz }) => (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold tracking-widest text-amber-400 uppercase">
        <StatusLuz estado={luz} /> {titulo} · {items.length}
      </h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-muted-foreground">Nenhum</div>
      ) : (
        <div className="space-y-2">
          {items.map((x) => (
            <VoosAdminItem key={x.key} item={x} numero={x.numero}
              onClick={() => setAbertoId((cur) => (cur === x.key ? null : x.key))}
              aberto={abertoId === x.key} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-secondary/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-slate-900">
            <Plane size={20} />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold tracking-widest text-amber-400">PAINEL ADMIN</h1>
            <p className="text-xs text-slate-400">Acompanhamento em tempo real</p>
          </div>
          <button onClick={() => navigate("/diario")}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300">
            Meu diário
          </button>
          <button onClick={() => navigate("/chat")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300">
            <MessageCircle size={14} /> Chat
          </button>
          <button onClick={() => navigate("/personalizar")}
            className="rounded-lg border border-white/10 p-2 text-slate-300" title="Personalizar">
            <Settings size={16} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-5 pb-20">
        {carregando && <div className="text-sm text-muted-foreground">Carregando voos…</div>}
        <Lista titulo="Em andamento" items={emAndamento} luz="em_andamento" />
        <Divider />
        <Lista titulo="Não iniciados" items={naoIniciados} luz="nao_iniciado" />
        <Divider />
        <Lista titulo="Concluídos" items={concluidos} luz="concluido" />
      </main>
    </div>
  );
}