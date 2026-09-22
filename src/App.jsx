import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';

const STORAGE_KEY = 'embarque:dias';
const USER_KEY = 'new-wap-user';
const THEME_KEY = 'new-wap-theme';
const BRAND_IMAGE = 'https://raw.githubusercontent.com/lediariodeembarque-tech/New-wap/New-Wap/1790037724898.png';
const DEPARTURE_URL = 'https://ams.gru.com.br/departure.html';

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
  pda: '',
  dws: '',
  radio: '',
  mochila: '',
});

const seedFlights = [
  {
    ...defaultFlight(1),
    number: '3416',
    destination: 'POA',
    time: '07:35',
    agent: 'Renato',
    gate: '217',
    note: 'Planilha: 07:35 · POA · Portão 217',
    pda: '30',
    dws: '49',
    radio: 'OK',
    mochila: 'OK',
  },
  {
    ...defaultFlight(2),
    number: '3592',
    destination: 'IOS',
    time: '10:25',
    agent: 'Renato',
    gate: '222',
    note: 'Planilha: 10:25 · IOS · Portão 222',
    pda: '12',
    dws: '20',
    radio: 'OK',
    mochila: 'OK',
  },
  { ...defaultFlight(3), number: '3200', destination: 'IGU', time: '07:35' },
];

const screenModes = [
  { key: 'auto', label: 'Automático' },
  { key: 'light', label: 'Sempre claro' },
  { key: 'dark', label: 'Sempre escuro' },
];

const wallpaperOptions = [
  '#f2c356', '#3c7ae9', '#f5e8d2', '#ffffff', '#6b1d2b', '#b9713c', '#7a4a2b', '#1ec9d9', '#6d6d6d', '#d76d5d', '#f6dfc1', '#d7ac43', '#e47a1e', '#b592d7', '#5a3f2a', '#d6b36d', '#919191', '#3d2a49', '#f1a6ba', '#7a3a8e', '#ff9e80', '#1d8f65', '#dc3327', '#0d1420',
];

const defaultDayData = (valueDate = new Date().toISOString().slice(0, 10)) => ({
  date: valueDate,
  resources: { pda: '', mochila: '', radio: '', dws: '' },
  flights: seedFlights,
  note: '',
  synced: true,
});

const readDays = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeDays = (days) => localStorage.setItem(STORAGE_KEY, JSON.stringify(days));

const getDayData = (days, date) => {
  const current = days[date] || defaultDayData(date);
  return {
    ...current,
    resources: { ...defaultDayData(date).resources, ...(current.resources || {}) },
    flights: Array.isArray(current.flights) && current.flights.length ? current.flights : seedFlights,
    note: current.note || '',
    synced: current.synced ?? true,
  };
};

export default function App() {
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('usuario@embarque.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [user, setUser] = useState(() => localStorage.getItem(USER_KEY) || 'Leandro Ferrari');
  const [theme, setTheme] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(THEME_KEY)) || { mode: 'auto', wallpaper: '#0d1420' };
    } catch {
      return { mode: 'auto', wallpaper: '#0d1420' };
    }
  });
  const [days, setDays] = useState(() => readDays());
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState('');
  const [dayNote, setDayNote] = useState('');
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const todayData = useMemo(() => getDayData(days, selectedDate), [days, selectedDate]);
  const selectedFlight = useMemo(() => {
    const flights = todayData.flights || [];
    return flights.find((flight) => flight.id === selectedId) || flights[0] || defaultFlight(Date.now());
  }, [todayData, selectedId]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    writeDays(days);
  }, [days]);

  useEffect(() => {
    localStorage.setItem(USER_KEY, user);
  }, [user]);

  useEffect(() => {
    const nextDay = getDayData(days, selectedDate);
    setDayNote(nextDay.note || '');
  }, [selectedDate]);

  useEffect(() => {
    const current = { ...todayData, note: dayNote };
    setDays((prev) => ({ ...prev, [selectedDate]: current }));
  }, [dayNote]);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };

  const updateFlight = (id, field, value) => {
    setDays((prev) => {
      const next = { ...prev };
      const current = getDayData(next, selectedDate);
      current.flights = (current.flights || []).map((flight) => flight.id === id ? { ...flight, [field]: value } : flight);
      next[selectedDate] = { ...current, synced: false };
      return next;
    });
  };

  const addFlight = () => {
    const id = Date.now();
    setDays((prev) => {
      const current = getDayData(prev, selectedDate);
      const flights = [...(current.flights || []), defaultFlight(id)];
      return { ...prev, [selectedDate]: { ...current, flights, synced: false } };
    });
    setSelectedId(id);
    setScreen('detail');
    notify('Novo voo adicionado');
  };

  const removeFlight = () => {
    setDays((prev) => {
      const current = getDayData(prev, selectedDate);
      const flights = current.flights.filter((flight) => flight.id !== selectedFlight.id);
      return { ...prev, [selectedDate]: { ...current, flights, synced: false } };
    });
    setScreen('dashboard');
    notify('Voo removido');
  };

  const filteredFlights = useMemo(() => {
    const flights = todayData.flights || [];
    return flights.filter((flight) => `${flight.number} ${flight.destination} ${flight.agent} ${flight.time}`.toLowerCase().includes(query.trim().toLowerCase()));
  }, [todayData, query]);

  const login = (event) => {
    event.preventDefault();
    if (!email.trim() || !email.includes('@')) return setError('Informe um e-mail válido.');
    if (!password.trim()) return setError('Informe sua senha.');
    setError('');
    setUser(email.split('@')[0].replace(/[._-]/g, ' ') || 'Leandro Ferrari');
    setScreen('dashboard');
    notify('Login realizado');
  };

  const syncDay = () => {
    setDays((prev) => ({ ...prev, [selectedDate]: { ...getDayData(prev, selectedDate), synced: true } }));
    notify('Dados sincronizados');
  };

  const openDepartureSearch = () => {
    const url = query.trim() ? `${DEPARTURE_URL}?search=${encodeURIComponent(query.trim())}` : DEPARTURE_URL;
    window.open(url, '_blank', 'noopener,noreferrer');
    notify('Abrindo painel de partidas');
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    doc.setFillColor(13, 27, 43); doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(245, 198, 72); doc.setFontSize(19); doc.text('RELATÓRIO DE EMBARQUE', 14, 18);
    doc.setTextColor(240, 245, 252); doc.setFontSize(10); doc.text(`Data: ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR')} | ${user}`, 14, 28);
    let y = 43;
    (todayData.flights || []).forEach((flight, idx) => {
      if (y > 260) { doc.addPage(); y = 18; }
      doc.setTextColor(245, 198, 72); doc.setFontSize(12); doc.text(`VOO ${flight.number || idx + 1} - ${flight.destination || 'Sem destino'}`, 14, y);
      doc.setTextColor(240, 245, 252); doc.setFontSize(9); doc.text(`Horário: ${flight.time || '-'} | Portão: ${flight.gate || '-'} | PDA: ${flight.pda || '-'} | DWS: ${flight.dws || '-'}`, 14, y += 8);
      y += 12;
    });
    doc.setTextColor(245, 198, 72); doc.text('OBSERVAÇÕES DO DIA', 14, y += 14); doc.setTextColor(240, 245, 252); doc.text(doc.splitTextToSize(dayNote || 'Nenhuma observação cadastrada.', 180), 14, y += 8);
    doc.save('relatorio-embarque.pdf');
    notify('PDF gerado com sucesso');
  };

  const dayKeys = Object.keys(days).sort((a, b) => b.localeCompare(a));

  const themeStyle = {
    backgroundColor: theme.mode === 'dark' ? '#091a2a' : theme.mode === 'light' ? '#edf4ff' : '#091a2a',
    color: theme.mode === 'light' ? '#0d1420' : '#edf5ff',
  };

  const renderLogin = () => (
    <main className="login-screen" style={{ backgroundImage: `linear-gradient(180deg, rgba(5,15,30,.42), rgba(4,12,25,.78)), url(${BRAND_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <form className="login-card" onSubmit={login}>
        <div className="login-logo" style={{ backgroundImage: `url(${BRAND_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' }}>✈</div>
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
        <button className="primary-btn" type="submit">Entrar</button>
        <button type="button" className="google-btn" onClick={() => { setUser('Leandro Ferrari'); setScreen('dashboard'); notify('Login com Google selecionado'); }}>G&nbsp;&nbsp; Entrar com Google</button>
      </form>
      {toast && <Toast text={toast} />}
    </main>
  );

  const renderDashboard = () => (
    <main className="dashboard-screen" style={themeStyle}>
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" style={{ backgroundImage: `url(${BRAND_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' }}>✈</div>
          <div className="brand-copy">
            <h1>DIÁRIO DE<br />EMBARQUE</h1>
            <p>{(todayData.flights || []).length} voos cadastrados</p>
          </div>
        </div>
        <div className="actions-wrap">
          <div className="actions">
            <button type="button" onClick={syncDay} className={todayData.synced ? 'sync-btn active' : 'sync-btn'}>⠿</button>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setMenuOpen((open) => !open)}>☰</button>
              {menuOpen && (
                <div className="menu-popup">
                  {['Personalizar', 'Chat', 'Contatos', 'Admin'].map((item) => (
                    <button key={item} type="button" onClick={() => { setMenuOpen(false); if (item === 'Personalizar') setCustomizeOpen(true); else notify(`${item}: em breve`); }}>
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setScreen('login')}>Sair</button>
          </div>
          <div className="user-mini">{user}</div>
        </div>
      </header>

      <section className="content-panel">
        <div className="date-row">
          <label className="date-box">
            <span className="cal-icon">▣</span>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <div className="user-box">{user}</div>
        </div>

        <div className="meta-grid">
          {['pda', 'mochila', 'radio', 'dws'].map((field) => (
            <label key={field} className="meta-label">
              <span>{field === 'pda' ? 'PDA' : field === 'mochila' ? 'MOCHILA' : field === 'radio' ? 'RÁDIO' : 'DWS'}</span>
              <input value={todayData.resources?.[field] ?? ''} onChange={(event) => {
                setDays((prev) => {
                  const next = { ...prev };
                  const current = getDayData(next, selectedDate);
                  next[selectedDate] = { ...current, resources: { ...current.resources, [field]: event.target.value }, synced: false };
                  return next;
                });
              }} placeholder="-" />
            </label>
          ))}
        </div>

        <div className="dashed-divider" />
        <div className="section-label">VOOS DO DIA</div>
        <div className="flight-list">
          {filteredFlights.map((flight, index) => (
            <button className="flight-card" type="button" key={flight.id} onClick={() => { setSelectedId(flight.id); setScreen('detail'); }}>
              <div className="flight-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="flight-summary">
                <div className="flight-route">
                  <span className="status-dot" />
                  <strong>{flight.number || `Voo ${index + 1}`}</strong>
                  <span className="arrow-route">→</span>
                  <span>{flight.destination || 'Destino'}</span>
                </div>
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

        <div className="search-box">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar voo, destino ou agente" />
          <button type="button" onClick={openDepartureSearch}>Busca</button>
        </div>
        <p className="search-hint">A busca abre o painel de partidas do GRU.</p>
      </section>
      {toast && <Toast text={toast} />}

      {customizeOpen && (
        <div className="modal-backdrop" onClick={() => setCustomizeOpen(false)}>
          <div className="customize-panel" onClick={(event) => event.stopPropagation()}>
            <h3>Personalizar</h3>
            <div className="customize-section">
              <h4>MODO DE TELA</h4>
              <div className="mode-list">
                {screenModes.map((item) => (
                  <button
                    key={item.key}
                    className={theme.mode === item.key ? 'mode-option active' : 'mode-option'}
                    type="button"
                    onClick={() => setTheme((prev) => ({ ...prev, mode: item.key }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="customize-section">
              <h4>PAPEL DE PAREDE</h4>
              <div className="wall-grid">
                {wallpaperOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={theme.wallpaper === color ? 'wall-option active' : 'wall-option'}
                    style={{ background: color }}
                    onClick={() => setTheme((prev) => ({ ...prev, wallpaper: color }))}
                    aria-label="Selecionar papel de parede"
                  />
                ))}
              </div>
            </div>
            <div className="customize-actions">
              <button type="button" className="secondary-btn" onClick={() => setCustomizeOpen(false)}>Cancelar</button>
              <button type="button" className="primary-btn small" onClick={() => { setCustomizeOpen(false); notify('Tema salvo'); }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );

  const renderDetail = () => (
    <main className="detail-screen">
      <div className="detail-header">
        <div className="detail-index">{String((todayData.flights || []).findIndex((flight) => flight.id === selectedFlight.id) + 1).padStart(2, '0')}</div>
        <div className="detail-title-wrap">
          <i className="red-dot" />
          <strong>{selectedFlight.number || 'Voo'}</strong>
          <small>{user}</small>
        </div>
        <button className="mini-up" type="button" onClick={() => setScreen('dashboard')}>⌃</button>
      </div>

      <section className="detail-panel">
        <h2 className="section-title">DADOS DO VOO</h2>
        <div className="field-grid two-cols">
          {[['number', 'VOO'], ['destination', 'DESTINO'], ['time', 'HORÁRIO'], ['gate', 'PORTÃO'], ['agent', 'AGENTE'], ['pda', 'PDA'], ['dws', 'DWS'], ['radio', 'RÁDIO'], ['mochila', 'MOCHILA']].map(([key, label]) => (
            <Field key={key} label={label} value={selectedFlight[key] || ''} onChange={(value) => updateFlight(selectedFlight.id, key, value)} />
          ))}
        </div>

        <h2 className="section-title">OBSERVAÇÕES</h2>
        <textarea className="detail-note" value={selectedFlight.note || ''} onChange={(event) => updateFlight(selectedFlight.id, 'note', event.target.value)} />

        <div className="actions-row">
          <button className="report-button" type="button" onClick={generatePdf}>Gerar relatório</button>
          <button className="trash-button" type="button" onClick={removeFlight}>⌫</button>
        </div>
      </section>
      {toast && <Toast text={toast} />}
    </main>
  );

  const renderHistory = () => (
    <main className="history-screen">
      <header className="history-header">
        <h2>DIAS REGISTRADOS</h2>
        <button type="button" onClick={() => setScreen('dashboard')}>Voltar</button>
      </header>
      <div className="history-list">
        {dayKeys.map((dateKey) => {
          const day = days[dateKey] || defaultDayData(dateKey);
          return (
            <div key={dateKey} className="history-card">
              <div>
                <strong>{dateKey}</strong>
                <small>{(day.flights || []).length} voos</small>
              </div>
              <div className="history-meta">
                <span>{day.synced ? 'Nuvem' : 'Local'}</span>
                <button type="button" onClick={() => { setSelectedDate(dateKey); setScreen('dashboard'); }}>Abrir</button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );

  if (screen === 'login') return renderLogin();
  if (screen === 'dashboard') return renderDashboard();
  if (screen === 'detail') return renderDetail();
  if (screen === 'history') return renderHistory();

  return renderDashboard();
}

function Field({ label, value, onChange }) {
  const accent = ['PDA', 'DWS', 'RÁDIO', 'MOCHILA'].includes(label) ? 'var(--yellow)' : undefined;
  return (
    <label className="field-block">
      <span style={{ color: accent }}>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Toast({ text }) {
  return <div className="toast">✓ {text}</div>;
}
