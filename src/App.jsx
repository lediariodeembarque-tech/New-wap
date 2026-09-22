import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { getDays, getUserProfile, loginUser, saveDay, uploadImage } from './api';

const STORAGE_KEY = 'embarque:dias';
const USER_KEY = 'new-wap-user';
const THEME_KEY = 'new-wap-theme';
const TOKEN_KEY = 'new-wap-token';
const BRAND_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80';

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

const seedFlights = [
  { ...defaultFlight(1), number: '3416', destination: 'POA', time: '07:35', agent: 'Renato', gate: '217', note: 'Planilha: 07:35 · POA · Portão 217' },
  { ...defaultFlight(2), number: '3592', destination: 'IOS', time: '10:25', agent: 'Renato', gate: '222', note: 'Planilha: 10:25 · IOS · Portão 222' },
  { ...defaultFlight(3), number: '3200', destination: 'IGU', time: '12:10', agent: 'Leandro', gate: '208', note: 'Planilha: 12:10 · IGU · Portão 208' }
];

const defaultDay = (date = new Date().toISOString().slice(0, 10)) => ({
  date,
  flights: seedFlights,
  note: '',
  synced: true,
  updatedAt: new Date().toISOString()
});

const readLocalDays = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
};

const writeLocalDays = (days) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
};

const normalizeDay = (day = {}, dateKey) => ({
  date: day.date || dateKey || new Date().toISOString().slice(0, 10),
  flights: Array.isArray(day.flights) && day.flights.length ? day.flights : seedFlights,
  note: day.note || '',
  synced: day.synced !== false,
  updatedAt: day.updatedAt || new Date().toISOString()
});

const themeDefaults = { mode: 'auto', wallpaper: '#0d1420' };

const getWallpaperStyle = (wallpaper) => {
  if (!wallpaper) return { background: `linear-gradient(180deg, rgba(10,18,29,0.68), rgba(8,16,27,0.9)), ${themeDefaults.wallpaper}` };

  const isUrl = /^https?:\/\//i.test(wallpaper) || wallpaper.startsWith('data:');
  return {
    background: isUrl
      ? `linear-gradient(180deg, rgba(10,18,29,0.68), rgba(8,16,27,0.9)), url(${wallpaper}) center/cover no-repeat`
      : `linear-gradient(180deg, rgba(10,18,29,0.68), rgba(8,16,27,0.9)), ${wallpaper}`
  };
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
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [days, setDays] = useState(() => readLocalDays());
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState('');
  const [dayNote, setDayNote] = useState(() => {
    const current = readLocalDays();
    return current[new Date().toISOString().slice(0, 10)]?.note || '';
  });
  const [theme, setTheme] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(THEME_KEY) || 'null') || themeDefaults;
    } catch {
      return themeDefaults;
    }
  });
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const todayData = useMemo(() => normalizeDay(days[selectedDate], selectedDate), [days, selectedDate]);
  const selectedFlight = useMemo(
    () => todayData.flights.find((flight) => flight.id === selectedId) || todayData.flights[0] || defaultFlight(Date.now()),
    [selectedId, todayData.flights]
  );

  const filteredFlights = useMemo(
    () =>
      todayData.flights.filter((flight) =>
        `${flight.number} ${flight.destination} ${flight.agent} ${flight.time}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      ),
    [query, todayData.flights]
  );

  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    writeLocalDays(days);
  }, [days]);

  useEffect(() => {
    const nextDay = normalizeDay(days[selectedDate], selectedDate);
    setDayNote(nextDay.note || '');
  }, [selectedDate]);

  useEffect(() => {
    if (!user) return;

    const payload = {
      ...normalizeDay(days[selectedDate], selectedDate),
      date: selectedDate,
      note: dayNote,
      flights: todayData.flights,
      synced: true,
      updatedAt: new Date().toISOString()
    };

    const timeout = setTimeout(async () => {
      try {
        const saved = await saveDay(selectedDate, payload);
        setDays((prev) => ({ ...prev, [selectedDate]: { ...normalizeDay(saved || payload, selectedDate), synced: true } }));
        writeLocalDays({ ...readLocalDays(), [selectedDate]: { ...normalizeDay(saved || payload, selectedDate), synced: true } });
      } catch {
        setDays((prev) => ({ ...prev, [selectedDate]: { ...payload, synced: false } }));
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [dayNote, selectedDate, todayData.flights, user]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const hydrate = async () => {
      try {
        const profile = await getUserProfile();
        setUser(profile);
        const remote = await getDays();
        const merged = { ...readLocalDays(), ...(remote || {}) };
        setDays(merged);
        writeLocalDays(merged);
        setScreen('dashboard');
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      }
    };

    hydrate();
  }, []);

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
      setError('');
      const result = await loginUser(email, password);
      setUser(result.user);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));

      const remoteDays = await getDays();
      const merged = { ...readLocalDays(), ...(remoteDays || {}) };
      setDays(merged);
      writeLocalDays(merged);
      setScreen('dashboard');
      notify('Login realizado');
    } catch (err) {
      setError(err.message || 'Falha ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  const updateFlight = (id, field, value) => {
    setDays((prev) => {
      const current = normalizeDay(prev[selectedDate], selectedDate);
      const nextFlights = current.flights.map((flight) =>
        flight.id === id ? { ...flight, [field]: value } : flight
      );

      const next = {
        ...prev,
        [selectedDate]: {
          ...current,
          flights: nextFlights,
          synced: false,
          updatedAt: new Date().toISOString()
        }
      };

      writeLocalDays(next);
      return next;
    });
  };

  const addFlight = () => {
    const id = Date.now();
    setDays((prev) => {
      const current = normalizeDay(prev[selectedDate], selectedDate);
      const next = {
        ...prev,
        [selectedDate]: {
          ...current,
          flights: [...current.flights, defaultFlight(id)],
          synced: false,
          updatedAt: new Date().toISOString()
        }
      };
      writeLocalDays(next);
      return next;
    });
    setSelectedId(id);
    setScreen('detail');
    notify('Novo voo adicionado');
  };

  const removeFlight = () => {
    setDays((prev) => {
      const current = normalizeDay(prev[selectedDate], selectedDate);
      const next = {
        ...prev,
        [selectedDate]: {
          ...current,
          flights: current.flights.filter((flight) => flight.id !== selectedFlight.id),
          synced: false,
          updatedAt: new Date().toISOString()
        }
      };
      writeLocalDays(next);
      return next;
    });
    setScreen('dashboard');
    notify('Voo removido');
  };

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      for (const file of files) {
        const uploaded = await uploadImage(file);
        const photos = [...(selectedFlight.photos || []), { name: uploaded.name, url: uploaded.url }];
        updateFlight(selectedFlight.id, 'photos', photos);
      }
      notify('Foto(s) enviadas');
    } catch (err) {
      notify(err.message || 'Erro ao enviar imagem');
    } finally {
      event.target.value = '';
    }
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

    todayData.flights.forEach((flight, index) => {
      if (y > 250) {
        doc.addPage();
        y = 18;
      }
      doc.setTextColor(245, 198, 72);
      doc.setFontSize(12);
      doc.text(`VOO ${flight.number || index + 1} → ${flight.destination || '-'}`, 14, y + 18);
      doc.setTextColor(240, 245, 252);
      doc.setFontSize(9);
      doc.text(`Horário: ${flight.time || '-'} | Agente: ${flight.agent || '-'} | Portão: ${flight.gate || '-'}`, 14, y + 26);
      doc.text(`Observação: ${flight.note || '-'}`, 14, y + 34);
      y += 40;
    });

    doc.setTextColor(245, 198, 72);
    doc.text('OBSERVAÇÕES DO DIA', 14, y + 14);
    doc.setTextColor(240, 245, 252);
    doc.text(doc.splitTextToSize(dayNote || 'Nenhuma observação cadastrada.', 180), 14, y + 22);
    doc.save('relatorio-embarque.pdf');
    notify('PDF gerado com sucesso');
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setError('');
    setScreen('login');
    notify('Sessão encerrada');
  };

  const dayKeys = useMemo(() => Object.keys(days).sort((a, b) => b.localeCompare(a)), [days]);

  const dashboardStyle = getWallpaperStyle(theme.wallpaper);

  if (screen === 'login') {
    return (
      <main className="login-screen" style={{ backgroundImage: `linear-gradient(180deg, rgba(12, 22, 32, 0.55), rgba(8, 14, 24, 0.8)), url(${BRAND_IMAGE})` }}>
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
          <h2>Dias registrados</h2>
          <button type="button" onClick={() => setScreen('dashboard')}>Voltar</button>
        </header>

        <div className="history-list">
          {dayKeys.map((dateKey) => {
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
          <div className="detail-index">{String(todayData.flights.findIndex((flight) => flight.id === selectedFlight.id) + 1).padStart(2, '0')}</div>
          <div className="detail-title-wrap">
            <i className="red-dot" />
            <strong>{selectedFlight.number || 'Voo'}</strong>
            <small>{selectedFlight.photos.length}/10 fotos</small>
          </div>
          <button className="mini-up" type="button" onClick={() => setScreen('dashboard')}>⌃</button>
        </div>

        <section className="detail-panel">
          <h2 className="section-title">Identificação</h2>
          <div className="field-grid two-cols">
            {[
              ['number', 'Voo'],
              ['destination', 'Destino'],
              ['time', 'Horário'],
              ['agent', 'Agente'],
              ['gate', 'Portão'],
              ['control', 'Controle']
            ].map(([field, label]) => (
              <Field key={field} label={label} value={selectedFlight[field] || ''} onChange={(value) => updateFlight(selectedFlight.id, field, value)} />
            ))}
          </div>

          <h2 className="section-title">Serviços e observações</h2>
          <textarea
            className="detail-note"
            value={selectedFlight.note || ''}
            onChange={(event) => updateFlight(selectedFlight.id, 'note', event.target.value)}
          />

          <div className="actions-row">
            <label className="upload-button">
              📷 Câmera
              <input type="file" accept="image/*" capture="environment" onChange={handleUpload} />
            </label>
            <label className="upload-button secondary">
              🖼 Galeria
              <input type="file" accept="image/*" multiple onChange={handleUpload} />
            </label>
            <button className="report-button" type="button" onClick={generatePdf}>Gerar relatório</button>
            <button className="trash-button" type="button" onClick={removeFlight}>🗑</button>
          </div>

          {selectedFlight.photos.length > 0 && (
            <div className="thumbs">
              {selectedFlight.photos.map((photo) => (
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
    <main className="dashboard-screen" style={dashboardStyle}>
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">✈</div>
          <div className="brand-copy">
            <h1>DIÁRIO DE<br />EMBARQUE</h1>
            <p>{todayData.flights.length} voos cadastrados</p>
          </div>
        </div>

        <div className="actions-wrap">
          <div className="actions">
            <button type="button" className="sync-btn active">⠿</button>
            <div className="menu-wrap">
              <button type="button" className="menu-toggle" onClick={() => setMenuOpen((open) => !open)}>
                ☰
              </button>
              {menuOpen && (
                <div className="menu-popup">
                  <button type="button" onClick={() => { setCustomizeOpen(true); setMenuOpen(false); }}>Personalizar</button>
                  <button type="button" onClick={() => notify('Chat em breve')}>Chat</button>
                  <button type="button" onClick={() => notify('Contatos em breve')}>Contatos</button>
                  <button type="button" onClick={() => notify('Admin em breve')}>Admin</button>
                  <button type="button" onClick={logout}>Sair</button>
                </div>
              )}
            </div>
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
          {['PDA', 'MOCHILA', 'RÁDIO', 'DWS'].map((field) => (
            <label key={field} className="meta-label">
              <span>{field}</span>
              <input value="" placeholder="-" />
            </label>
          ))}
        </div>

        <div className="dashed-divider" />
        <div className="section-label">Voos do dia</div>

        <div className="search-box">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar voo, destino ou agente" />
          <button type="button">Busca</button>
        </div>

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
      </section>

      {customizeOpen && (
        <div className="modal-backdrop" onClick={() => setCustomizeOpen(false)}>
          <div className="customize-panel" onClick={(event) => event.stopPropagation()}>
            <h3>Personalizar</h3>
            <div className="customize-section">
              <h4>Modo de tela</h4>
              <div className="mode-list">
                {['auto', 'light', 'dark'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={theme.mode === mode ? 'mode-option active' : 'mode-option'}
                    onClick={() => setTheme((prev) => ({ ...prev, mode }))}
                  >
                    {mode === 'auto' ? 'Automático' : mode === 'light' ? 'Sempre claro' : 'Sempre escuro'}
                  </button>
                ))}
              </div>
            </div>

            <div className="customize-section">
              <h4>Papel de parede</h4>
              <div className="wall-grid">
                {['#f2c356', '#3c7ae9', '#f5e8d2', '#ffffff', '#6b1d2b', '#b9713c', '#7a4a2b', '#1ec9d9', '#6d6d6d', '#d76d5d', '#f6dfc1', '#d7ac43', '#e47a1e', '#b592d7', '#5a3f2a', '#d6b36d', '#919191', '#3d2a4a', '#2bc3a6', '#2a4f69', '#f0a3c2', '#7887ff', '#9ad36d', '#b24a58'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={theme.wallpaper === color ? 'wall-option active' : 'wall-option'}
                    style={{ background: color }}
                    onClick={() => setTheme((prev) => ({ ...prev, wallpaper: color }))}
                    aria-label="Selecionar wallpaper"
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
