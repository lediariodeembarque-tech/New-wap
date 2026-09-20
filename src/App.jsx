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

export default function App() {
  const [screen, setScreen] = useState('login');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedColor, setSelectedColor] = useState('amarelo');

  const handleLogin = () => {
    setScreen('transition');
    setTimeout(() => setScreen('dashboard'), 4000);
  };

  useEffect(() => {
    if (screen !== 'dashboard') setMenuOpen(false);
  }, [screen]);

  const selectedColorValue = colors.find((c) => c.name === selectedColor)?.value || '#f5c34d';

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
                <button className="icon-btn" type="button">⚙</button>
                <button className="chat-btn" type="button">💬 Chat</button>
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
                <button type="button">Admin</button>
                <button type="button">Chat</button>
                <button type="button">Contatos</button>
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
      </div>
    </div>
  );
}
