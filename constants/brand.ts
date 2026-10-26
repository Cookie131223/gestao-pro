// GestãoPro · identidade visual "canteiro de obras" (comercial e limpa).
// Ajuste aqui as cores e fontes do app inteiro.
import { Platform } from 'react-native';

export const C = {
  // base
  bg: '#F3F1EC',          // concreto claro (fundo das telas)
  surface: '#FFFFFF',     // cartões
  surface2: '#FAF8F4',    // campos / áreas internas
  line: '#E3DED4',        // bordas
  lineStrong: '#CEC7BA',
  // texto
  ink: '#1D2024',         // grafite
  inkSoft: '#575D66',
  inkMute: '#8C9199',
  // grafite (barra lateral, destaques escuros)
  graphite: '#1D2024',
  graphite2: '#2A2E34',
  graphite3: '#3A3F46',
  onGraphite: '#F3F1EC',
  onGraphiteDim: '#A3A8AF',
  // destaque: amarelo de segurança
  accent: '#F5B800',
  accentHover: '#FFC61A',
  accentInk: '#1D2024',   // texto sobre o amarelo
  accentSoft: '#FFF3C4',
  accentText: '#8A6400',  // amarelo escuro legível sobre fundo claro
  // situações
  ok: '#2F9E5B', okSoft: '#E3F4EA',
  warn: '#E08600', warnSoft: '#FFF0D9',
  bad: '#D3443C', badSoft: '#FBE6E4',
  info: '#2E6FD1', infoSoft: '#E4EDFB',
};

// Barlow (texto) e Barlow Condensed (títulos e números) — carregadas no _layout (web).
export const F = {
  body: Platform.select({ web: "'Barlow', system-ui, -apple-system, 'Segoe UI', sans-serif", default: undefined }),
  display: Platform.select({ web: "'Barlow Condensed', 'Barlow', system-ui, sans-serif", default: undefined }),
};

export const R = { sm: 6, md: 10, lg: 14 };

// cor por situação da obra (não depende da cor gravada nos dados antigos)
export function corStatusObra(status: string) {
  if (status === 'Atrasada') return { cor: C.bad, fundo: C.badSoft };
  if (status === 'Concluída') return { cor: C.ok, fundo: C.okSoft };
  return { cor: C.accentText, fundo: C.accentSoft };
}

// cor da barra de orçamento: verde até 75%, amarelo até 90%, vermelho acima
export function corOrcamento(percentual: number) {
  if (percentual >= 90) return C.bad;
  if (percentual >= 75) return C.warn;
  return C.ok;
}

export function moeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor || 0);
}

// "DD/MM/AAAA" → Date (ou null)
export function lerData(valor?: string): Date | null {
  const m = (valor || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
}

export function iniciais(nome?: string) {
  const partes = (nome || '?').trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] || '?') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

// sombra suave para cartões
export const sombra = {
  shadowColor: '#1D2024',
  shadowOpacity: 0.06,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};
