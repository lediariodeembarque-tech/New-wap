import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { getDays, getUserProfile, loginUser, saveDay } from './api';

const STORAGE_KEY = 'new-wap-local-flights';
const NOTE_KEY = 'new-wap-local-note';

const seedFlights = [
  { id: 1, number: '123', destination: 'GRU', time: '08:30', agent: 'Leandro', gate: 'A12', control: '01', note: '', photos: [] },
  { id: 2, number: '456', destination: 'SDU', time: '10:15', agent: 'Fernanda', gate: 'B04', control: '02', note: '', photos: [] },
  { id: 3, number: '789', destination: 'CWB', time: '12:50', agent: 'Rafael', gate: 'C07', control: '03', note: '', photos: [] }
];

const sections = [
  ['IDENTIFICAÇÃO', [['number', 'VOO'], ['destination', 'DESTINO'], ['time', 'HORÁRIO'], ['control', 'CONTROLE'], ['agent', 'AGENTE'], ['gate', 'PORTÃO']]],
  ['TRIP / RESERVA', [['trip', 'TRIP'], ['reservation', 'RESERVA'], ['bags', 'BAGS RETIDAS'], ['departure', 'SAÍDA']]],
  ['EMBARQUE', [['boardingStart', 'INÍCIO DO EMBARQUE'], ['released', 'LIBERADO'], ['boardingEnd', 'TÉRMINO DO EMBARQUE']]],
  ['PASSAGEIROS', [['missing', 'FALTANTES'], ['withBags', 'COM BAGS'], ['total', 'TOTAL'], ['lastPassenger', 'HORA ÚLT. PAX'], ['gateTime', 'HORA PORTA']]]
];

const defaultFlight = (id) => ({
  id,
  number: '',
  destination: '',
  time: '',
  agent: '',
  gate: '',
  control: String(id).padStart(2, '0'),
  note: '',
  photos: []
});

const defaultDayData = (valueDate = new Date().toISOString().slice(0, 10)) => ({
  date: valueDate,
  flights: seedFlights,
  note: ''
});

const writeDays = (days) => localStorage.setItem(STORAGE_KEY, JSON.stringify(days));

export default function App() {
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('usuario@embarque.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [flights, setFlights] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved?.flights || saved || seedFlights;
    } catch {
      return seedFlights;
    }
  });
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState('');
  const [dayNote, setDayNote] = useState(() => localStorage.getItem(NOTE_KEY) || '');
  const [toast, setToast] = useState('');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('new-wap-user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const payload = Array.isArray(flights) ? flights : seedFlights;
    writeDays(JSON.stringify({ flights: payload, note: dayNote, date: today }));
    localStorage.setItem(NOTE_KEY, dayNote);
  }, [flights, dayNote, today]);

  useEffect(() => {
    const token = localStorage.getItem('new-wap-token');
    if (!token) return;

    const hydrateSession = async () => {
      try {
        const profile = await getUserProfile();
        setUser(profile);
        const serverDays = await getDays();
        const todayDay = serverDays?.[today];

        if (todayDay) {
          setFlights(todayDay.flights || seedFlights);
          setDayNote(todayDay.note || '');
          setSelectedId((todayDay.flights && todayDay.flights[0]?.id) || 1);
        }

        setScreen('dashboard');
      } catch {
        localStorage.removeItem('new-wap-token');
        localStorage.removeItem('new-wap-user');
        setUser(null);
      }
    };

    hydrateSession();
  }, [today]);

  useEffect(() => {
    if (!user) return;

    const syncDay = async () => {
      try {
        await saveDay(today, { flights, note: dayNote, date: today, updatedAt: new Date().toISOString() });
      } catch {
        // local persistence remains available even if remote sync fails
      }
    };

    syncDay();
  }, [dayNote, flights, today, user]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const selected = flights.find((flight) => flight.id === selectedId) || flights[0];
  const filtered = useMemo(
    () => flights.filter((flight) => `${flight.number} ${flight.destination} ${flight.agent} ${flight.time}`.toLowerCase().includes(query.toLowerCase().trim())),
    [flights, query]
  );

  const login = async (event) => {
    event.preventDefault();
    if (!email.trim() || !email.includes('@')) return setError('Informe um e-mail válido.');
    if (!password.trim()) return setError('Informe sua senha.');

    try {
      setLoading(true);
      setError('');
      const result = await loginUser(email, password);
      setUser(result.user);

      const serverDays = await getDays();
      const todayDay = serverDays?.[today];

      if (todayDay?.flights) {
        setFlights(todayDay.flights);
        setDayNote(todayDay.note || '');
      }

      setScreen('dashboard');
      notify('Login realizado');
    } catch (authError) {
      setError(authError.message || 'Falha ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  const update = (id, field, value) => {
    setFlights((current) => current.map((flight) => (flight.id === id ? { ...flight, [field]: value } : flight)));
  };

  const addFlight = () => {
    const id = Date.now();
    setFlights((current) => [...current, defaultFlight(id)]);
    setSelectedId(id);
    setScreen('detail');
    notify('Novo voo adicionado');
  };

  const removeFlight = () => {
    setFlights((current) => current.filter((flight) => flight.id !== selected.id));
    setScreen('dashboard');
    notify('Voo removido');
  };

  const addPhotos = (event) => {
    const files = [...event.target.files].slice(0, 10 - selected.photos.length);
    const photos = files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    update(selected.id, 'photos', [...selected.photos, ...photos]);
    event.target.value = '';
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    let y = 18;
    doc.setFillColor(13, 27, 43);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(245, 198, 72);
    doc.setFontSize(19);
    doc.text('RELATÓRIO DE EMBARQUE', 14, y);
    doc.setTextColor(240, 245, 252);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} | ${user?.name || 'Leandro Ferrari'}`, 14, (y += 10));

    flights.forEach((flight, index) => {
      if (y > 260) {
        doc.addPage();
        y = 18;
      }
      doc.setTextColor(245, 198, 72);
      doc.setFontSize(12);
      doc.text(`VOO ${flight.number || index + 1} → ${flight.destination || '-'}`, 14, (y += 15));
      doc.setTextColor(240, 245, 252);
      doc.setFontSize(9);
      doc.text(`Horário: ${flight.time || '-'} | Agente: ${flight.agent || '-'} | Portão: ${flight.gate || '-'}`, 14, (y += 7));
      doc.text(`Observação: ${flight.note || '-'}`, 14, (y += 7));
    });

    doc.setTextColor(245, 198, 72);
    doc.text('OBSERVAÇÕES DO DIA', 14, (y += 16));
    doc.setTextColor(240, 245, 252);
    doc.text(doc.splitTextToSize(dayNote || 'Nenhuma observação cadastrada.', 180), 14, (y += 7));
    doc.save('relatorio-embarque.pdf');
    notify('PDF gerado com sucesso');
  };

  const logout = () => {
    localStorage.removeItem('new-wap-token');
    localStorage.removeItem('new-wap-user');
    setUser(null);
    setScreen('login');
    setError('');
    notify('Sessão encerrada');
  };

  if (screen === 'login') {
    return (
      <main className="login-screen">
        <form className="login-card" onSubmit={login}>
          <div className="login-logo">✈</div>
          <h2>
            Diário de
            <br />
            Embarque
          </h2>
          <div className="field-login">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="field-login">
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        {toast && <Toast text={toast} />}
      </main>
    );
  }

  if (screen === 'dashboard') {
    return (
      <main className="dashboard-screen">
        <header className="topbar">
          <div className="brand-block">
            <div className="brand-mark">✈</div>
            <div className="brand-copy">
              <h1>
                DIÁRIO DE
                <br />
                EMBARQUE
              </h1>
              <p>2 dias pendentes de envio</p>
            </div>
          </div>
          <nav className="actions">
            <button type="button" onClick={() => notify('Configurações salvas')}>⚙</button>
            <button type="button" onClick={() => notify('Chat em breve')}>Chat</button>
            <button type="button" onClick={logout}>Sair</button>
          </nav>
        </header>

        <section className="content-panel">
          <div className="date-row">
            <div className="date-box">
              ◫ <strong>{new Date().toLocaleDateString('pt-BR')}</strong>⌄
            </div>
            <div className="user-box">{user?.name || 'Leandro Ferrari'}</div>
          </div>

          <div className="meta-grid">
            <span>PDA</span>
            <span>MOCHILA</span>
            <span>RÁDIO</span>
            <span>DWS</span>
          </div>

          <div className="counter-row">3049</div>
          <div className="dashed-divider" />
          <h2 className="section-label">VOOS DO DIA</h2>

          <div className="search-box">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por voo ou destino" />
            <button type="button">Buscar</button>
          </div>

          <div className="flight-list">
            {filtered.map((flight, index) => (
              <button
                className="flight-card"
                type="button"
                key={flight.id}
                onClick={() => {
                  setSelectedId(flight.id);
                  setScreen('detail');
                }}
              >
                <span className="flight-index">{String(index + 1).padStart(2, '0')}</span>
                <div className="flight-summary">
                  <div className="flight-route">
                    <i className={`status-dot ${flight.number ? '' : 'pending'}`} />
                    <strong>{flight.number || `Voo ${index + 1}`}</strong>
                    <span>→</span>
                    <span>{flight.destination || 'Destino'}</span>
                  </div>
                  <div className="flight-meta">
                    {flight.time || '--:--'}　·　{flight.agent || 'Agente'}　·　{flight.photos.length} fotos
                  </div>
                </div>
                <span className="chevron-open">⌄</span>
              </button>
            ))}
          </div>

          <button className="add-row" type="button" onClick={addFlight}>＋ Adicionar linha</button>

          <div className="observation-box">
            <label>OBSERVAÇÕES DO DIA A RELATAR</label>
            <textarea value={dayNote} onChange={(event) => setDayNote(event.target.value)} placeholder="Escreva uma observação..." />
          </div>
        </section>

        {toast && <Toast text={toast} />}
      </main>
    );
  }

  return (
    <main className="detail-screen">
      <div className="detail-header">
        <div className="detail-index">{String(flights.findIndex((flight) => flight.id === selected.id) + 1).padStart(2, '0')}</div>
        <div className="detail-title-wrap">
          <i className="red-dot" />
          <strong>{selected.number || 'Voo'}</strong>
          <small>{selected.photos.length}/10 fotos</small>
        </div>
        <button className="mini-up" type="button" onClick={() => setScreen('dashboard')}>⌃</button>
      </div>

      <section className="detail-panel">
        {sections.map(([title, fields]) => (
          <section key={title}>
            <h2 className="section-title">{title}</h2>
            <div className={`field-grid ${title === 'EMBARQUE' ? 'bordered-box' : ''}`}>
              {fields.map(([key, label]) => (
                <Field key={key} label={label} value={selected[key] || ''} onChange={(value) => update(selected.id, key, value)} />
              ))}
            </div>
          </section>
        ))}

        <h2 className="section-title">SERVIÇOS E OBSERVAÇÕES</h2>
        <Field label="OBSERVAÇÕES DO VOO" value={selected.note} onChange={(value) => update(selected.id, 'note', value)} />

        <div className="actions-row">
          <label className="upload-button">
            📷 Câmera
            <input type="file" accept="image/*" capture="environment" onChange={addPhotos} />
          </label>
          <label className="upload-button secondary">
            🖼 Galeria
            <input type="file" accept="image/*" multiple onChange={addPhotos} />
          </label>
          <button className="report-button" type="button" onClick={generatePdf}>Gerar relatório</button>
          <button className="trash-button" type="button" onClick={removeFlight}>🗑</button>
        </div>

        {selected.photos.length > 0 && (
          <div className="thumbs">
            {selected.photos.map((photo) => (
              <img key={photo.url} src={photo.url} alt={photo.name} />
            ))}
          </div>
        )}
      </section>

      {toast && <Toast text={toast} />}
    </main>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Toast({ text }) {
  return <div className="toast">✓ {text}</div>;
}
