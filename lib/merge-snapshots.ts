/** Three-way merge: only overlapping edits require a decision. */
export function mergeSnapshots<T>(base: T, local: T, remote: T, prefer?: 'local' | 'remote'): { value: T; conflicts: string[] } {
  const conflicts: string[] = [];
  const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const record = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
  const merge = (b: any, l: any, r: any, path: string): any => {
    if (equal(l, r)) return l;
    if (equal(l, b)) return r;
    if (equal(r, b)) return l;
    if (Array.isArray(l) && Array.isArray(r) && (b === undefined || Array.isArray(b))) {
      const arrays = [b || [], l, r];
      const keyed = arrays.every((items) => items.every((v: any) => typeof v === 'string' || (record(v) && typeof v.id === 'string')));
      if (keyed) {
        const key = (v: any) => typeof v === 'string' ? v : v.id;
        const [bm, lm, rm] = arrays.map((items) => new Map(items.map((v: any) => [key(v), v])));
        return [...new Set([...rm.keys(), ...lm.keys(), ...bm.keys()])].map((id) => merge(bm.get(id), lm.get(id), rm.get(id), `${path}[${id}]`)).filter((v) => v !== undefined);
      }
    }
    if (record(l) && record(r) && (b === undefined || record(b))) {
      const result: Record<string, any> = {};
      const derivedCost = Array.isArray(b?.materiais) && Array.isArray(l.materiais) && Array.isArray(r.materiais)
        && l.gasto - b.gasto === sum(l.materiais) - sum(b.materiais)
        && r.gasto - b.gasto === sum(r.materiais) - sum(b.materiais);
      for (const key of new Set([...Object.keys(b || {}), ...Object.keys(l), ...Object.keys(r)])) {
        if ((key === 'gasto' && derivedCost) || (key === 'progresso' && Array.isArray(l.tarefas) && Array.isArray(r.tarefas))) continue;
        const value = merge(b?.[key], l[key], r[key], path ? `${path}.${key}` : key);
        if (value !== undefined) result[key] = value;
      }
      if (derivedCost) result.gasto = b.gasto - sum(b.materiais) + sum(result.materiais);
      if (Array.isArray(l.tarefas) && Array.isArray(r.tarefas)) {
        result.progresso = result.tarefas.length ? Math.round(result.tarefas.filter((t: any) => t.status === 'Concluído').length / result.tarefas.length * 100) : (prefer === 'remote' ? r.progresso : l.progresso);
      }
      return result;
    }
    conflicts.push(path);
    return prefer === 'remote' ? r : l;
  };
  const sum = (items: any[]) => items.reduce((n, item) => n + (Number(item.valor) || 0), 0);
  return { value: merge(base, local, remote, ''), conflicts };
}
