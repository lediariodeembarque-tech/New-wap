import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';

const initialFlights = [
  {
    id: 1,
    number: '3416',
    destination: 'POA',
    time: '07:35',
    agent: 'Renato',
    gate: '217',
    control: '01',
    photos: 0,
    status: 'ready',
    note: 'Planilha: 07:35 · POA · Portão 217',
  },
  {
    id: 2,
    number: '3592',
    destination: 'IOS',
    time: '10:25',
    agent: 'Renato',
    gate: '222',
    control: '02',
    photos: 0,
    status: 'ready',
    note: 'Planilha: 10:25 · IOS · Portão 222',
  },
  {
    id: 3,
    number: 'Voo 3',
    destination: '',
    time: '',
    agent: '',
    gate: '',
    control: '03',
    photos: 0,
    status: 'pending',
    note: '',
  },
];

const sampleFields = {
  flightNo: '3416',
  origin: 'POA',
  time: '07:35',
  agent: 'Renato',
  gate: '217',
  port: 'Portão 217',
};

export default function App() {
  const [screen, setScreen] = useState('control');
  const [flights, setFlights] = useState(initialFlights);
  const [query, setQuery] = useState('');
  const [selectedFlightId, setSelectedFlightId] = useState(1);
  const [toast, setToast] = useState('');

  const visibleFlights = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return flights;
    return flights.filter((flight) => {
      const haystack = `${flight.number} ${flight.destination} ${flight.agent} ${flight.time}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [flights, query]);

  const selectedFlight = flights.find((item) => item.id === selectedFlightId) ?? flights[0];

  const addFlight = () => {
    const nextId = Date.now();
    const newFlight = {
      id: nextId,
      number: '',
      destination: '',
      time: '',
      agent: '',
      gate: '',
      control: `${flights.length + 1}`.padStart(2, '0'),
      photos: 0,
      status: 'pending',
      note: '',
    };
    setFlights((current) => [...current, newFlight]);
    setSelectedFlightId(nextId);
    setScreen('detail');
    setToast('Novo voo adicionado');
    clearToast();
  };

  const updateFlight = (id, key, value) => {
    setFlights((current) =>
      current.map((flight) => {
        if (flight.id !== id) return flight;
        return {
          ...flight,
          [key]: value,
          status: value ? 'ready' : flight.status,
        };
      })
    );
  };

  const deleteFlight = (id) => {
    setFlights((current) => current.filter((flight) => flight.id !== id));
    if (screen === 'detail' && selectedFlightId === id) setScreen('control');
    setToast('Voo removido');
    clearToast();
  };

  const clearToast = () => setTimeout(() => setToast(''), 1800);

  const generatePdf = () => {
    const doc = new jsPDF();
    doc.setFillColor(13, 22, 34);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(255, 204, 71);
    doc.setFontSize(22);
    doc.text('RELATÓRIO DE EMBARQUE', 14, 20);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    flights.forEach((flight, index) => {
      const y = 45 + index * 30;
      doc.setTextColor(255, 204, 71);
      doc.text(`Voo ${flight.number || `#${index + 1}`}`, 14, y);
      doc.setTextColor(255, 255, 255);
      doc.text(`Destino: ${flight.destination || '-'}`, 65, y);
      doc.text(`Horário: ${flight.time || '-'}`, 14, y + 7);
      doc.text(`Agente: ${flight.agent || '-'}`, 65, y + 7);
      doc.text(`Portão: ${flight.gate || '-'}`, 14, y + 14);
      doc.text(`Observação: ${flight.note || '-'}`, 65, y + 14);
      doc.setDrawColor(255, 204, 71);
      doc.line(14, y + 18, 196, y + 18);
    });

    doc.save('relatorio-embarque.pdf');
    setToast('PDF gerado com sucesso');
    clearToast();
  };

  return (
    <div className="app-shell">
      {screen === 'control' && (
        <div className="control-screen">
          <div className="headline-row">
            <h1>CONTROLE DE VOOS <span>• 3</span></h1>
            <button className="new-flight-btn" onClick={addFlight}>
              <span>NOVO VOO</span>
              <strong>＋</strong>
            </button>
          </div>

          <div className="flight-list">
            {visibleFlights.map((flight, index) => (
              <button
                key={flight.id}
                className="flight-card"
                onClick={() => {
                  setSelectedFlightId(flight.id);
                  setScreen('diary');
                }}
              >
                <span className="flight-index">{String(index + 1).padStart(2, '0')}</span>
                <div className="flight-summary">
                  <div className="flight-main">
                    <span className="dot" />
                    <strong>{flight.number || 'Voo 3'}</strong>
                    <span className="arrow-right">→</span>
                    <span>{flight.destination || 'DESTINO'}</span>
                  </div>
                  <div className="flight-meta">
                    <span>{flight.time || '--:--'}</span>
                    <span>•</span>
                    <span>{flight.agent || 'Agente'}</span>
                    <span>•</span>
                    <span>{flight.photos || 0} fotos</span>
                  </div>
                </div>
                <span className="chevron">⌄</span>
              </button>
            ))}
          </div>

          <div className="search-box">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por número do voo ou dest"
              aria-label="Buscar voo"
            />
            <button onClick={() => setScreen('control')}>Buscar</button>
          </div>
        </div>
      )}

      {screen === 'diary' && (
        <div className="journal-screen">
          <div className="journal-header">
            <div className="journal-brand">
              <span className="brand-mark small">✈</span>
              <div>
                <h2>DIÁRIO DE</h2>
                <h2 className="title-stack">EMBARQUE</h2>
                <small>2 dias</small>
                <small>pendentes de envio</small>
              </div>
            </div>

            <div className="journal-actions">
              <button>⚙</button>
              <button>◌ Chat</button>
              <button>↪ Sair</button>
            </div>
          </div>

          <div className="journal-card">
            <div className="journal-topline">
              <span className="calendar">◫</span>
              <strong>21/09/2026</strong>
              <span className="chevron">⌄</span>
              <div className="float-name">Leandro Ferrari</div>
            </div>

            <div className="resource-row">
              <div>PDA</div>
              <div>MOCHILA</div>
              <div>RÁDIO</div>
              <div>DWS</div>
            </div>

            <div className="counter-row">
              <span>3049</span>
            </div>

            <div className="separator" />

            <div className="day-title">VOOS DO DIA</div>

            {flights.map((flight, index) => (
              <div
                key={flight.id}
                className="day-flight-row"
                onClick={() => {
                  setSelectedFlightId(flight.id);
                  setScreen('detail');
                }}
              >
                <span className="flight-no">{String(index + 1).padStart(2, '0')}</span>
                <div className="day-flight-main">
                  <span className="flight-dot" />
                  <span className="day-number">{flight.number || `Voo ${index + 1}`}</span>
                  <span className="route-separator">→</span>
                  <span className="day-destination">{flight.destination || 'DESTINO'}</span>
                </div>
                <div className="day-flight-meta">
                  <span>{flight.time || '00:00'}</span>
                  <span>•</span>
                  <span>{flight.agent || 'Agente'}</span>
                  <span>•</span>
                  <span>{flight.photos || 0} fotos</span>
                </div>
                <span className="chevron-mini">⌄</span>
              </div>
            ))}

            <button className="add-line-btn" onClick={addFlight}>＋ Adicionar linha</button>

            <div className="observations">
              <h3>OBSERVAÇÕES DO DIA A RELATAR</h3>
              <textarea
                value={selectedFlight?.note || ''}
                onChange={(e) => updateFlight(selectedFlight.id, 'note', e.target.value)}
                placeholder="Escreva uma observação..."
              />
            </div>
          </div>
        </div>
      )}

      {screen === 'detail' && selectedFlight && (
        <div className="detail-screen">
          <div className="detail-header">
            <div className="detail-index-box">{String((flights.findIndex((flight) => flight.id === selectedFlight.id) + 1) || 1).padStart(2, '0')}</div>
            <div className="detail-title-line">
              <span className="detail-red" />
              <strong>{selectedFlight.number || 'Voo 3'}</strong>
              <small>{selectedFlight.photos || 0} fotos</small>
            </div>
            <button className="icon-close" onClick={() => setScreen('diary')}>⌃</button>
          </div>

          <div className="detail-panel">
            <div className="section-label">IDENTIFICAÇÃO</div>
            <div className="detail-grid compact-grid">
              <Field label="VOO" value={selectedFlight.number} onChange={(value) => updateFlight(selectedFlight.id, 'number', value)} />
              <Field label="DESTINO" value={selectedFlight.destination} onChange={(value) => updateFlight(selectedFlight.id, 'destination', value)} />
              <Field label="HORÁRIO" value={selectedFlight.time} onChange={(value) => updateFlight(selectedFlight.id, 'time', value)} />
              <Field label="CONTROLE" value={selectedFlight.control || '03'} onChange={(value) => updateFlight(selectedFlight.id, 'control', value)} />
              <Field label="RAMAL" value={''} />
              <Field label="PREFIXO" value={''} />
              <Field label="POSIÇÃO" value={''} />
              <Field label="META" value={''} />
            </div>

            <div className="section-label">TRIP / RESERVA</div>
            <div className="detail-grid compact-grid">
              <Field label="BAGS RETIDAS" value={''} />
              <Field label="TRIP NO PORTÃO" value={''} />
              <Field label="SAÍDA" value={''} />
              <Field label="TRIP" value={''} />
              <Field label="RESERVA" value={''} />
            </div>

            <div className="section-label">EMBARQUE</div>
            <div className="detail-grid compact-grid bordered-box">
              <Field label="INÍCIO DO EMBARQUE" value={''} />
              <Field label="LIBERADO" value={''} />
              <Field label="TÉRMINO DO EMBARQUE" value={''} />
            </div>

            <div className="section-label">PASSAGEIROS</div>
            <div className="detail-grid compact-grid">
              <Field label="FALTANTES" value={''} />
              <Field label="COM BAGS" value={''} />
              <Field label="TOTAL" value={''} />
            </div>

            <div className="detail-grid compact-grid">
              <Field label="HORA ÚLT. PAX" value={''} />
              <Field label="HORA PORTA" value={''} />
            </div>

            <div className="detail-grid compact-grid">
              <Field label="DELTAS" value={''} />
              <Field label="DELTA 1" value={''} />
              <Field label="DELTA 2" value={''} />
              <Field label="DELTA 3" value={''} />
              <Field label="DELTA 4" value={''} />
              <Field label="VAN" value={''} />
            </div>

            <div className="section-label">SERVIÇOS E OBSERVAÇÕES</div>
            <div className="detail-grid compact-grid">
              <Field label="OBSERVAÇÕES DO VOO" value={selectedFlight.note} onChange={(value) => updateFlight(selectedFlight.id, 'note', value)} />
            </div>

            <div className="bottom-actions">
              <label className="upload-button">
                <span>📷</span>
                Adicionar foto
                <input type="file" accept="image/*" multiple onChange={(e) => { /* no-op */ }} />
              </label>
              <button className="report-button" onClick={generatePdf}>GERAR RELATÓRIO</button>
              <button className="delete-button" onClick={() => deleteFlight(selectedFlight.id)}>🗑</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Field({ label, value = '', onChange }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange?.(e.target.value)} />
    </label>
  );
}
