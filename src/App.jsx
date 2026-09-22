import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { getDays, getUserProfile, loginUser, saveDay } from './api';

const STORAGE_KEY = 'new-wap-days-cache';
const USER_KEY = 'new-wap-user';
const TOKEN_KEY = 'new-wap-token';
const DATE_KEY = 'new-wap-selected-date';
const BRAND_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=85';

const seedFlights = [
  { id: 1, number: '3416', destination: 'POA', time: '07:35', agent: 'Renato', gate: '217', control: '01', note: '', photos: [] },
  { id: 2, number: '3592', destination: 'IOS', time: '10:25', agent: 'Renato', gate: '222', control: '02', note: '', photos: [] },
  { id: 3, number: '3200', destination: 'IGU', time: '12:10', agent: 'Leandro', gate: '208', control: '03', note: '', photos: [] },
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
  photos: [],
});

const normalizeDay = (raw = {}, dateKey = new Date().toISOString().slice(0, 10)) => ({
  date: raw.date || dateKey,
  flights: Array.isArray(raw.flights) && raw.flights.length ? raw.flights : seedFlights,
  note: raw.note || '',
  synced: raw.synced !== false,
  updatedAt: raw.updatedAt || new Date().toISOString(),
});

const readDayCache = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
};

const writeDayCache = (days) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
};

export default function App() {
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('usuario@embarque.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      return value || null;
    } catch {
      return null;
    }
  });
  const [days, setDays] = useState(() => readDayCache());
  const [selectedDate, setSelectedDate] = useState(() => localStorage.getItem(DATE_KEY) || new Date().toISOString().slice(0, 10));
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState('');
  const [dayNote, setDayNote] = useState(() => {
    const cached = readDayCache();
    const today = new Date().toISOString().slice(0, 10);
    return cached?.[today]?.note || '';
  });

  const selectedDay = useMemo(
    () => normalizeDay(days[selectedDate], selectedDate),
    [days, selectedDate]
  );

  const selected = useMemo(
    () => selectedDay.flights.find((flight) => flight.id === selectedId) || selectedDay.flights[0] || defaultFlight(Date.now()),
    [selectedDay, selectedId]
  );

  const filtered = useMemo(
    () => selectedDay.flights.filter((flight) => `${flight.number} ${flight.destination} ${flight.agent} ${flight.time}`.toLowerCase().includes(query.trim().toLowerCase())),
    [query, selectedDay.flights]
  );

  useEffect(() => {
    localStorage.setItem(DATE_KEY, selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem(USER_KEY);
      return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    const next = { ...(days || {}), [selectedDate]: { ...normalizeDay(days[selectedDate], selectedDate), note: dayNote } };
    setDays((current) => ({ ...current, ...next }));
    writeDayCache({ ...readDayCache(), ...next });
  }, [dayNote, selectedDate]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const hydrate = async () => {
      try {
        const profile = await getUserProfile();
        setUser(profile);

        const remoteDays = await getDays();
        if (remoteDays && typeof remoteDays === 'object') {
          const merged = { ...readDayCache(), ...remoteDays };
          setDays(merged);
          writeDayCache(merged);
        }

        setScreen('dashboard');
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      }
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (!user || !selectedDate) return;

    const timeout = setTimeout(async () => {
      const payload = {
        date: selectedDate,
        flights: selectedDay.flights,
        note: dayNote,
        synced: true,
        updatedAt: new Date().toISOString(),
      };

      try {
        const saved = await saveDay(selectedDate, payload);
        const merged = { ...readDayCache(), [selectedDate]: { ...normalizeDay(saved || payload, selectedDate), synced: true } };
        setDays((current) => ({ ...current, [selectedDate]: merged[selectedDate] }));
        writeDayCache(merged);
      } catch {
        const merged = { ...readDayCache(), [selectedDate]: { ...payload, synced: false } };
        setDays((current) => ({ ...current, [selectedDate]: merged[selectedDate] }));
        writeDayCache(merged);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [selectedDate, user, selectedDay.flights, dayNote]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const login = async (event) => {
    event.preventDefault();
    if (!email.trim() || !email.includes('@')) return setError('Informe um e-mail válido.');
    if (!password.trim()) return setError('Informe sua senha.');

    try {
      setLoading(true);
      const result = await loginUser(email, password);
      setUser(result.user);
      const remoteDays = await getDays();
      if (remoteDays && typeof remoteDays === 'object') {
        const merged = { ...readDayCache(), ...remoteDays };
        setDays(merged);
        writeDayCache(merged);
      }
      setScreen('dashboard');
      notify('Login realizado');
      setError('');
    } catch (err) {
      setError(err.message || 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  const updateFlight = (id, field, value) => {
    setDays((current) => {
      const currentDayValue = normalizeDay(current[selectedDate], selectedDate);
      const nextFlights = currentDayValue.flights.map((flight) =>
        flight.id === id ? { ...flight, [field]: value } : flight
      );

      const nextDay = {
        ...currentDayValue,
        flights: nextFlights,
        synced: false,
        updatedAt: new Date().toISOString(),
      };

      const next = { ...current, [selectedDate]: nextDay };
      writeDayCache(next);
      return next;
    });
  };

  const addFlight = () => {
    const nextId = Date.now();
    setDays((current) => {
      const day = normalizeDay(current[selectedDate], selectedDate);
      const nextDay = {
        ...day,
        flights: [...day.flights, defaultFlight(nextId)],
        synced: false,
        updatedAt: new Date().toISOString(),
      };
      const next = { ...current, [selectedDate]: nextDay };
      writeDayCache(next);
      return next;
    });
    setSelectedId(nextId);
    setScreen('detail');
    notify('Novo voo adicionado');
  };

  const removeFlight = () => {
    setDays((current) => {
      const day = normalizeDay(current[selectedDate], selectedDate);
      const nextDay = {
        ...day,
        flights: day.flights.filter((flight) => flight.id !== selected.id),
        synced: false,
        updatedAt: new Date().toISOString(),
      };
      const next = { ...current, [selectedDate]: nextDay };
      writeDayCache(next);
      return next;
    });
    setScreen('dashboard');
    notify('Voo removido');
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setScreen('login');
    setError('');
    notify('Sessão encerrada');
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
    doc.text(`Data: ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR')} | ${user?.name || 'Leandro Ferrari'}`, 14, y + 10);

    selectedDay.flights.forEach((flight, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setTextColor(245, 198, 72);
      doc.setFontSize(12);
      doc.text(`VOO ${flight.number || index + 1} → ${flight.destination || '-'}`, 14, y + 18);
      doc.setTextColor(240, 245, 252);
      doc.setFontSize(9);
      doc.text(`Horário: ${flight.time || '-'} | Agente: ${flight.agent || '-'} | Portão: ${flight.gate || '-'}`, 14, y + 26);
      doc.text(`Observação: ${flight.note || '-'}`, 14, y + 34);
      y += 38;
    });

    doc.setTextColor(245, 198, 72);
    doc.text('OBSERVAÇÕES DO DIA', 14, y + 14);
    doc.setTextColor(240, 245, 252);
    doc.text(doc.splitTextToSize(dayNote || 'Nenhuma observação cadastrada.', 180), 14, y + 22);
    doc.save('relatorio-embarque.pdf');
    notify('PDF gerado com sucesso');
  };

  const historyDates = useMemo(() => Object.keys(days).sort((a, b) => b.localeCompare(a)), [days]);

  if (screen === 'login') {
    return (
      <main className="login-screen">
        <form className="login-card" onSubmit={login}>
          <div className="login-logo">✈</div>
          <h2>Diário de<br />Embarque</h2>
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

  if (screen === 'history') {
    return (
      <main className="history-screen">
        <header className="history-header">
          <h2>DIAS REGISTRADOS</h2>
          <button type="button" onClick={() => setScreen('dashboard')}>Voltar</button>
        </header>
        <div className="history-list">
          {historyDates.map((dateKey) => {
            const item = normalizeDay(days[dateKey], dateKey);
            return (
              <div key={dateKey} className="history-card">
                <div>
                  <strong>{dateKey}</strong>
                  <small>{item.flights.length} voos</small>
                </div>
                <div className="history-meta">
                  <span>{item.synced ? 'Nuvem' : 'Local'}</span>
                  <button type="button" onClick={() => { setSelectedDate(dateKey); setScreen('dashboard'); }}>
                    Abrir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  if (screen === 'detail') {
    return (
      <main className="detail-screen">
        <div className="detail-header">
          <div className="detail-index">{String(selectedDay.flights.findIndex((flight) => flight.id === selected.id) + 1).padStart(2, '0')}</div>
          <div className="detail-title-wrap">
            <i className="red-dot" />
            <strong>{selected.number || 'Voo'}</strong>
            <small>{selected.photos.length}/10 fotos</small>
          </div>
          <button className="mini-up" type="button" onClick={() => setScreen('dashboard')}>⌃</button>
        </div>

        <section className="detail-panel">
          <h2 className="section-title">DADOS DO VOO</h2>
          <div className="field-grid two-cols">
            {[
              ['number', 'VOO'],
              ['destination', 'DESTINO'],
              ['time', 'HORÁRIO'],
              ['agent', 'AGENTE'],
              ['gate', 'PORTÃO'],
              ['control', 'CONTROLE'],
            ].map(([field, label]) => (
              <Field
                key={field}
                label={label}
                value={selected[field] || ''}
                onChange={(value) => updateFlight(selected.id, field, value)}
              />
            ))}
          </div>

          <h2 className="section-title">SERVIÇOS E OBSERVAÇÕES</h2>
          <textarea
            className="detail-note"
            value={selected.note || ''}
            onChange={(event) => updateFlight(selected.id, 'note', event.target.value)}
          />

          <div className="actions-row">
            <label className="upload-button">
              📷 Câmera
              <input type="file" accept="image/*" capture="environment" onChange={(event) => {
                const files = [...event.target.files];
                for (const file of files) {
                  if (selected.photos.length >= 10) break;
                  updateFlight(selected.id, 'photos', [...selected.photos, { name: file.name, url: URL.createObjectURL(file) }]);
                }
                event.target.value = '';
              }} />
            </label>

            <label className="upload-button secondary">
              🖼 Galeria
              <input type="file" accept="image/*" multiple onChange={(event) => {
                const files = [...event.target.files];
                for (const file of files) {
                  if (selected.photos.length >= 10) break;
                  updateFlight(selected.id, 'photos', [...selected.photos, { name: file.name, url: URL.createObjectURL(file) }]);
                }
                event.target.value = '';
              }} />
            </label>

            <button className="report-button" type="button" onClick={generatePdf}>Gerar relatório</button>
            <button className="trash-button" type="button" onClick={removeFlight}>🗑</button>
          </div>

          {selected.photos.length > 0 && (
            <div className="thumbs">
              {selected.photos.map((photo) => (
                <img key={photo.url || photo.name} src={photo.url} alt={photo.name} />
              ))}
            </div>
          )}
        </section>

        {toast && <Toast text={toast} />}
      </main>
    );
  }

  return (
    <main className="dashboard-screen">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" style={{ backgroundImage: `url(${BRAND_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' }}>✈</div>
          <div className="brand-copy">
            <h1>DIÁRIO DE<br />EMBARQUE</h1>
            <p>{selectedDay.flights.length} voos cadastrados</p>
          </div>
        </div>

        <div className="actions-wrap">
          <div className="actions">
            <button type="button" className={selectedDay.synced ? 'sync-btn active' : 'sync-btn'} onClick={() => notify(selectedDay.synced ? 'Sincronizado' : 'Sincronização pendente')}>⠿</button>
            <button type="button" onClick={() => setScreen('history')}>Histórico</button>
            <button type="button" onClick={() => setScreen('login')}>Sair</button>
          </div>
          <div className="user-mini">{user?.name || 'Leandro Ferrari'}</div>
        </div>
      </header>

      <section className="content-panel">
        <div className="date-row">
          <label className="date-box">
            <span className="cal-icon">▣</span>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <div className="user-box">{user?.name || 'Leandro Ferrari'}</div>
        </div>

        <div className="meta-grid">
          <label className="meta-label"><span>PDA</span><input value="" placeholder="-" /></label>
          <label className="meta-label"><span>MOCHILA</span><input value="" placeholder="-" /></label>
          <label className="meta-label"><span>RÁDIO</span><input value="" placeholder="-" /></label>
          <label className="meta-label"><span>DWS</span><input value="" placeholder="-" /></label>
        </div>

        <div className="dashed-divider" />
        <div className="section-label">VOOS DO DIA</div>

        <div className="search-box">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar voo, destino ou agente" />
          <button type="button">Busca</button>
        </div>

        <div className="flight-list">
          {filtered.map((flight, index) => (
            <button className="flight-card" type="button" key={flight.id} onClick={() => { setSelectedId(flight.id); setScreen('detail'); }}>
              <div className="flight-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="flight-summary">
                <div className="flight-route"><span className="status-dot" />{flight.number || 'VOO'} <span className="arrow-route">→</span> {flight.destination || 'DESTINO'}</div>
                <div className="flight-meta">{flight.time || '--:--'} · Portão {flight.gate || '--'} · {flight.agent || 'Sem agente'}</div>
              </div>
              <span className="chevron-open">›</span>
            </button>
          ))}
        </div>

        <button className="add-row" type="button" onClick={addFlight}>＋ ADICIONAR VOO</button>

        <div className="observation-box">
          <label>OBSERVAÇÕES DO DIA</label>
          <textarea value={dayNote} onChange={(event) => setDayNote(event.target.value)} placeholder="Digite uma observação..." />
        </div>
      </section>

      {toast && <Toast text={toast} />}
    </main>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <input value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Toast({ text }) {
  return <div className="toast">✓ {text}</div>;
}
