const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Fonte: planilha Google Sheets (compartilhada "qualquer pessoa com o link").
// Lemos via exportação em CSV — não exige login e evita renderizar a página.
const SHEET_ID = "1j-BTNkRa2SV_ki6nVv_K5kN8rL0tkMvj4ZoJyeNR92U";
const GID = "0"; // aba "02. Prog. Visualização HCC" (primeira aba)
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;
const TTL = 240000; // 4 minutos de cache no backend

// Cache em memória do isolado quente — reutilizado por todas as buscas dentro do TTL.
let cache = { ts: 0, rows: [] as string[][] };

// Parser de CSV simples (lida com aspas duplas escapadas e vírgulas dentro de campos).
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === '\r') { /* ignora */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === ',') { row.push(field); field = ""; }
      else field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function norm(s: string) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Compara só pelos dígitos do número do voo (ignora letras de prefixo e zeros à esquerda).
function digits(s: string) {
  return String(s || "").replace(/[^0-9]/g, "").replace(/^0+/, "");
}

// "*DATA DEP" vem como "dd/mm". Convertemos para um valor comparável (mês-major).
function scoreData(s: string) {
  const m = String(s || "").match(/(\d{1,2})\/(\d{1,2})/);
  if (!m) return -1;
  return Number(m[2]) * 100 + Number(m[1]);
}

async function obterPlanilha(): Promise<string[][] | null> {
  if (cache.rows.length && Date.now() - cache.ts < TTL) return cache.rows;
  try {
    const res = await fetch(CSV_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "text/csv,text/plain,application/octet-stream,*/*",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
      }
    });
    if (!res.ok) return null;
    const text = await res.text();
    const rows = parseCsv(text);
    if (!rows.length) return null;
    cache = { ts: Date.now(), rows };
    return rows;
  } catch {
    return null;
  }
}

// Monta o índice de cada coluna necessária. Colunas com cabeçalho mesclado/embranco
// (*DATA DEP, VOO DEP, STD) são resolvidas por posição relativa às colunas nomeadas.
function montarMapa(header: string[]) {
  const idx: Record<string, number> = {};
  header.forEach((h, i) => {
    const n = norm(h);
    if (n && idx[n] === undefined) idx[n] = i;
  });
  const prefixo = idx["*prefixo"];
  const des = idx["des"];
  const boxDep = idx["box dep"];
  const portao = idx["portão"] ?? idx["portao"];
  const otp = idx["*otp"];
  const cod1 = idx["*cód 1"];
  const cod2 = idx["*cód 2"];
  const dataDep = idx["*data dep"] ?? (prefixo != null ? prefixo + 1 : undefined);
  const vooDep = idx["voo dep"] ?? (prefixo != null ? prefixo + 2 : undefined);
  const std = idx["std"] ?? (des != null ? des + 1 : undefined);
  return { prefixo, dataDep, vooDep, des, std, boxDep, portao, otp, cod1, cod2 };
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    let body: any = {};
    try { body = await req.json(); } catch {}
    const tipoVoo = String(body.voo || "").trim();
    const tipoDestino = String(body.destino || "").trim();
    const modo = tipoVoo ? "voo" : tipoDestino ? "destino" : "";
    if (!modo) return Response.json({ encontrado: false, motivo: "vazio" });

    const rows = await obterPlanilha();
    if (!rows || !rows.length) return Response.json({ encontrado: false, motivo: "indisponivel" });

    // Localiza a linha de cabeçalho (contém "*PREFIXO").
    let headerIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 8); i++) {
      if (rows[i].some((c) => norm(c) === "*prefixo")) { headerIdx = i; break; }
    }
    if (headerIdx === -1) return Response.json({ encontrado: false, motivo: "indisponivel" });
    const mapa = montarMapa(rows[headerIdx]);
    if (mapa.vooDep == null) return Response.json({ encontrado: false, motivo: "indisponivel" });

    // Hoje em "mês-major" para desempatar voos repetidos (prefere a data de hoje/recente).
    const agora = new Date();
    const hojeScore = (agora.getMonth() + 1) * 100 + agora.getDate();

    const extrair = (L: string[]): any => ({
      voo: mapa.vooDep != null ? String(L[mapa.vooDep] ?? "").trim() : "",
      destino: mapa.des != null ? String(L[mapa.des] ?? "").trim() : "",
      horario: mapa.std != null ? String(L[mapa.std] ?? "").trim() : "",
      porta: mapa.portao != null ? String(L[mapa.portao] ?? "").trim() : "",
      prefixo: mapa.prefixo != null ? String(L[mapa.prefixo] ?? "").trim() : "",
      dataDep: mapa.dataDep != null ? String(L[mapa.dataDep] ?? "").trim() : "",
      boxDep: mapa.boxDep != null ? String(L[mapa.boxDep] ?? "").trim() : "",
      otp: mapa.otp != null ? String(L[mapa.otp] ?? "").trim() : "",
      cod1: mapa.cod1 != null ? String(L[mapa.cod1] ?? "").trim() : "",
      cod2: mapa.cod2 != null ? String(L[mapa.cod2] ?? "").trim() : "",
    });

    // Busca por destino (DES): devolve a lista de voos correspondentes, mais recentes primeiro.
    if (modo === "destino") {
      if (mapa.des == null) return Response.json({ encontrado: false, motivo: "indisponivel" });
      const q = tipoDestino.toUpperCase();
      const matches: any[] = [];
      for (let r = headerIdx + 1; r < rows.length; r++) {
        const linha = rows[r];
        const des = String(linha[mapa.des] ?? "").trim().toUpperCase();
        if (!des || !des.includes(q)) continue;
        const ds = mapa.dataDep != null ? scoreData(linha[mapa.dataDep]) : -1;
        // somente voos de hoje (data da planilha igual à data atual)
        if (ds !== hojeScore) continue;
        matches.push(extrair(linha));
      }
      return Response.json({ encontrado: matches.length > 0, resultados: matches.slice(0, 40) });
    }

    const bd = digits(tipoVoo);
    if (bd.length < 1) return Response.json({ encontrado: false, motivo: "vazio" });

    let melhor: any = null;
    let melhorDist = Infinity;
    for (let r = headerIdx + 1; r < rows.length; r++) {
      const linha = rows[r];
      const vooCell = linha[mapa.vooDep];
      if (!vooCell) continue;
      if (digits(vooCell) !== bd) continue;
      const ds = mapa.dataDep != null ? scoreData(linha[mapa.dataDep]) : -1;
      const dist = ds < 0 ? Infinity : Math.abs(ds - hojeScore);
      if (dist < melhorDist) { melhorDist = dist; melhor = { linha, ds }; }
    }

    if (!melhor) return Response.json({ encontrado: false, motivo: "nao_encontrado" });
    return Response.json({ encontrado: true, ...extrair(melhor.linha) });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}