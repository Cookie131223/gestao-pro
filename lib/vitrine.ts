// GestãoPro · MODO VITRINE (link do portfólio: /?vitrine)
// Quem abre com ?vitrine entra sem conta, vê obras de exemplo e pode navegar por tudo;
// criar, editar, mover tarefas, enviar fotos e sair ficam travados com um aviso. Nada vai para o Supabase.
// Sem ?vitrine no endereço, o app funciona normalmente.
import { Platform } from 'react-native';

import type { Obra, Tarefa } from '../context/ObraContext';
import type { AuthSession } from './supabase-api';

// ===== TEXTOS (edite aqui) =====
export const FAIXA = 'MODO VITRINE · SÓ PARA VER';
export const AVISO = 'Modo vitrine: aqui é só para ver. Nada pode ser criado, editado ou excluído.';

const CHAVE = 'gestaopro-vitrine';
function detectar() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const pedido = new URLSearchParams(window.location.search).has('vitrine');
  // fica marcado nesta aba, para continuar na vitrine ao trocar de tela ou recarregar
  try {
    if (pedido) sessionStorage.setItem(CHAVE, '1');
    return pedido || sessionStorage.getItem(CHAVE) === '1';
  } catch { return pedido; }
}
export const VITRINE = detectar();

export const SESSAO_VITRINE: AuthSession = {
  access_token: 'vitrine', refresh_token: 'vitrine', expires_at: 4102444800,
  user: { id: 'vitrine', email: 'Visitante · vitrine' },
};

// ===== obras de exemplo (datas contadas a partir de hoje) =====
const dia = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('pt-BR'); };
let seq = 0;
const t = (titulo: string, categoria: string, responsavel: string, prioridade: Tarefa['prioridade'], status: Tarefa['status'], ini: number, fim: number, descricao = ''): Tarefa =>
  ({ id: `t${++seq}`, titulo, descricao, categoria, responsavel, prioridade, status, inicio: dia(ini), prazo: dia(fim) });
const m = (nome: string, quantidade: string, valor: number) => ({ id: `m${++seq}`, nome, quantidade, valor });
const progresso = (ts: Tarefa[]) => Math.round(ts.filter((x) => x.status === 'Concluído').length / ts.length * 100);

function obra(o: Omit<Obra, 'progresso' | 'gasto' | 'statusColor' | 'borderColor'>): Obra {
  const cor = o.status === 'Atrasada' ? '#D3443C' : o.status === 'Concluída' ? '#2F9E5B' : '#F5B800';
  return { ...o, progresso: progresso(o.tarefas), gasto: o.materiais.reduce((s, x) => s + x.valor, 0), statusColor: cor, borderColor: cor };
}

export const OBRAS_VITRINE: Obra[] = [
  obra({
    id: 'o1', nome: 'Residencial Jardim das Flores', status: 'Em Andamento', cliente: 'Construtora Horizonte',
    endereco: 'Rua das Acácias, 210 · Lins (SP)', fase: 'Estrutura', inicio: dia(-62), previsao: dia(118), orcamento: 480000,
    tarefas: [
      t('Limpeza e terraplanagem', 'Fundação', 'Carlos', 'Média', 'Concluído', -62, -55),
      t('Fundação e baldrame', 'Fundação', 'Carlos', 'Alta', 'Concluído', -54, -30, 'Sapatas, vigas baldrame e impermeabilização.'),
      t('Pilares do térreo', 'Estrutura', 'Marcos', 'Alta', 'Concluído', -29, -14),
      t('Laje do 1º pavimento', 'Estrutura', 'Marcos', 'Alta', 'Em Andamento', -10, 6, 'Escoramento, armação e concretagem.'),
      t('Alvenaria do térreo', 'Alvenaria', 'Júlio', 'Média', 'Pendente', 5, 25),
      t('Instalações elétricas (tubulação)', 'Elétrica', 'Renata', 'Média', 'Pendente', 12, 30),
      t('Compra de esquadrias', 'Compras', 'Ana', 'Baixa', 'Pendente', 20, 40),
    ],
    materiais: [m('Cimento CP II', '180 sacos', 6840), m('Vergalhão 10 mm', '1,2 t', 9600), m('Areia média', '24 m³', 3360), m('Brita 1', '18 m³', 2700), m('Tábuas para forma', '120 un', 4200), m('Concreto usinado fck 25', '32 m³', 15360)],
    fotos: ['vitrine/fundacao', 'vitrine/estrutura', 'vitrine/laje'],
  }),
  obra({
    id: 'o2', nome: 'Reforma Loja Centro', status: 'Atrasada', cliente: 'Padaria Pão Dourado',
    endereco: 'Av. Brasil, 845 · Centro', fase: 'Acabamento', inicio: dia(-48), previsao: dia(-3), orcamento: 95000,
    tarefas: [
      t('Demolição de paredes internas', 'Demolição', 'Júlio', 'Média', 'Concluído', -48, -42),
      t('Nova rede elétrica', 'Elétrica', 'Renata', 'Alta', 'Concluído', -41, -25),
      t('Piso porcelanato', 'Acabamento', 'Sérgio', 'Alta', 'Em Andamento', -20, -4, 'Atrasou por falta de material do fornecedor.'),
      t('Pintura e forro', 'Acabamento', 'Sérgio', 'Média', 'Pendente', -6, 4),
      t('Instalar balcões', 'Mobiliário', 'Ana', 'Baixa', 'Pendente', 2, 8),
    ],
    materiais: [m('Porcelanato 80x80', '140 m²', 11200), m('Argamassa AC-III', '90 sacos', 2970), m('Cabos 4 mm', '6 rolos', 2340), m('Tinta acrílica', '12 latas', 3480)],
    fotos: ['vitrine/piso'],
  }),
  obra({
    id: 'o3', nome: 'Casa Térrea Vila Nova', status: 'Concluída', cliente: 'Família Souza',
    endereco: 'Rua Ipê Roxo, 77 · Vila Nova', fase: 'Entregue', inicio: dia(-210), previsao: dia(-12), orcamento: 320000,
    tarefas: [
      t('Fundação', 'Fundação', 'Carlos', 'Alta', 'Concluído', -210, -180),
      t('Estrutura e alvenaria', 'Estrutura', 'Marcos', 'Alta', 'Concluído', -179, -110),
      t('Telhado', 'Cobertura', 'Júlio', 'Média', 'Concluído', -109, -80),
      t('Acabamento e pintura', 'Acabamento', 'Sérgio', 'Média', 'Concluído', -79, -20),
      t('Vistoria e entrega das chaves', 'Entrega', 'Ana', 'Alta', 'Concluído', -19, -12),
    ],
    materiais: [m('Blocos cerâmicos', '6.000 un', 8400), m('Telhas de concreto', '1.800 un', 9900), m('Cimento CP II', '240 sacos', 9120), m('Esquadrias de alumínio', '9 un', 14800)],
    fotos: ['vitrine/casa'],
  }),
];

// ===== fotos de exemplo, desenhadas aqui mesmo (SVG) =====
export function fotoVitrine(caminho: string) {
  const tipo = caminho.split('/').pop() || '';
  const ceu = '<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc3ea"/><stop offset="1" stop-color="#e9f2f8"/></linearGradient></defs><rect width="800" height="600" fill="url(#c)"/>';
  const chao = '<rect y="470" width="800" height="130" fill="#b39b7d"/><rect y="470" width="800" height="8" fill="#9c8467"/>';
  const grua = '<path d="M640 470V90M640 90H330M640 90h90" stroke="#F5B800" stroke-width="10"/><path d="M640 120l-300-30M640 120l90-30" stroke="#F5B800" stroke-width="3"/><path d="M420 90v120" stroke="#333" stroke-width="2"/><rect x="405" y="210" width="30" height="16" fill="#555"/>';
  const rotulo = (txt: string) => `<rect x="24" y="24" width="${txt.length * 13 + 30}" height="40" rx="6" fill="rgba(29,32,36,.82)"/><text x="39" y="51" font-family="sans-serif" font-size="20" font-weight="700" fill="#F5B800">${txt}</text>`;
  let corpo = '';
  if (tipo === 'fundacao') corpo = ceu + chao + '<rect x="120" y="440" width="560" height="40" fill="#8d8d8d"/>' + [150, 300, 450, 600].map((x) => `<rect x="${x}" y="380" width="40" height="70" fill="#9a9a9a"/><path d="M${x + 6} 380v-40M${x + 20} 380v-40M${x + 34} 380v-40" stroke="#6b4a2f" stroke-width="3"/>`).join('') + grua + rotulo('FUNDAÇÃO · BALDRAME');
  else if (tipo === 'estrutura') corpo = ceu + chao + grua + '<rect x="140" y="250" width="420" height="20" fill="#a9a9a9"/>' + [150, 280, 410, 530].map((x) => `<rect x="${x}" y="270" width="24" height="200" fill="#b5b5b5"/>`).join('') + '<rect x="140" y="230" width="420" height="20" fill="none" stroke="#c8a24a" stroke-width="3" stroke-dasharray="10 6"/>' + rotulo('PILARES DO TÉRREO');
  else if (tipo === 'laje') corpo = ceu + chao + grua + '<rect x="120" y="300" width="460" height="24" fill="#c0c0c0"/>' + [140, 240, 340, 440, 540].map((x) => `<path d="M${x} 324v146" stroke="#c8a24a" stroke-width="6"/>`).join('') + '<path d="M120 296h460" stroke="#6b4a2f" stroke-width="4" stroke-dasharray="4 8"/><rect x="250" y="250" width="80" height="50" fill="#e0e0e0" stroke="#999"/>' + rotulo('CONCRETAGEM DA LAJE');
  else if (tipo === 'piso') corpo = '<rect width="800" height="600" fill="#ede7dc"/><rect y="0" width="800" height="250" fill="#f6f2ea"/>' + Array.from({ length: 6 }, (_, i) => `<path d="M${i * 160 - 200} 600L${i * 140 + 50} 250" stroke="#cfc6b6" stroke-width="2"/>`).join('') + [300, 360, 440, 540].map((y) => `<path d="M0 ${y}H800" stroke="#cfc6b6" stroke-width="2"/>`).join('') + '<rect x="520" y="330" width="160" height="110" fill="#d9cfbf" stroke="#b9ad99"/><rect x="560" y="300" width="60" height="30" fill="#9b9b9b"/>' + rotulo('PISO PORCELANATO · 60%');
  else corpo = ceu + '<rect y="430" width="800" height="170" fill="#7fb069"/><rect x="200" y="280" width="400" height="170" fill="#f1ece2"/><path d="M180 290L400 170L620 290Z" fill="#b5523b"/><rect x="370" y="350" width="60" height="100" fill="#7a5132"/><rect x="250" y="320" width="80" height="60" fill="#9cc7e6" stroke="#fff" stroke-width="4"/><rect x="470" y="320" width="80" height="60" fill="#9cc7e6" stroke="#fff" stroke-width="4"/>' + rotulo('OBRA ENTREGUE');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">${corpo}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// ===== faixa e aviso na tela (só web) =====
let faixa: HTMLDivElement | null = null;
let caixa: HTMLDivElement | null = null;

function montar() {
  if (faixa || typeof document === 'undefined') return;
  const css = document.createElement('style');
  css.textContent = `
    .gp-vitrine-faixa{position:fixed;z-index:9999;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;gap:10px;
      width:max-content;max-width:calc(100vw - 32px);padding:8px 16px;border-radius:999px;background:#1D2024;border:1px solid #F5B800;color:#F5B800;
      font:700 12px 'Barlow Condensed','Barlow',system-ui,sans-serif;letter-spacing:.22em;box-shadow:0 6px 24px rgba(0,0,0,.25);pointer-events:none}
    .gp-vitrine-faixa i{width:8px;height:8px;border-radius:50%;background:#F5B800;animation:gpVitPisca 1.6s ease-in-out infinite}
    .gp-vitrine-faixa.pulso{animation:gpVitPulso .6s ease 2}
    .gp-vitrine-aviso{position:fixed;z-index:9999;left:50%;bottom:calc(64px + env(safe-area-inset-bottom));transform:translate(-50%,8px);opacity:0;transition:opacity .2s,transform .2s;
      width:max-content;max-width:calc(100vw - 32px);padding:12px 16px;border-radius:10px;background:#1D2024;color:#F3F1EC;font:500 14px 'Barlow',system-ui,sans-serif;
      box-shadow:0 10px 30px rgba(0,0,0,.3);border-left:4px solid #F5B800;pointer-events:none}
    .gp-vitrine-aviso.ver{opacity:1;transform:translate(-50%,0)}
    @keyframes gpVitPisca{50%{opacity:.3}}
    @keyframes gpVitPulso{50%{box-shadow:0 0 0 6px rgba(245,184,0,.35)}}
    @media (max-width:899px){.gp-vitrine-faixa{bottom:calc(84px + env(safe-area-inset-bottom))}.gp-vitrine-aviso{bottom:calc(132px + env(safe-area-inset-bottom))}}
    @media (max-width:420px){.gp-vitrine-faixa{font-size:10px;letter-spacing:.14em}}
    @media (prefers-reduced-motion:reduce){.gp-vitrine-faixa i,.gp-vitrine-faixa.pulso{animation:none}.gp-vitrine-aviso{transition:none}}`;
  faixa = document.createElement('div'); faixa.className = 'gp-vitrine-faixa'; faixa.setAttribute('role', 'note');
  faixa.innerHTML = '<i></i><span></span>'; (faixa.lastChild as HTMLElement).textContent = FAIXA;
  caixa = document.createElement('div'); caixa.className = 'gp-vitrine-aviso'; caixa.setAttribute('role', 'status'); caixa.setAttribute('aria-live', 'polite');
  document.head.append(css); document.body.append(faixa, caixa);
}

let timer: ReturnType<typeof setTimeout> | undefined;
/** Mostra o aviso de "só para ver" (usado no lugar de salvar, enviar foto, sair...). */
export function avisarVitrine() {
  if (Platform.OS !== 'web') return;
  montar();
  if (!faixa || !caixa) return;
  caixa.textContent = AVISO; caixa.classList.add('ver');
  faixa.classList.remove('pulso'); void faixa.offsetWidth; faixa.classList.add('pulso');
  clearTimeout(timer); timer = setTimeout(() => caixa?.classList.remove('ver'), 3200);
}

if (VITRINE && typeof document !== 'undefined') {
  if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar);
}
