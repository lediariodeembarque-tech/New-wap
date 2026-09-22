import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';

const STORAGE_KEY = 'new-wap-flight-diary';
const USER_KEY = 'new-wap-user';
// Root-level repository files are not served by Vite at runtime, so use the raw public URL.
const BRAND_IMAGE = 'https://raw.githubusercontent.com/lediariodeembarque-tech/New-wap/New-Wap/1790037724898.png';
const defaultFlight = (id) => ({ id, number: '', destination: '', time: '', agent: '', gate: '', control: String(id).padStart(2, '0'), note: '', photos: [], pda: '', dws: '', radio: '', mochila: '' });
const seedFlights = [
  { ...defaultFlight(1), number: '3416', destination: 'POA', time: '07:35', agent: 'Renato', gate: '217', note: 'Planilha: 07:35 · POA · Portão 217', pda: '30', dws: '49', radio: 'OK', mochila: 'OK' },
  { ...defaultFlight(2), number: '3592', destination: 'IOS', time: '10:25', agent: 'Renato', gate: '222', note: 'Planilha: 10:25 · IOS · Portão 222', pda: '12', dws: '20', radio: 'OK', mochila: 'OK' },
  { ...defaultFlight(3) },
];
const sections = [
  ['IDENTIFICAÇÃO', [['number', 'VOO'], ['destination', 'DESTINO'], ['time', 'HORÁRIO'], ['control', 'CONTROLE'], ['agent', 'AGENTE'], ['gate', 'PORTÃO']]],
  ['TRIP / RESERVA', [['trip', 'TRIP'], ['reservation', 'RESERVA'], ['bags', 'BAGS RETIDAS'], ['departure', 'SAÍDA']]],
  ['EMBARQUE', [['boardingStart', 'INÍCIO DO EMBARQUE'], ['released', 'LIBERADO'], ['boardingEnd', 'TÉRMINO DO EMBARQUE']]],
  ['PASSAGEIROS', [['missing', 'FALTANTES'], ['withBags', 'COM BAGS'], ['total', 'TOTAL'], ['lastPassenger', 'HORA ÚLT. PAX'], ['gateTime', 'HORA PORTA']]],
  ['DELTAS', [['delta1', 'DELTA 1'], ['delta2', 'DELTA 2'], ['delta3', 'DELTA 3'], ['delta4', 'DELTA 4'], ['van', 'VAN']]],
];

export default function App() {
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('usuario@embarque.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [user, setUser] = useState(() => localStorage.getItem(USER_KEY) || 'Leandro Ferrari');
  const [flights, setFlights] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedFlights; } catch { return seedFlights; } });
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState('');
  const [date, setDate] = useState(() => localStorage.getItem(`${STORAGE_KEY}-date`) || new Date().toISOString().slice(0, 10));
  const [dayNote, setDayNote] = useState(() => localStorage.getItem(`${STORAGE_KEY}-note`) || '');
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [synced, setSynced] = useState(true);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(flights)), [flights]);
  useEffect(() => localStorage.setItem(`${STORAGE_KEY}-date`, date), [date]);
  useEffect(() => localStorage.setItem(`${STORAGE_KEY}-note`, dayNote), [dayNote]);
  useEffect(() => { if (user) localStorage.setItem(USER_KEY, user); }, [user]);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const selected = flights.find((flight) => flight.id === selectedId) || flights[0];
  const filtered = useMemo(() => flights.filter((flight) => `${flight.number} ${flight.destination} ${flight.agent} ${flight.time}`.toLowerCase().includes(query.toLowerCase().trim())), [flights, query]);
  const update = (id, field, value) => { setSynced(false); setFlights((current) => current.map((flight) => flight.id === id ? { ...flight, [field]: value } : flight)); };
  const login = (event) => { event.preventDefault(); if (!email.trim() || !email.includes('@')) return setError('Informe um e-mail válido.'); if (!password.trim()) return setError('Informe sua senha.'); setError(''); setUser(email.split('@')[0].replace(/[._-]/g, ' ') || 'Leandro Ferrari'); setScreen('dashboard'); notify('Login realizado'); };
  const googleLogin = () => { setError(''); setUser('Leandro Ferrari'); setScreen('dashboard'); notify('Login com Google selecionado'); };
  const addFlight = () => { const id = Date.now(); setFlights((current) => [...current, defaultFlight(id)]); setSelectedId(id); setScreen('detail'); notify('Novo voo adicionado'); };
  const removeFlight = () => { setFlights((current) => current.filter((flight) => flight.id !== selected.id)); setScreen('dashboard'); notify('Voo removido'); };
  const sync = () => { setSynced(false); window.setTimeout(() => { setSynced(true); notify('Dados sincronizados'); }, 700); };
  const generatePdf = () => { const doc = new jsPDF(); doc.setFillColor(13, 27, 43); doc.rect(0, 0, 210, 297, 'F'); doc.setTextColor(245, 198, 72); doc.setFontSize(19); doc.text('RELATÓRIO DE EMBARQUE', 14, 18); doc.setTextColor(240, 245, 252); doc.setFontSize(10); doc.text(`Data: ${new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')} | ${user}`, 14, 28); let y = 43; flights.forEach((flight, index) => { if (y > 265) { doc.addPage(); y = 18; } doc.setTextColor(245, 198, 72); doc.setFontSize(12); doc.text(`VOO ${flight.number || index + 1} - ${flight.destination || 'Sem destino'}`, 14, y); doc.setTextColor(240, 245, 252); doc.setFontSize(9); doc.text(`Horário: ${flight.time || '-'} | Portão: ${flight.gate || '-'} | PDA: ${flight.pda || '-'} | DWS: ${flight.dws || '-'}`, 14, y += 8); y += 14; }); doc.save('relatorio-embarque.pdf'); notify('PDF gerado com sucesso'); };
  const menu = ['Personalizar', 'Chat', 'Contatos', 'Admin'];
  const imageStyle = { backgroundImage: `url(${BRAND_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center' };

  if (screen === 'login') return <main className="login-screen" style={{ backgroundImage: `linear-gradient(180deg, rgba(5,15,30,.42), rgba(4,12,25,.78)), url(${BRAND_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center' }}><form className="login-card" onSubmit={login}><div className="login-logo" style={{ ...imageStyle, display: 'none' }}>✈</div><h2 style={{ display: 'none' }}>Diário de<br />Embarque</h2><div className="field-login"><label htmlFor="email">E-mail</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div><div className="field-login"><label htmlFor="password">Senha</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>{error && <p className="login-error">{error}</p>}<button className="primary-btn" type="submit">Entrar</button><button type="button" onClick={googleLogin} style={{ width: '100%', height: 48, marginTop: 10, borderRadius: 12, border: '1px solid rgba(255,255,255,.16)', background: '#fff', color: '#172b40', fontWeight: 800 }}>G&nbsp;&nbsp; Entrar com Google</button></form>{toast && <Toast text={toast} />}</main>;

  if (screen === 'dashboard') return <main className="dashboard-screen"><header className="topbar"><div className="brand-block"><div className="brand-mark" style={{ ...imageStyle, color: 'transparent' }}>✈</div><div className="brand-copy"><h1 style={{ display: 'none' }}>DIÁRIO DE<br />EMBARQUE</h1><p>{flights.length} voos cadastrados</p></div></div><div><div className="actions"><button type="button" onClick={sync} aria-label="Sincronizar" style={{ fontSize: 18, color: synced ? 'var(--green)' : 'var(--muted)' }}>⠿</button><div style={{ position: 'relative' }}><button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Abrir menu" style={{ fontSize: 21 }}>☰</button>{menuOpen && <div style={{ position: 'absolute', right: 0, top: 44, zIndex: 5, minWidth: 150, padding: 8, borderRadius: 12, background: '#12273d', border: '1px solid rgba(255,255,255,.16)', boxShadow: '0 12px 30px #0008' }}>{menu.map((item) => <button key={item} type="button" onClick={() => { setMenuOpen(false); notify(`${item}: em breve`); }} style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'transparent', padding: '10px 8px' }}>{item}</button>)}</div>}</div><button type="button" onClick={() => { setScreen('login'); notify('Sessão encerrada'); }}>Sair</button></div><div style={{ textAlign: 'right', marginTop: 6, color: 'var(--yellow)', fontSize: 11 }}>{user}</div></div></header><section className="content-panel"><div className="date-row"><label className="date-box" style={{ cursor: 'pointer' }}><span className="cal-icon">▣</span><input aria-label="Selecionar data" type="date" value={date} onChange={(event) => setDate(event.target.value)} style={{ color: 'var(--yellow)', border: 0, background: 'transparent', fontSize: 'inherit', fontWeight: 800, minWidth: 150 }} /></label><div className="user-box">{user}</div></div><div className="meta-grid" style={{ alignItems: 'stretch' }}>{[['pda', 'PDA'], ['mochila', 'MOCHILA'], ['radio', 'RÁDIO'], ['dws', 'DWS']].map(([field, label]) => <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text)', fontSize: 11 }}><span>{label}</span><input value={selected?.[field] || ''} onChange={(event) => update(selected.id, field, event.target.value)} placeholder="-" style={{ width: '100%', minWidth: 0, border: 0, borderBottom: '1px solid rgba(255,255,255,.14)', color: 'var(--text)', background: 'transparent', fontSize: 18 }} /></label>)}</div><div className="counter-row">{selected?.pda || '0'}</div><div className="dashed-divider" /><div className="section-label">Voos do dia</div><div className="search-box"><input placeholder="Pesquisar voo, destino ou agente" value={query} onChange={(event) => setQuery(event.target.value)} /><button type="button" onClick={() => setQuery('')}>Limpar</button></div><div className="flight-list">{filtered.map((flight, index) => <button className="flight-card" type="button" key={flight.id} onClick={() => { setSelectedId(flight.id); setScreen('detail'); }}><div className="flight-index">{String(index + 1).padStart(2, '0')}</div><div className="flight-summary"><div className="flight-route"><span className="status-dot" />{flight.number || 'NOVO'} <span className="arrow-route">→</span> {flight.destination || 'DESTINO'}</div><div className="flight-meta">{flight.time || '--:--'} · Portão {flight.gate || '--'} · {flight.agent || 'Sem agente'}</div></div><span className="chevron-open">›</span></button>)}</div><button className="add-row" type="button" onClick={addFlight}>＋ ADICIONAR VOO</button><div className="observation-box"><label>Observações do dia</label><textarea value={dayNote} onChange={(event) => setDayNote(event.target.value)} placeholder="Digite uma observação..." /></div></section>{toast && <Toast text={toast} />}</main>;

  return <main className="detail-screen"><div className="detail-header"><div className="detail-index">{String(flights.findIndex((flight) => flight.id === selected.id) + 1).padStart(2, '0')}</div><div className="detail-title-wrap"><i className="red-dot" /><strong>{selected.number || 'Voo'}</strong><small>{user}</small></div><button className="mini-up" type="button" onClick={() => setScreen('dashboard')}>⌃</button></div><section className="detail-panel"><h2 className="section-title">DADOS DO VOO</h2><div className="field-grid two-cols">{[['number','VOO'],['destination','DESTINO'],['time','HORÁRIO'],['gate','PORTÃO'],['agent','AGENTE'],['pda','PDA'],['dws','DWS'],['radio','RÁDIO'],['mochila','MOCHILA']].map(([key, label]) => <Field key={key} label={label} value={selected[key] || ''} onChange={(value) => update(selected.id, key, value)} />)}</div><h2 className="section-title">OBSERVAÇÕES</h2><textarea style={{ width: '100%', minHeight: 100, color: 'var(--text)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: 12 }} value={selected.note || ''} onChange={(event) => update(selected.id, 'note', event.target.value)} /><div className="actions-row"><button className="report-button" type="button" onClick={generatePdf}>Gerar relatório</button><button className="trash-button" type="button" onClick={removeFlight}>⌫</button></div></section>{toast && <Toast text={toast} />}</main>;
}

function Field({ label, value, onChange }) { return <label className="field-block"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function Toast({ text }) { return <div className="toast">✓ {text}</div>; }
