import { useEffect, useMemo, useRef, useState } from 'react';

const colors = [
  ['amarelo', '#f5c34d'], ['coral', '#d85d5d'], ['creme', '#f2efe8'], ['dourado', '#d6a73a'],
  ['laranja', '#f29a2e'], ['lilas', '#c79cf5'], ['marrom', '#8d5d42'], ['ouro', '#e7d686'],
  ['preta', '#f3f3f3'], ['preto', '#2f2f2f'], ['roxo', '#c429f4'], ['rosa', '#e63d8b'],
  ['salmão', '#f59d6e'], ['verde', '#49d58d'], ['vermelho', '#d83232'], ['azul', '#5095ff'],
];

const seedUsers = [
  { id: '1', name: 'Isabelle Lima', email: 'isabelle@example.com', online: true, admin: true },
  { id: '2', name: 'Taciana Brima', email: 'taciana@example.com', online: false, admin: false },
  { id: '3', name: 'Verdene Almeida', email: 'verdene@example.com', online: true, admin: false },
  { id: '4', name: 'Elenice Freitas', email: 'elenice@example.com', online: false, admin: false },
  { id: '5', name: 'Daniel Araujo', email: 'daniel@example.com', online: true, admin: false },
];

const registeredDays = [
  { date: '2026-09-06', resources: '0 recursos', flights: 0, saved: 'Nuvem', details: 'PDA / Mochila / Rádio / DWS' },
  { date: '2026-09-04', resources: '1 recurso', flights: 3, saved: 'Nuvem', details: 'PDA / Mochila / Rádio / DWS' },
  { date: '2026-08-28', resources: '2 recursos', flights: 5, saved: 'Nuvem', details: 'PDA / Mochila / Rádio / DWS' },
  { date: '2026-08-12', resources: '1 recurso', flights: 2, saved: 'Nuvem', details: 'PDA / Mochila / Rádio / DWS' },
  { date: '2026-07-30', resources: '0 recursos', flights: 1, saved: 'Local', details: 'PDA / Mochila / Rádio / DWS' },
];

const initialMessages = [
  { id: 1, from: 'other', text: 'Olá, tudo certo para os voos de hoje?', time: '08:15' },
  { id: 2, from: 'me', text: 'Tudo bem, o voo 3254 já está com a documentação pronta.', time: '08:16' },
];

function usePresence(userId) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  useEffect(() => {
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('new-wap-presence') : null;
    const key = 'new-wap-presence';
    const announce = (online) => {
      const current = JSON.parse(localStorage.getItem(key) || '{}');
      if (online) current[userId] = Date.now(); else delete current[userId];
      localStorage.setItem(key, JSON.stringify(current));
      channel?.postMessage({ type: 'presence' });
    };
    const refresh = () => {
      const now = Date.now();
      const current = JSON.parse(localStorage.getItem(key) || '{}');
      const active = Object.entries(current).filter(([, timestamp]) => now - timestamp < 15000).map(([id]) => id).filter((id) => id !== userId);
      setOnlineUsers(active);
    };
    announce(true); refresh();
    const timer = setInterval(() => { announce(true); refresh(); }, 5000);
    const onStorage = (event) => { if (event.key === key) refresh(); };
    window.addEventListener('storage', onStorage); channel?.addEventListener('message', refresh);
    return () => { clearInterval(timer); announce(false); window.removeEventListener('storage', onStorage); channel?.close(); };
  }, [userId]);
  return onlineUsers;
}

export default function App() {
  const [screen, setScreen] = useState('login');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedColor, setSelectedColor] = useState('amarelo');
  const [messages, setMessages] = useState(initialMessages);
  const [chatText, setChatText] = useState('');
  const [expandedMonths, setExpandedMonths] = useState({});
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('new-wap-users') || 'null') || seedUsers);
  const [currentUserId] = useState('demo-user');
  const onlineUsers = usePresence(currentUserId);
  const menuRef = useRef(null);
  const isAdmin = users.find((user) => user.id === currentUserId)?.admin || true;
  const selectedColorValue = colors.find(([name]) => name === selectedColor)?.[1] || '#f5c34d';
  const groupedDays = useMemo(() => registeredDays.reduce((groups, day) => {
    const month = new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    (groups[month] ||= []).push(day); return groups;
  }, {}), []);

  useEffect(() => {
    if (screen !== 'dashboard') setMenuOpen(false);
  }, [screen]);
  useEffect(() => {
    const close = (event) => { if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);
  useEffect(() => localStorage.setItem('new-wap-users', JSON.stringify(users)), [users]);

  const go = (next) => { setScreen(next); setMenuOpen(false); };
  const handleLogin = () => { setScreen('transition'); setTimeout(() => setScreen('dashboard'), 400); };
  const sendMessage = () => {
    if (!chatText.trim()) return;
    setMessages((current) => [...current, { id: Date.now(), from: 'me', text: chatText.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setChatText('');
  };
  const toggleAdmin = (user) => {
    if (user.id === currentUserId && user.admin && !window.confirm('Tem certeza que deseja remover seu próprio acesso de administrador?')) return;
    setUsers((current) => current.map((item) => item.id === user.id ? { ...item, admin: !item.admin } : item));
  };

  return <div className={`app-shell ${selectedTheme === 'dark' ? 'dark' : 'light'}`}><div className="notch" /><div className="phone-screen">
    {screen === 'login' && <div className="login-screen"><div className="login-card"><img className="login-logo" src="/logo-diario-embarque.png" alt="Diário de Embarque" onError={(event) => { event.currentTarget.style.display = 'none'; }} /><div className="app-logo">✈</div><div className="title-main">Diário de Embarque<span>Entre na sua conta</span></div><button className="google-btn" type="button"> <span className="google-mark">G</span>Continuar com Google</button><div className="divider">ou</div><div className="field"><label>E-mail</label><input type="email" placeholder="voce@exemplo.com" /></div><div className="field"><label>Senha</label><input type="password" placeholder="••••••••" /></div><button className="primary-btn" type="button" onClick={handleLogin}>Entrar</button><div className="register-text">Não tem uma conta? <a href="#">Criar uma</a></div></div></div>}
    {screen === 'transition' && <div className="transition-screen visible"><div className="stars" /><div className="sun" /><div className="globe" /><div className="plane">✈</div><div className="transition-title"><strong>DIÁRIO DE EMBARQUE</strong><span>Registre. Organize. Voe mais alto.</span><div className="line" /></div></div>}
    {screen === 'dashboard' && <div className="dashboard visible"><header className="topbar"><div className="branding"><img className="header-logo" src="/logo-diario-embarque.png" alt="Diário de Embarque" onError={(event) => { event.currentTarget.style.display = 'none'; }} /></div><div className="header-actions" ref={menuRef}><button className={`chat-btn ${onlineUsers.length ? 'has-online' : ''}`} type="button" onClick={() => go('chat')}>💬 Chat</button><div className="sync-row"><span className="dot">✓</span><span>Sincronizado</span></div><button className="menu-toggle header-menu" type="button" onClick={() => setMenuOpen((open) => !open)}>☰ MENU</button>{menuOpen && <div className="floating-menu"><button type="button" onClick={() => go('personalize')}>Personalizar</button><button type="button" onClick={() => go('chat')}>Chat</button><button type="button" onClick={() => go('contacts')}>Contatos</button>{isAdmin && <button type="button" onClick={() => go('admin')}>Admin</button>}<button type="button" onClick={() => go('login')}>Sair</button></div>}</div></header><div className="dash-card"><div className="dash-header"><h3>Voos do dia</h3><button className="new-flight" type="button">Novo voo</button></div><div className="flight-list"><div className="flight-item"><div className="flight-left"><div className="flight-num">01</div><div className="flight-meta"><span className="route">3254 → IOS</span><small>07:20 • Arthur • 3 fotos</small></div></div><div className="chevron">⌄</div></div><div className="flight-item"><div className="flight-left"><div className="flight-num">02</div><div className="flight-meta"><span className="route">3552 → CNF</span><small>08:35 • Mara • 1 foto</small></div></div><div className="chevron">⌄</div></div></div></div><div className="history-label">Dias Registrados</div><div className="history-list monthly-history">{Object.entries(groupedDays).map(([month, days]) => <section className="month-section" key={month}><button className="month-toggle" type="button" onClick={() => setExpandedMonths((current) => ({ ...current, [month]: !current[month] }))}><span>{month}</span><span>{expandedMonths[month] ? '⌃' : '⌄'}</span></button>{expandedMonths[month] && days.map((day) => <div className="history-item" key={day.date}><div><div className="history-date">{day.date}</div><div className="history-extra">{day.details} • {day.resources} • {day.flights} voos • {day.saved}</div></div><div className="trash">🗑</div></div>)}</section>)}</div></div>}
    {screen === 'personalize' && <div className="personalize-screen" style={{ '--accent': selectedColorValue }}><div className="personalize-header"><button className="back-btn" onClick={() => go('dashboard')}>← Voltar</button><div className="personalize-title">Personalizar</div></div><div className="personalize-subtitle">Modo, cor e papel de parede</div><div className="theme-grid">{['auto', 'light', 'dark'].map((theme) => <button className={`theme-card ${selectedTheme === theme ? 'active' : ''}`} key={theme} onClick={() => setSelectedTheme(theme)}>{theme === 'auto' ? '◫' : theme === 'light' ? '☼' : '☾'}<strong>{theme === 'auto' ? 'Automático' : theme === 'light' ? 'Claro' : 'Escuro'}</strong></button>)}</div><div className="wallpaper-title">Papel de parede</div><div className="palette">{colors.map(([name, value]) => <button className={`color-item ${selectedColor === name ? 'selected' : ''}`} key={name} onClick={() => setSelectedColor(name)}><span className="color-swatch" style={{ background: value }} /><small>{name}</small></button>)}</div></div>}
    {screen === 'contacts' && <div className="contacts-screen"><div className="contacts-header"><button className="back-btn" onClick={() => go('dashboard')}>← Diário</button><div className="contacts-title">Contatos</div></div><div className="contacts-list">{users.map((user) => <div className="contact-item" key={user.id}><div className="contact-badge" data-status={user.online ? 'online' : 'offline'}>{user.name[0]}</div><div className="contact-name-wrap"><div className="contact-name">{user.name}</div><div className="contact-status">{user.online ? 'online' : 'offline'}</div></div></div>)}</div></div>}
    {screen === 'admin' && isAdmin && <div className="admin-screen"><div className="contacts-header"><button className="back-btn" onClick={() => go('dashboard')}>← Diário</button><div className="contacts-title">Admin</div></div><div className="admin-panel"><h2>Gerenciar administradores</h2><p>Escolha quais usuários podem acessar o painel administrativo.</p>{users.map((user) => <div className="admin-user" key={user.id}><div><strong>{user.name}</strong><small>{user.email}</small></div><button className={user.admin ? 'admin-active' : ''} onClick={() => toggleAdmin(user)}>{user.admin ? 'Remover admin' : 'Tornar admin'}</button></div>)}</div></div>}
    {screen === 'chat' && <div className="chat-screen"><div className="chat-header"><button className="back-btn" onClick={() => go('dashboard')}>← Voltar</button><div className="chat-user">New Embarque</div><span className={onlineUsers.length ? 'online-indicator active' : 'online-indicator'}>{onlineUsers.length} online</span></div><div className="chat-messages">{messages.map((message) => <div key={message.id} className={`bubble ${message.from === 'me' ? 'me' : 'other'}`}><div className="bubble-text">{message.text}</div><div className="bubble-time">{message.time}</div></div>)}</div><div className="chat-input-area"><input placeholder="Mensagem..." value={chatText} onChange={(event) => setChatText(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} /><button onClick={sendMessage}>Enviar</button></div></div>}
  </div></div>;
}
