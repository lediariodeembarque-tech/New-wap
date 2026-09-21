import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';

const initialFlights = [
  { id: 1, number: '3416', destination: 'POA', time: '07:35', agent: 'Renato', photos: 0, status: 'ready', note: 'Planilha: 07:35 · POA · Portão 217' },
  { id: 2, number: '3592', destination: 'IOS', time: '10:25', agent: 'Renato', photos: 0, status: 'ready', note: 'Planilha: 10:25 · IOS · Portão 222' },
  { id: 3, number: '', destination: '', time: '', agent: '', photos: 0, status: 'pending', note: '' },
];

const defaultForm = { voo: '', destino: '', horario: '', controle: '', ramal: '', prefixo: '', posicao: '', meta: '', bagsRetidas: '', tripPortao: '', saida: '', trip: '', reserva: '', inicioEmbarque: '', liberado: '', terminoEmbarque: '', faltantes: '', comBags: '', total: '', ultimaPax: '', horaPorta: '', delta1: '', delta2: '', delta3: '', delta4: '', van: '', observacoes: '' };

export default function App() {
  const [screen, setScreen] = useState('login');
  const [flights, setFlights] = useState(initialFlights);
  const [selectedId, setSelectedId] = useState(initialFlights[0].id);
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [toast, setToast] = useState('');

  const filteredFlights = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return flights;
    return flights.filter((flight) => {
      const content = `${flight.number} ${flight.destination} ${flight.agent} ${flight.time}`.toLowerCase();
      return content.includes(term);
    });
  }, [flights, query]);

  const selectedFlight = flights.find((flight) => flight.id === selectedId) ?? flights[0] ?? null;

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => setToast(''), 2000);
  };

  const updateSelectedForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const updateFlight = (id, field, value) => {
    setFlights((current) =>
      current.map((flight) => {
        if (flight.id !== id) return flight;
        return { ...flight, [field]: value, status: value ? 'ready' : flight.status };
      })
    );
  };

  const addFlight = () => {
    const newId = Date.now();
    const newFlight = { id: newId, number: '', destination: '', time: '', agent: '', photos: 0, status: 'pending', note: '' };
    setFlights((current) => [...current, newFlight]);
    setSelectedId(newId);
    setForm(defaultForm);
    setScreen('detail');
    showToast('Novo voo adicionado');
  };

  const removeFlight = (id) => {
    setFlights((current) => current.filter((flight) => flight.id !== id));
    if (selectedId === id) setScreen('dashboard');
    showToast('Voo removido');
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    doc.setFillColor(13, 22, 34);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(255, 196, 42);
    doc.setFontSize(20);
    doc.text('RELATÓRIO DE EMBARQUE', 14, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    let y = 40;
    flights.forEach((flight, index) => {
      doc.setTextColor(255, 196, 42);
      doc.text(`Voo ${flight.number || `#${index + 1}`}`, 14, y);
      y += 7;
      doc.setTextColor(255, 255, 255);
      doc.text(`Destino: ${flight.destination || '-'} | Horário: ${flight.time || '-'} | Agente: ${flight.agent || '-'}`, 14, y);
      y += 7;
      doc.text(`Observações: ${flight.note || '-'}`, 14, y);
      y += 12;
    });

    doc.setTextColor(255, 196, 42);
    doc.text('OBSERVAÇÕES DO DIA', 14, y + 8);
    doc.setTextColor(255, 255, 255);
    doc.text(doc.splitTextToSize(note || 'Nenhuma observação cadastrada.', 170), 14, y + 20);

    doc.save('relatorio-embarque.pdf');
    showToast('PDF gerado');
  };

  const handleLogin = () => {
    setScreen('dashboard');
    showToast('Login realizado');
  };

  return (
    <div className="app-shell">
      {screen === 'login' && (
        <div className="login-screen">
          <div className="login-card">
            <div className="login-logo">✈</div>
            <h2>Diário de<br />Embarque</h2>
            <div className="field-login">
              <label>Email</label>
              <input defaultValue="usuario@embarque.com" />
            </div>
            <div className="field-login">
              <label>Senha</label>
              <input type="password" defaultValue="123456" />
            </div>
            <button className="primary-btn" onClick={handleLogin}>Entrar</button>
          </div>
        </div>
      )}

      {screen === 'dashboard' && (
        <div className="dashboard-screen">
          <header className="topbar">
            <div className="brand-block">
              <div className="brand-mark">✈</div>
              <div className="brand-copy">
                <h1>DIÁRIO DE<br />EMBARQUE</h1>
                <p>2 dias pendentes de envio</p>
              </div>
            </div>
            <nav className="actions">
              <button type="button">⚙</button>
              <button type="button">Chat</button>
              <button type="button">Sair</button>
            </nav>
          </header>

          <main className="content-panel">
            <div className="date-row">
              <div className="date-box">
                <span className="cal-icon">◫</span>
                <strong>21/09/2026</strong>
                <span className="chev">⌄</span>
              </div>
              <div className="user-box">Leandro Ferrari</div>
            </div>

            <div className="meta-grid">
              <div><span>PDA</span></div>
              <div><span>MOCHILA</span></div>
              <div><span>RÁDIO</span></div>
              <div><span>DWS</span></div>
            </div>

            <div className="counter-row">3049</div>
            <div className="dashed-divider" />

            <div className="section-label">Voos do dia</div>

            <div className="search-box">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por voo, destino ou agente" />
              <button type="button">Buscar</button>
            </div>

            <div className="flight-list">
              {filteredFlights.map((flight, index) => (
                <button key={flight.id} type="button" className="flight-card" onClick={() => { setSelectedId(flight.id); setScreen('detail'); }}>
                  <span className="flight-index">{String(index + 1).padStart(2, '0')}</span>
                  <div className="flight-summary">
                    <div className="flight-route">
                      <span className="status-dot" />
                      <strong>{flight.number || 'Voo'}</strong>
                      <span className="arrow-route">→</span>
                      <span>{flight.destination || 'Destino'}</span>
                    </div>
                    <div className="flight-meta">
                      <span>{flight.time || '--:--'}</span>
                      <span>•</span>
                      <span>{flight.agent || 'Renato'}</span>
                      <span>•</span>
                      <span>{flight.photos || 0} fotos</span>
                    </div>
                  </div>
                  <span className="chevron-open">⌄</span>
                </button>
              ))}
            </div>

            <button type="button" className="add-row" onClick={addFlight}>＋ Adicionar linha</button>

            <div className="observation-box">
              <label>Observações do dia a relatar</label>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Escreva uma observação..." />
            </div>
          </main>
        </div>
      )}

      {screen === 'detail' && selectedFlight && (
        <div className="detail-screen">
          <div className="detail-header">
            <div className="detail-index">{String(flights.findIndex((flight) => flight.id === selectedFlight.id) + 1 || 1).padStart(2, '0')}</div>
            <div className="detail-title-wrap">
              <span className="red-dot" />
              <strong>{selectedFlight.number || 'Voo'}</strong>
              <small>{selectedFlight.photos || 0} fotos</small>
            </div>
            <button type="button" className="mini-up" onClick={() => setScreen('dashboard')}>⌃</button>
          </div>

          <div className="detail-panel">
            <div className="section-title">Identificação</div>
            <div className="field-grid two-cols">
              <Field label="VOO" value={selectedFlight.number || ''} onChange={(value) => updateFlight(selectedFlight.id, 'number', value)} />
              <Field label="DESTINO" value={selectedFlight.destination || ''} onChange={(value) => updateFlight(selectedFlight.id, 'destination', value)} />
              <Field label="HORÁRIO" value={selectedFlight.time || ''} onChange={(value) => updateFlight(selectedFlight.id, 'time', value)} />
              <Field label="CONTROLE" value={selectedFlight.control || ''} onChange={(value) => updateFlight(selectedFlight.id, 'control', value)} />
              <Field label="RAMAL" value={form.ramal} onChange={(value) => updateSelectedForm('ramal', value)} />
              <Field label="PREFIXO" value={form.prefixo} onChange={(value) => updateSelectedForm('prefixo', value)} />
              <Field label="POSIÇÃO" value={form.posicao} onChange={(value) => updateSelectedForm('posicao', value)} />
              <Field label="META" value={form.meta} onChange={(value) => updateSelectedForm('meta', value)} />
            </div>

            <div className="section-title">Trip / Reserva</div>
            <div className="field-grid two-cols">
              <Field label="BAGS RETIDAS" value={form.bagsRetidas} onChange={(value) => updateSelectedForm('bagsRetidas', value)} />
              <Field label="TRIP NO PORTÃO" value={form.tripPortao} onChange={(value) => updateSelectedForm('tripPortao', value)} />
              <Field label="SAÍDA" value={form.saida} onChange={(value) => updateSelectedForm('saida', value)} />
              <Field label="TRIP" value={form.trip} onChange={(value) => updateSelectedForm('trip', value)} />
              <Field label="RESERVA" value={form.reserva} onChange={(value) => updateSelectedForm('reserva', value)} />
            </div>

            <div className="section-title">Embarque</div>
            <div className="field-grid two-cols bordered-box">
              <Field label="INÍCIO DO EMBARQUE" value={form.inicioEmbarque} onChange={(value) => updateSelectedForm('inicioEmbarque', value)} />
              <Field label="LIBERADO" value={form.liberado} onChange={(value) => updateSelectedForm('libiberado', value)} />
              <Field label="TÉRMINO DO EMBARQUE" value={form.terminoEmbarque} onChange={(value) => updateSelectedForm('terminoEmbarque', value)} />
            </div>

            <div className="section-title">Passageiros</div>
            <div className="field-grid two-cols">
              <Field label="FALTANTES" value={form.faltantes} onChange={(value) => updateSelectedForm('faltantes', value)} />
              <Field label="COM BAGS" value={form.comBags} onChange={(value) => updateSelectedForm('comBags', value)} />
              <Field label="TOTAL" value={form.total} onChange={(value) => updateSelectedForm('total', value)} />
            </div>

            <div className="field-grid two-cols">
              <Field label="HORA ÚLT. PAX" value={form.ultimaPax} onChange={(value) => updateSelectedForm('ultimaPax', value)} />
              <Field label="HORA PORTA" value={form.horaPorta} onChange={(value) => updateSelectedForm('horaPorta', value)} />
            </div>

            <div className="field-grid two-cols">
              <Field label="DELTA 1" value={form.delta1} onChange={(value) => updateSelectedForm('delta1', value)} />
              <Field label="DELTA 2" value={form.delta2} onChange={(value) => updateSelectedForm('delta2', value)} />
              <Field label="DELTA 3" value={form.delta3} onChange={(value) => updateSelectedForm('delta3', value)} />
              <Field label="DELTA 4" value={form.delta4} onChange={(value) => updateSelectedForm('delta4', value)} />
              <Field label="VAN" value={form.van} onChange={(value) => updateSelectedForm('van', value)} />
            </div>

            <div className="section-title">Serviços e observações</div>
            <div className="field-grid one-col">
              <Field label="OBSERVAÇÕES DO VOO" value={form.observacoes || selectedFlight.note || ''} onChange={(value) => updateSelectedForm('observacoes', value)} />
            </div>

            <div className="actions-row">
              <label className="upload-button"><span>📷</span>Câmera<input type="file" accept="image/*" capture="environment" /></label>
              <label className="upload-button secondary"><span>🖼</span>Galeria<input type="file" accept="image/*" multiple /></label>
              <button type="button" className="report-button" onClick={generatePdf}>Gerar relatório</button>
              <button type="button" className="trash-button" onClick={() => removeFlight(selectedFlight.id)}>🗑</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}

function Field({ label, value = '', onChange }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange?.(event.target.value)} />
    </label>
  );
}
