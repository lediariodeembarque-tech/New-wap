import { useMemo, useState } from 'react';

const initialFlights = [
  { id: 1, number: '3416', destination: 'POA', time: '07:35', agent: 'Renato', gate: '217', status: 'ready', photos: 0 },
  { id: 2, number: '3592', destination: 'IOS', time: '10:25', agent: 'Renato', gate: '222', status: 'ready', photos: 0 },
  { id: 3, number: '', destination: '', time: '', agent: '', gate: '', status: 'pending', photos: 0 },
];

function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span>; }

export default function App() {
  const [flights, setFlights] = useState(initialFlights);
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('voos');
  const [photos, setPhotos] = useState([]);
  const [notice, setNotice] = useState('');

  const filteredFlights = useMemo(() => flights.filter((flight) => {
    const text = `${flight.number} ${flight.destination} ${flight.agent}`.toLowerCase();
    return text.includes(query.toLowerCase());
  }), [flights, query]);

  const addFlight = () => {
    const id = flights.length + 1;
    setFlights([...flights, { id, number: '', destination: '', time: '', agent: '', gate: '', status: 'pending', photos: 0 }]);
    setExpanded(id);
    setNotice('Novo voo adicionado');
    setTimeout(() => setNotice(''), 2200);
  };

  const updateFlight = (id, field, value) => setFlights(flights.map((flight) => flight.id === id ? { ...flight, [field]: value, status: 'ready' } : flight));
  const removeFlight = (id) => setFlights(flights.filter((flight) => flight.id !== id));
  const addPhotos = (event) => {
    const files = [...event.target.files].slice(0, 10 - photos.length);
    setPhotos([...photos, ...files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }))]);
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">✈</div><div><h1>DIÁRIO DE<br /><strong>EMBARQUE</strong></h1><p><span className="cloud">♧</span> 2 dias pendentes de envio</p></div></div>
      <nav className="actions"><button aria-label="Configurações"><Icon>⚙</Icon></button><button onClick={() => setNotice('Chat em breve')}><Icon>◯</Icon> Chat</button><button onClick={() => setNotice('Sessão encerrada')}><Icon>↪</Icon> Sair</button></nav>
    </header>

    <section className="workspace">
      <div className="date-row"><div className="date"><Icon>▣</Icon><b>21/09/2026</b><span>⌄</span></div><div className="user-pill">Leandro Ferrari</div></div>
      <div className="resources"><Resource label="PDA" /><Resource label="MOCHILA" /><Resource label="RÁDIO" value="3049" /><Resource label="DWS" /></div>
      <div className="dash-line" />

      <div className="tabs"><button className={activeTab === 'voos' ? 'active' : ''} onClick={() => setActiveTab('voos')}>VOOS DO DIA</button><button className={activeTab === 'resumo' ? 'active' : ''} onClick={() => setActiveTab('resumo')}>RESUMO</button></div>
      {activeTab === 'resumo' ? <Summary flights={flights} photos={photos} /> : <>
        <div className="flight-list">{filteredFlights.map((flight) => <FlightCard key={flight.id} flight={flight} expanded={expanded === flight.id} onToggle={() => setExpanded(expanded === flight.id ? null : flight.id)} onChange={updateFlight} onRemove={removeFlight} />)}</div>
        <button className="add-line" onClick={addFlight}>＋ &nbsp;Adicionar linha</button>
      </>}

      <section className="notes"><h2>OBSERVAÇÕES DO DIA A RELATAR</h2><textarea placeholder="Escreva uma observação..." /></section>
      <section className="photo-section"><h2>FOTOS</h2><div className="photo-actions"><label className="photo-button"><Icon>▣</Icon> Câmera<input type="file" accept="image/*" capture="environment" onChange={addPhotos} /></label><label className="photo-button gallery"><Icon>▧</Icon> Galeria<input type="file" accept="image/*" multiple onChange={addPhotos} /></label><span>{photos.length}/10</span></div>{photos.length > 0 && <div className="thumbs">{photos.map((photo) => <img key={photo.url} src={photo.url} alt={photo.name} />)}</div>}<button className="report" onClick={() => setNotice('Relatório gerado com sucesso')}><span>GERAR RELATÓRIO</span><b>▤</b></button></section>
    </section>
    {notice && <div className="toast">✓ {notice}</div>}
  </main>;
}

function Resource({ label, value = '' }) { return <div><label>{label}</label><span>{value}</span></div>; }
function Summary({ flights, photos }) { return <div className="summary"><div><strong>{flights.length}</strong><span>VOOS</span></div><div><strong>{flights.filter((f) => f.status === 'ready').length}</strong><span>PREENCHIDOS</span></div><div><strong>{photos.length}</strong><span>FOTOS</span></div></div>; }
function FlightCard({ flight, expanded, onToggle, onChange, onRemove }) {
  return <article className={`flight-card ${expanded ? 'open' : ''}`}><button className="flight-head" onClick={onToggle}><span className="flight-index">{String(flight.id).padStart(2, '0')}</span><span className={`status ${flight.status}`} /><span className="flight-title">{flight.number ? `${flight.number} → ${flight.destination || 'DESTINO'}` : `Voo ${flight.id}`}<small>{flight.time || '—'}　·　{flight.agent || '—'}　·　{flight.photos} fotos</small></span><span className="arrow">{expanded ? '⌃' : '⌄'}</span></button>{expanded && <div className="flight-form"><h3>IDENTIFICAÇÃO</h3><div className="form-grid"><Field label="VOO" value={flight.number} onChange={(v) => onChange(flight.id, 'number', v)} /><Field label="DESTINO" value={flight.destination} onChange={(v) => onChange(flight.id, 'destination', v)} /><Field label="HORÁRIO" value={flight.time} onChange={(v) => onChange(flight.id, 'time', v)} /><Field label="CONTROLE" /><Field label="RAMAL" /><Field label="PREFIXO" /><Field label="POSIÇÃO" /><Field label="META" /></div><h3>TRIP / RESERVA</h3><div className="form-grid"><Field label="BAGS RETIDAS" /><Field label="TRIP NO PORTÃO" /><Field label="SAÍDA" /><Field label="TRIP" /><Field label="RESERVA" wide /></div><div className="boarding"><h3>EMBARQUE</h3><Field label="INÍCIO DO EMBARQUE" /><Field label="LIBERADO" /><Field label="TÉRMINO DO EMBARQUE" /></div><div className="passengers"><h3>PASSAGEIROS</h3><Field label="FALTANTES" /><Field label="COM BAGS" /><Field label="TOTAL" /></div><button className="delete" onClick={() => onRemove(flight.id)}>♙ Excluir voo</button></div>}</article>;
}
function Field({ label, value = '', onChange, wide }) { return <label className={`field ${wide ? 'wide' : ''}`}><span>{label}</span><input value={value} onChange={(e) => onChange?.(e.target.value)} /></label>; }
