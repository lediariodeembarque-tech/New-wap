import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';

const detailFields = [
  ['number', 'VOO'], ['destination', 'DESTINO'], ['time', 'HORÁRIO'], ['control', 'CONTROLE'],
  ['branch', 'RAMAL'], ['prefix', 'PREFIXO'], ['position', 'POSIÇÃO'], ['target', 'META'],
  ['bagsHeld', 'BAGS RETIDAS'], ['tripGate', 'TRIP NO PORTÃO'], ['departure', 'SAÍDA'], ['trip', 'TRIP'], ['reservation', 'RESERVA'],
  ['boardingStart', 'INÍCIO DO EMBARQUE'], ['released', 'LIBERADO'], ['boardingEnd', 'TÉRMINO DO EMBARQUE'],
  ['missing', 'FALTANTES'], ['withBags', 'COM BAGS'], ['total', 'TOTAL'], ['lastPassenger', 'HORA ÚLT. PAX'], ['gateTime', 'HORA PORTA'],
  ['delta1', 'DELTA 1'], ['delta2', 'DELTA 2'], ['delta3', 'DELTA 3'], ['delta4', 'DELTA 4'], ['van', 'VAN'],
];

const blankFlight = (id) => ({ id, number: '', destination: '', time: '', agent: '', gate: '', status: 'pending', photos: [], note: '', branch: '', prefix: '', position: '', target: '', bagsHeld: '', tripGate: '', departure: '', trip: '', reservation: '', boardingStart: '', released: '', boardingEnd: '', missing: '', withBags: '', total: '', lastPassenger: '', gateTime: '', delta1: '', delta2: '', delta3: '', delta4: '', van: '' });
const initialFlights = [{ ...blankFlight(1), number: '3416', destination: 'POA', time: '07:35', agent: 'Renato', gate: '217', status: 'ready', note: 'Planilha: 07:35 · POA · Portão 217' }, { ...blankFlight(2), number: '3592', destination: 'IOS', time: '10:25', agent: 'Renato', gate: '222', status: 'ready', note: 'Planilha: 10:25 · IOS · Portão 222' }, blankFlight(3)];

function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span>; }
function notify(setNotice, message) { setNotice(message); window.setTimeout(() => setNotice(''), 2200); }

export default function App() {
  const [flights, setFlights] = useState(initialFlights);
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('voos');
  const [dayNote, setDayNote] = useState('');
  const [notice, setNotice] = useState('');

  const filteredFlights = useMemo(() => flights.filter((flight) => `${flight.number} ${flight.destination} ${flight.agent}`.toLowerCase().includes(query.toLowerCase())), [flights, query]);
  const totalPhotos = flights.reduce((sum, flight) => sum + flight.photos.length, 0);
  const updateFlight = (id, field, value) => setFlights((current) => current.map((flight) => flight.id === id ? { ...flight, [field]: value, status: value ? 'ready' : flight.status } : flight));
  const addFlight = () => { const id = Math.max(0, ...flights.map((flight) => flight.id)) + 1; setFlights((current) => [...current, blankFlight(id)]); setExpanded(id); notify(setNotice, 'Novo voo adicionado'); };
  const removeFlight = (id) => { setFlights((current) => current.filter((flight) => flight.id !== id)); setExpanded(null); notify(setNotice, 'Voo removido'); };
  const addPhotos = (id, event) => { const files = [...event.target.files].slice(0, 10); const photos = files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })); setFlights((current) => current.map((flight) => flight.id === id ? { ...flight, photos: [...flight.photos, ...photos].slice(0, 10) } : flight)); event.target.value = ''; };

  const generatePdf = () => {
    const doc = new jsPDF();
    const page = () => { doc.setFillColor(17, 34, 57); doc.rect(0, 0, 210, 297, 'F'); };
    page(); doc.setTextColor(255, 197, 42); doc.setFontSize(20); doc.text('DIÁRIO DE EMBARQUE', 14, 18);
    doc.setTextColor(238, 244, 255); doc.setFontSize(11); doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}   |   Responsável: Leandro Ferrari`, 14, 27);
    let y = 40;
    flights.forEach((flight, index) => {
      if (y > 260) { doc.addPage(); page(); y = 20; }
      doc.setTextColor(255, 197, 42); doc.setFontSize(13); doc.text(`VOO ${flight.number || index + 1} — ${flight.destination || '-'}`, 14, y);
      doc.setTextColor(238, 244, 255); doc.setFontSize(10);
      const rows = [`Horário: ${flight.time || '-'} | Agente: ${flight.agent || '-'} | Portão: ${flight.gate || '-'}`, `Controle: ${flight.control || '-'} | Prefixo: ${flight.prefix || '-'} | Posição: ${flight.position || '-'}`, `Passageiros: ${flight.total || '-'} total | ${flight.withBags || '-'} com bags | ${flight.missing || '-'} faltantes`, `Embarque: ${flight.boardingStart || '-'} até ${flight.boardingEnd || '-'} | Liberado: ${flight.released || '-'}`, `Observações: ${flight.note || '-'}`];
      rows.forEach((row) => { doc.text(row, 14, y += 7); }); doc.text(`Fotos anexadas: ${flight.photos.length}`, 14, y += 7); doc.setDrawColor(255, 197, 42); doc.line(14, y += 5, 196, y); y += 13;
    });
    if (y > 260) { doc.addPage(); page(); y = 20; }
    doc.setTextColor(255, 197, 42); doc.text('OBSERVAÇÕES DO DIA', 14, y); doc.setTextColor(238, 244, 255); doc.text(doc.splitTextToSize(dayNote || '-', 180), 14, y + 8);
    doc.save(`relatorio-embarque-${new Date().toISOString().slice(0, 10)}.pdf`); notify(setNotice, 'Relatório PDF gerado com sucesso');
  };

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark">✈</div><div><h1>DIÁRIO DE<br /><strong>EMBARQUE</strong></h1><p>♧ 2 dias pendentes de envio</p></div></div><nav className="actions"><button onClick={() => notify(setNotice, 'Configurações salvas')} aria-label="Configurações"><Icon>⚙</Icon></button><button onClick={() => notify(setNotice, 'Chat em breve')}><Icon>◯</Icon> Chat</button><button onClick={() => notify(setNotice, 'Sessão encerrada')}><Icon>↪</Icon> Sair</button></nav></header>
    <section className="workspace"><div className="date-row"><div className="date"><Icon>▣</Icon><b>21/09/2026</b><span>⌄</span></div><div className="user-pill">Leandro Ferrari</div></div><div className="resources"><Resource label="PDA" /><Resource label="MOCHILA" /><Resource label="RÁDIO" value="3049" /><Resource label="DWS" /></div><div className="dash-line" />
      <div className="tabs"><button className={activeTab === 'voos' ? 'active' : ''} onClick={() => setActiveTab('voos')}>VOOS DO DIA</button><button className={activeTab === 'resumo' ? 'active' : ''} onClick={() => setActiveTab('resumo')}>RESUMO</button></div>
      {activeTab === 'resumo' ? <Summary flights={flights} photos={totalPhotos} /> : <><div className="search-box"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por voo, destino ou agente" /><button>Buscar</button></div><div className="flight-list">{filteredFlights.map((flight) => <FlightCard key={flight.id} flight={flight} expanded={expanded === flight.id} onToggle={() => setExpanded(expanded === flight.id ? null : flight.id)} onChange={updateFlight} onRemove={removeFlight} onPhotos={addPhotos} />)}</div><button className="add-line" onClick={addFlight}>＋ &nbsp;Adicionar linha</button></>}
      <section className="notes"><h2>OBSERVAÇÕES DO DIA A RELATAR</h2><textarea value={dayNote} onChange={(event) => setDayNote(event.target.value)} placeholder="Escreva uma observação..." /></section><section className="report-area"><button className="report" onClick={generatePdf}><span>GERAR RELATÓRIO</span><b>▤</b></button></section>
    </section>{notice && <div className="toast">✓ {notice}</div>}
  </main>;
}
function Resource({ label, value = '' }) { return <div><label>{label}</label><span>{value}</span></div>; }
function Summary({ flights, photos }) { return <div className="summary"><div><strong>{flights.length}</strong><span>VOOS</span></div><div><strong>{flights.filter((flight) => flight.status === 'ready').length}</strong><span>PREENCHIDOS</span></div><div><strong>{photos}</strong><span>FOTOS</span></div></div>; }
function FlightCard({ flight, expanded, onToggle, onChange, onRemove, onPhotos }) {
  return <article className={`flight-card ${expanded ? 'open' : ''}`}><button className="flight-head" onClick={onToggle}><span className="flight-index">{String(flight.id).padStart(2, '0')}</span><span className={`status ${flight.status}`} /><span className="flight-title">{flight.number ? `${flight.number} → ${flight.destination || 'DESTINO'}` : `Voo ${flight.id}`}<small>{flight.time || '—'}　·　{flight.agent || '—'}　·　{flight.photos.length} fotos</small></span><span className="arrow">{expanded ? '⌃' : '⌄'}</span></button>{expanded && <div className="flight-form"><h3>IDENTIFICAÇÃO</h3><div className="form-grid">{detailFields.slice(0, 8).map(([key, label]) => <Field key={key} label={label} value={flight[key]} onChange={(value) => onChange(flight.id, key, value)} />)}</div><h3>TRIP / RESERVA</h3><div className="form-grid">{detailFields.slice(8, 13).map(([key, label]) => <Field key={key} label={label} value={flight[key]} onChange={(value) => onChange(flight.id, key, value)} />)}</div><div className="boarding"><h3>EMBARQUE</h3>{detailFields.slice(13, 16).map(([key, label]) => <Field key={key} label={label} value={flight[key]} onChange={(value) => onChange(flight.id, key, value)} />)}</div><div className="passengers"><h3>PASSAGEIROS</h3>{detailFields.slice(16, 21).map(([key, label]) => <Field key={key} label={label} value={flight[key]} onChange={(value) => onChange(flight.id, key, value)} />)}</div><h3>DELTAS</h3><div className="form-grid">{detailFields.slice(21).map(([key, label]) => <Field key={key} label={label} value={flight[key]} onChange={(value) => onChange(flight.id, key, value)} />)}</div><h3>SERVIÇOS E OBSERVAÇÕES</h3><Field label="OBSERVAÇÕES DO VOO" value={flight.note} onChange={(value) => onChange(flight.id, 'note', value)} /><div className="flight-media"><label className="photo-button">📷 Câmera<input type="file" accept="image/*" capture="environment" onChange={(event) => onPhotos(flight.id, event)} /></label><label className="photo-button gallery">▧ Galeria<input type="file" accept="image/*" multiple onChange={(event) => onPhotos(flight.id, event)} /></label><span>{flight.photos.length}/10 fotos</span></div>{flight.photos.length > 0 && <div className="thumbs">{flight.photos.map((photo) => <img key={photo.url} src={photo.url} alt={photo.name} />)}</div>}<button className="delete" onClick={() => onRemove(flight.id)}>🗑 Excluir voo</button></div>}</article>;
}
function Field({ label, value = '', onChange, wide }) { return <label className={`field ${wide ? 'wide' : ''}`}><span>{label}</span><input value={value} onChange={(event) => onChange?.(event.target.value)} /></label>; }
