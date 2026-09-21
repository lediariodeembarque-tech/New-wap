const delayCodes = [
  ['01', 'Condições meteorológicas adversas'],
  ['02', 'Restrições ou fechamento do aeroporto'],
  ['03', 'Controle de tráfego aéreo'],
  ['04', 'Aves ou objetos estranhos na pista'],
  ['05', 'Operação de pátio / rampa'],
  ['06', 'Bagagem'],
  ['07', 'Carga / correio'],
  ['08', 'Catering / serviço de bordo'],
  ['09', 'Limpeza da aeronave'],
  ['10', 'Abastecimento de combustível'],
  ['11', 'Degelo da aeronave'],
  ['12', 'Manutenção / engenharia'],
  ['13', 'Tripulação'],
  ['14', 'Passageiro / embarque'],
  ['15', 'Segurança'],
  ['16', 'Documentação / despacho'],
  ['17', 'Peso e balanceamento'],
  ['18', 'Atraso da aeronave ou tripulação anterior'],
  ['19', 'Equipamento de solo indisponível'],
  ['20', 'Falha de sistema ou tecnologia'],
  ['21', 'Porta / ponte de embarque'],
  ['22', 'Remoção de aeronave ou veículo'],
  ['23', 'Reabastecimento de água ou sanitário'],
  ['24', 'Passageiro com necessidade especial'],
  ['25', 'Conexão / transferência de passageiro'],
  ['26', 'Operação da companhia aérea'],
  ['27', 'Manutenção não programada'],
  ['28', 'Aeronave substituta ou indisponível'],
  ['29', 'Voo lotado / ajuste operacional'],
  ['30', 'Outros motivos operacionais'],
];

const style = document.createElement('style');
style.textContent = `
  .delay-code-widget{position:fixed;right:24px;bottom:24px;z-index:9999;font-family:'Segoe UI',Arial,sans-serif;color:#edf3ff}
  .delay-code-toggle{border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:12px 16px;background:linear-gradient(180deg,#f5c34d,#f7d974);color:#0d1d2d;font-weight:900;box-shadow:0 8px 22px #0006;cursor:pointer}
  .delay-code-panel{width:min(340px,calc(100vw - 32px));margin-bottom:10px;padding:16px;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:rgba(6,18,29,.97);box-shadow:0 18px 42px #0009;backdrop-filter:blur(10px)}
  .delay-code-panel[hidden]{display:none}.delay-code-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;color:#f5c34d;font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.delay-code-close{border:0;background:transparent;color:#fff;font-size:20px;cursor:pointer}
  .delay-code-input{width:100%;height:42px;border:1px solid rgba(255,255,255,.16);border-radius:11px;background:rgba(255,255,255,.08);color:#fff;outline:0;padding:0 12px;font-size:15px}.delay-code-input:focus{border-color:#f5c34d;box-shadow:0 0 0 3px #f5c34d2b}
  .delay-code-result{min-height:46px;margin-top:10px;padding:10px 12px;border-radius:11px;background:rgba(255,255,255,.06);font-size:14px;line-height:1.35}.delay-code-result strong{display:block;color:#f5c34d;font-size:16px}.delay-code-hint{color:#c9d8ec;font-size:12px}.delay-code-empty{color:#ffb4a8}.delay-code-list{max-height:170px;overflow:auto;margin-top:8px}.delay-code-item{display:flex;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:12px}.delay-code-item b{color:#f5c34d;min-width:24px}
  @media(max-width:520px){.delay-code-widget{right:16px;bottom:16px}.delay-code-toggle{padding:11px 14px}}
`;
document.head.appendChild(style);

const widget = document.createElement('div');
widget.className = 'delay-code-widget';
widget.innerHTML = `<div class="delay-code-panel" hidden><div class="delay-code-title"><span>Consulta de códigos</span><button class="delay-code-close" aria-label="Fechar">×</button></div><input class="delay-code-input" inputmode="search" maxlength="80" placeholder="Digite o código ou descrição..." aria-label="Código de atraso"/><div class="delay-code-result"><span class="delay-code-hint">Digite um código para ver a descrição.</span></div><div class="delay-code-list"></div></div><button class="delay-code-toggle" type="button">🔎 Códigos</button>`;
document.body.appendChild(widget);

const panel = widget.querySelector('.delay-code-panel');
const input = widget.querySelector('.delay-code-input');
const result = widget.querySelector('.delay-code-result');
const list = widget.querySelector('.delay-code-list');
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const render = () => {
  const query = normalize(input.value);
  if (!query) {
    result.innerHTML = '<span class="delay-code-hint">Digite um código para ver a descrição.</span>';
    list.innerHTML = '';
    return;
  }
  const matches = delayCodes.filter(([code, description]) => normalize(code).includes(query) || normalize(description).includes(query));
  result.innerHTML = matches.length ? matches.slice(0, 1).map(([code, description]) => `<strong>Código ${code}</strong>${description}`).join('') : '<span class="delay-code-empty">Código ou descrição não encontrada.</span>';
  list.innerHTML = matches.slice(1).map(([code, description]) => `<div class="delay-code-item"><b>${code}</b><span>${description}</span></div>`).join('');
};
widget.querySelector('.delay-code-toggle').addEventListener('click', () => { panel.hidden = !panel.hidden; if (!panel.hidden) input.focus(); });
widget.querySelector('.delay-code-close').addEventListener('click', () => { panel.hidden = true; });
input.addEventListener('input', render);
