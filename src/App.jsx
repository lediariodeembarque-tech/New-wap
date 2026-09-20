import { useEffect, useState } from 'react';

const colors = [
  { name: 'amarelo', value: '#f5c34d' },
  { name: 'coral', value: '#d85d5d' },
  { name: 'creme', value: '#f2efe8' },
  { name: 'dourado', value: '#d6a73a' },
  { name: 'laranja', value: '#f29a2e' },
  { name: 'lilas', value: '#c79cf5' },
  { name: 'marrom', value: '#8d5d42' },
  { name: 'ouro', value: '#e7d686' },
  { name: 'preta', value: '#f3f3f3' },
  { name: 'preto', value: '#2f2f2f' },
  { name: 'roxo', value: '#c429f4' },
  { name: 'rosa', value: '#e63d8b' },
  { name: 'salmão', value: '#f59d6e' },
  { name: 'verde', value: '#49d58d' },
  { name: 'vermelho', value: '#d83232' },
  { name: 'azul', value: '#5095ff' },
];

const initialContacts = [
  { id: 1, name: 'Isabelle Lima', status: 'online', initials: 'I' },
  { id: 2, name: 'Taciana Brima', status: 'offline', initials: 'T' },
  { id: 3, name: 'Verdene Almeida', status: 'online', initials: 'V' },
  { id: 4, name: 'Elenice Freitas', status: 'offline', initials: 'E' },
  { id: 5, name: 'Daniel Araujo', status: 'online', initials: 'D' },
  { id: 6, name: 'Diego Souza Gomes Da Silva', status: 'offline', initials: 'D' },
  { id: 7, name: 'Diário de Embarque', status: 'online', initials: 'D' },
  { id: 8, name: 'Gessélia Torres', status: 'offline', initials: 'G' },
  { id: 9, name: 'doni_pain', status: 'offline', initials: 'D' },
  { id: 10, name: 'Lustavo Ian', status: 'offline', initials: 'L' },
  { id: 11, name: 'João Victor', status: 'online', initials: 'J' },
  { id: 12, name: 'Maiara Núncia', status: 'offline', initials: 'M' },
];

const initialMessages = [
  { id: 1, from: 'other', text: 'Olá, tudo certo para os voos de hoje?', time: '08:15' },
  { id: 2, from: 'me', text: 'Tudo bem, o voo 3254 já está com a documentação pronta.', time: '08:16' },
  { id: 3, from: 'other', text: 'Ótimo. Me avise se aparecer algum atraso.', time: '08:17' },
  { id: 4, from: 'me', text: 'Claro, vou te atualizar em tempo real.', time: '08:18' },
];

export default function App() {
  const [screen, setScreen] = useState('login');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedColor, setSelectedColor] = useState('amarelo');
  const [chatText, setChatText] = useState('');
  const [messages, setMessages] = useState(initialMessages);

  const handleLogin = () => {
    setScreen('transition');
    setTimeout(() => setScreen('dashboard'), 4000);
  };

  useEffect(() => {
    if (screen !== 'dashboard') setMenuOpen(false);
  }, [screen]);

  const selectedColorValue = colors.find((c) => c.name === selectedColor)?.value || '#f5c34d';

  const sendMessage = () => {
    if (!chatText.trim()) return;
    const nextMessage = {
      id: Date.now(),
      from: 'me',
      text: chatText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((current) => [...current, nextMessage]);
    setChatText('');
  };

  return (
    <div className={`app-shell ${selectedTheme === 'dark' ? 'dark' : 'light'}`}>
      <div className="notch" />

      <div className="phone-screen">
        {screen === 'login' && (
          <div className="login-screen">
            <div className="login-card">
              <div className="app-logo">✈</div>

              <div className="title-main">
                New Embarque
                <span>Entre na sua conta</span>
              </div>

              <button className="google-btn" type="button">
                <span className="google-mark">G</span>
                Continuar com Google
              </button>

              <div className="divider">ou</div>

              <div className="field">
                <label>E-mail</label>
                <input type="email" placeholder="voce@exemplo.com" />
              </div>

              <div className="field">
                <label>Senha</label>
                <input type="password" placeholder="••••••••" />
              </div>

              <div className="password-row">
                <span />
                <a href="#">Esqueceu a senha?</a>
              </div>

              <button className="primary-btn" type="button" onClick={handleLogin}>
                Entrar
              </button>

              <div className="register-text">
                Não tem uma conta? <a href="#">Criar uma</a>
              </div>
            </div>
          </div>
        )}

        {screen === 'transition' && (
          <div className="transition-screen visible">
            <div className="stars" />
            <div className="sun" />
            <div className="globe" />
            <div className="plane-track" />
            <div className="plane">✈</div>

            <div className="transition-title">
              <strong>NEW EMBARQUE</strong>
              <span>Sua jornada começa aqui.</span>
              <div className="line" />
            </div>
          </div>
        )}

        {screen === 'dashboard' && (
          <div className="dashboard visible">
            <div className="topbar">
              <div className="branding">
                <div className="brand-icon">✈</div>
                <div className="brand-copy">
                  <span className="brand-small">New</span>
                  <strong>Embarque</strong>
                </div>
              </div>

              <div className="header-actions">
                <button className="icon-btn" type="button" onClick={() => setScreen('personalize')}>⚙</button>
                <button className="chat-btn" type="button" onClick={() => setScreen('chat')}>💬 Chat</button>
                <button className="chat-btn" type="button">↩ Sair</button>
              </div>
            </div>

            <div className="sync-row">
              <span className="dot" />
              <span>Sincronizado</span>
            </div>

            <div className="dash-card">
              <div className="dash-header">
                <h3>Voos do dia</h3>
                <button className="new-flight" type="button">Novo voo</button>
              </div>

              <div className="flight-list">
                <div className="flight-item">
                  <div className="flight-left">
                    <div className="flight-num">01</div>
                    <div className="flight-meta">
                      <span className="route">3254 → IOS</span>
                      <small>07:20 • Arthur • 3 fotos</small>
                    </div>
                  </div>
                  <div className="chevron">⌄</div>
                </div>

                <div className="flight-item">
                  <div className="flight-left">
                    <div className="flight-num">02</div>
                    <div className="flight-meta">
                      <span className="route">3552 → CNF</span>
                      <small>08:35 • Mara • 1 foto</small>
                    </div>
                  </div>
                  <div className="chevron">⌄</div>
                </div>

                <div className="flight-item">
                  <div className="flight-left">
                    <div className="flight-num">03</div>
                    <div className="flight-meta">
                      <span className="route">3318 → FOR</span>
                      <small>09:45 • Renato • 3 fotos</small>
                    </div>
                  </div>
                  <div className="chevron">⌄</div>
                </div>
              </div>
            </div>

            <div className="search-row">
              <input type="text" placeholder="Buscar por número do voo ou dest" />
              <button type="button">Buscar</button>
            </div>

            <div className="history-label">Histórico</div>

            <div className="history-list">
              <div className="history-item">
                <div>
                  <div className="history-date">2026-09-04</div>
                  <div className="history-extra">1 recurso • 3 voos • Nuvem</div>
                </div>
                <div className="trash">🗑</div>
              </div>

              <div className="history-item">
                <div>
                  <div className="history-date">2026-09-06</div>
                  <div className="history-extra">0 recursos • 0 voos • Nuvem</div>
                </div>
                <div className="trash">🗑</div>
              </div>

              <div className="history-item">
                <div>
                  <div className="history-date">2026-09-03</div>
                  <div className="history-extra">1 recurso • 3 voos • Nuvem</div>
                </div>
                <div className="trash">🗑</div>
              </div>
            </div>

            <button
              type="button"
              className="menu-toggle"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label="Abrir menu"
            >
              ☰
            </button>

            {menuOpen && (
              <div className="floating-menu">
                <button type="button" onClick={() => setScreen('personalize')}>Personalizar</button>
                <button type="button" onClick={() => setScreen('contacts')}>Contatos</button>
                <button type="button" onClick={() => setScreen('chat')}>Chat</button>
                <button type="button">Admin</button>
                <button type="button" onClick={() => setMenuOpen(false)}>Fechar</button>
              </div>
            )}
          </div>
        )}

        {screen === 'personalize' && (
          <div className="personalize-screen" style={{ '--accent': selectedColorValue }}>
            <div className="personalize-header">
              <button type="button" className="back-btn" onClick={() => setScreen('dashboard')}>
                ← Voltar
              </button>
              <div className="personalize-title">Personalizar</div>
            </div>

            <div className="personalize-subtitle">Modo, cor e papel de parede</div>

            <div className="theme-grid">
              <button
                type="button"
                className={`theme-card ${selectedTheme === 'auto' ? 'active' : ''}`}
                onClick={() => setSelectedTheme('auto')}
              >
                <span>◫</span>
                <strong>Automático</strong>
                <small>Segue o sistema</small>
              </button>

              <button
                type="button"
                className={`theme-card ${selectedTheme === 'light' ? 'active' : ''}`}
                onClick={() => setSelectedTheme('light')}
              >
                <span>☼</span>
                <strong>Claro</strong>
                <small>Melhor ao sol</small>
              </button>

              <button
                type="button"
                className={`theme-card ${selectedTheme === 'dark' ? 'active' : ''}`}
                onClick={() => setSelectedTheme('dark')}
              >
                <span>☾</span>
                <strong>Escuro</strong>
                <small>Melhor à noite</small>
              </button>
            </div>

            <div className="wallpaper-title">Papel de parede</div>

            <div className="palette">
              {colors.map((color) => (
                <div
                  key={color.name}
                  className={`color-item ${selectedColor === color.name ? 'selected' : ''}`}
                  onClick={() => setSelectedColor(color.name)}
                >
                  <span className="color-swatch" style={{ background: color.value }} />
                  <small>{color.name}</small>
                </div>
              ))}
            </div>

            <div className="photo-box">
              <div className="photo-label">Imagem aplicada como fundo</div>
              <button type="button" className="remove">×</button>
            </div>

            <div className="action-row">
              <button type="button" className="save-btn">Salvar</button>
              <button type="button" className="cancel-btn" onClick={() => setScreen('dashboard')}>
                Cancelar
              </button>
            </div>

            <button type="button" className="restore-btn">↻ Restaurar tema padrão</button>
          </div>
        )}

        {screen === 'contacts' && (
          <div className="contacts-screen">
            <div className="contacts-header">
              <button type="button" className="back-btn" onClick={() => setScreen('dashboard')}>← Diário</button>
              <div className="contacts-title">Contatos</div>
              <button type="button" className="close-x">×</button>
            </div>

            <div className="contacts-list">
              {initialContacts.map((contact) => (
                <div key={contact.id} className="contact-item">
                  <div className="contact-badge" data-status={contact.status}>{contact.initials}</div>
                  <div className="contact-name-wrap">
                    <div className="contact-name">{contact.name}</div>
                    <div className="contact-status">{contact.status === 'online' ? 'online' : 'offline'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="contacts-glow" />
          </div>
        )}

        {screen === 'chat' && (
          <div className="chat-screen">
            <div className="chat-header">
              <button type="button" className="back-btn" onClick={() => setScreen('dashboard')}>← Voltar</button>
              <div className="chat-user">New Embarque</div>
            </div>

            <div className="chat-messages">
              {messages.map((message) => (
                <div key={message.id} className={`bubble ${message.from === 'me' ? 'me' : 'other'}`}>
                  <div className="bubble-text">{message.text}</div>
                  <div className="bubble-time">{message.time}</div>
                </div>
              ))}
            </div>

            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Mensagem..."
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage();
                }}
              />
              <button type="button" onClick={sendMessage}>Enviar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
