import type { Tarefa } from '../context/ObraContext';

export function parseTaskDate(value: string): number | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]), month = Number(match[2]), year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return year >= 2000 && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date.getTime() : null;
}

export function validateTask(obraId: string, tarefa: Omit<Tarefa, 'id'>): string | null {
  if (!obraId) return 'Selecione o projeto desta tarefa.';
  if (!tarefa.titulo.trim()) return 'Informe o título da tarefa.';
  if (!tarefa.responsavel.trim()) return 'Informe o responsável.';
  const inicio = parseTaskDate(tarefa.inicio), prazo = parseTaskDate(tarefa.prazo);
  if (inicio === null || prazo === null) return 'Informe datas válidas no formato DD/MM/AAAA.';
  if (prazo < inicio) return 'O prazo deve ser igual ou posterior à data de início.';
  return null;
}
