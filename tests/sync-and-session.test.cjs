const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpile(fs.readFileSync(path, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }), { exports: module.exports, Date, console, ...globals });
  return module.exports;
}
const { mergeSnapshots } = load('lib/merge-snapshots.ts');
const { SessionManager, SESSION_KEY } = load('lib/session-manager.ts');
const clone = (x) => JSON.parse(JSON.stringify(x));
const obra = () => [{ id: 'o1', nome: 'Obra', gasto: 100, progresso: 0, materiais: [], tarefas: [{ id: 't1', status: 'Pendente' }], fotos: [] }];
const session = (token, expires = 2000) => ({ user: { id: 'u1' }, access_token: token, refresh_token: 'refresh-' + token, expires_at: expires });
function storage() {
  const data = new Map();
  return { data, getItem: async (key) => data.get(key) || null, setItem: async (key, value) => { data.set(key, value); }, removeItem: async (key) => { data.delete(key); } };
}

test('independent material purchases retain both costs and historic spending', () => {
  const base = obra(), local = clone(base), remote = clone(base);
  local[0].materiais.push({ id: 'a', valor: 20 }); local[0].gasto += 20;
  remote[0].materiais.push({ id: 'b', valor: 30 }); remote[0].gasto += 30;
  const result = mergeSnapshots(base, local, remote);
  assert.equal(result.conflicts.length, 0);
  assert.equal(result.value[0].materiais.length, 2);
  assert.equal(result.value[0].gasto, 150);
});
test('same task changed differently requires a choice; unrelated photos survive both choices', () => {
  const base = obra(), local = clone(base), remote = clone(base);
  local[0].tarefas[0].status = 'Em Andamento'; local[0].fotos.push('local.jpg');
  remote[0].tarefas[0].status = 'Concluído'; remote[0].fotos.push('remote.jpg');
  assert.ok(mergeSnapshots(base, local, remote).conflicts.length);
  for (const choice of ['local', 'remote']) {
    const result = mergeSnapshots(base, local, remote, choice);
    assert.equal(result.value[0].tarefas[0].status, choice === 'local' ? 'Em Andamento' : 'Concluído');
    assert.equal(result.value[0].fotos.length, 2);
    assert.equal(result.value[0].progresso, choice === 'local' ? 0 : 100);
  }
});
test('distinct new works and distinct task updates merge', () => {
  const base = obra(), local = clone(base), remote = clone(base);
  local.push({ id: 'local' }); remote.push({ id: 'remote' });
  local[0].tarefas.push({ id: 't2', status: 'Concluído' }); remote[0].tarefas[0].status = 'Concluído';
  const result = mergeSnapshots(base, local, remote);
  assert.equal(result.conflicts.length, 0); assert.equal(result.value.length, 3);
  assert.equal(result.value.find((v) => v.id === 'o1').progresso, 100);
});
test('edits made during a save are rebased without deleting incoming photos', () => {
  const before = obra(), newer = clone(before), saved = clone(before);
  newer[0].tarefas.push({ id: 'new', status: 'Pendente' }); saved[0].fotos.push('remote.jpg');
  const result = mergeSnapshots(before, newer, saved);
  assert.equal(result.conflicts.length, 0); assert.equal(result.value[0].tarefas.length, 2); assert.equal(result.value[0].fotos.length, 1);
});
test('valid restored session does not refresh unnecessarily', async () => {
  const store = storage(); let calls = 0;
  store.data.set(SESSION_KEY, JSON.stringify(session('valid')));
  const manager = new SessionManager(store, async () => { calls++; return session('new'); }, () => {}, () => 1_000_000);
  await manager.restore(); assert.equal(await manager.getAccessToken(), 'valid'); assert.equal(calls, 0);
});
test('simultaneous requests share one refresh and persist the new pair', async () => {
  const store = storage(); let calls = 0;
  const manager = new SessionManager(store, async () => { calls++; await new Promise(setImmediate); return session('new'); }, () => {}, () => 1_000_000);
  await manager.set(session('old', 1000));
  const tokens = await Promise.all([manager.getAccessToken(), manager.getAccessToken(), manager.getAccessToken()]);
  assert.deepEqual(tokens, ['new', 'new', 'new']); assert.equal(calls, 1);
  assert.equal(JSON.parse(store.data.get(SESSION_KEY)).refresh_token, 'refresh-new');
});
test('temporary network failure keeps the login; retry recovers', async () => {
  const store = storage(); let offline = true;
  const manager = new SessionManager(store, async () => { if (offline) throw new TypeError('offline'); return session('new'); }, () => {}, () => 1_000_000);
  await manager.set(session('old', 999));
  await assert.rejects(manager.getAccessToken()); assert.ok(manager.current); assert.ok(store.data.get(SESSION_KEY));
  offline = false; assert.equal(await manager.getAccessToken(), 'new');
});
test('rejected refresh clears the session', async () => {
  const store = storage();
  const manager = new SessionManager(store, async () => { throw Object.assign(new Error('revoked'), { status: 400 }); }, () => {}, () => 1_000_000);
  await manager.set(session('old', 999)); await assert.rejects(manager.getAccessToken());
  assert.equal(manager.current, null); assert.equal(store.data.has(SESSION_KEY), false);
});
test('logout during renewal cannot resurrect the session', async () => {
  const store = storage(); let finish, started;
  const start = new Promise((resolve) => { started = resolve; });
  const manager = new SessionManager(store, async () => { started(); return new Promise((resolve) => { finish = resolve; }); }, () => {}, () => 1_000_000);
  await manager.set(session('old', 999)); const refreshing = manager.getAccessToken();
  await start; await manager.set(null); finish(session('new')); await assert.rejects(refreshing);
  assert.equal(manager.current, null); assert.equal(store.data.has(SESSION_KEY), false);
});
test('another tab already renewed: use its tokens instead of replaying the old refresh token', async () => {
  const store = storage(); let calls = 0;
  const manager = new SessionManager(store, async () => { calls++; return session('bad'); }, () => {}, () => 1_000_000);
  await manager.set(session('old', 999)); store.data.set(SESSION_KEY, JSON.stringify(session('other-tab')));
  assert.equal(await manager.getAccessToken(), 'other-tab'); assert.equal(calls, 0);
  store.data.delete(SESSION_KEY); await manager.restore(); assert.equal(manager.current, null);
});

test('proactive renewal failure keeps a token that has not expired yet', async () => {
  const store = storage();
  const manager = new SessionManager(store, async () => { throw new TypeError('offline'); }, () => {}, () => 1_000_000);
  await manager.set(session('still-valid', 1030));
  assert.equal(await manager.getAccessToken(), 'still-valid'); assert.ok(manager.current);
});

test('compare-and-swap rejects a stale device and a duplicate initial insert', async () => {
  let row = { user_id: 'u1', obras: [], updated_at: '2026-10-19T00:00:00.000Z' };
  const api = load('lib/supabase-api.ts', {
    process: { env: { EXPO_PUBLIC_SUPABASE_URL: 'https://test.invalid', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-key' } },
    fetch: async (url, options) => {
      const query = new URL(url).searchParams;
      if (options.method === 'POST') return { ok: false, status: 409, json: async () => ({}) };
      if (query.get('updated_at') !== 'eq.' + row.updated_at) return { ok: true, status: 200, json: async () => [] };
      row = JSON.parse(options.body);
      return { ok: true, status: 200, json: async () => [row] };
    },
  });
  const original = row.updated_at;
  await api.saveGestaoData('token', 'u1', [{ id: 'first' }], original);
  await assert.rejects(api.saveGestaoData('token', 'u1', [{ id: 'second' }], original), api.SyncConflictError);
  assert.equal(row.obras[0].id, 'first');
  await assert.rejects(api.saveGestaoData('token', 'u1', [], null), api.SyncConflictError);
});

function mountProvider(server, store) {
  let slots = [], cursor = 0, effects = [];
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    useState(initial) { const n = cursor++; if (!(n in slots)) slots[n] = initial; return [slots[n], (value) => { slots[n] = typeof value === 'function' ? value(slots[n]) : value; }]; },
    useRef(initial) { const n = cursor++; if (!(n in slots)) slots[n] = { current: initial }; return slots[n]; },
    useEffect(fn) { const n = cursor++; if (!slots[n]) { slots[n] = true; effects.push(fn); } },
  };
  const exports = load('context/ObraContext.tsx', {
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
      if (name.includes('async-storage')) return { default: store };
      if (name === './AuthContext') return { useAuth: () => ({ session: session('valid'), getAccessToken: async () => 'valid' }) };
      if (name.includes('merge-snapshots')) return { mergeSnapshots };
      if (name.includes('supabase-api')) return server;
      throw Error(name);
    },
  });
  const render = () => { cursor = 0; return exports.ObraProvider({ children: null }).props.value; };
  render(); effects.forEach((effect) => effect()); return render;
}
async function flush() { for (let i = 0; i < 20; i++) await new Promise(setImmediate); }
function fakeServer() {
  let row = { obras: obra(), updated_at: '2026-10-19T00:00:00.000Z' }, revision = 0;
  class SyncConflictError extends Error {}
  return {
    SyncConflictError,
    getGestaoData: async () => clone(row),
    saveGestaoData: async (_token, _id, obras, expected) => {
      if (expected !== row.updated_at) throw new SyncConflictError();
      row = { obras: clone(obras), updated_at: new Date(Date.parse('2026-10-19T00:00:00.000Z') + ++revision).toISOString() };
      return row.updated_at;
    },
    read: () => clone(row),
  };
}
test('two provider instances save concurrent purchases without replacing either device', async () => {
  const server = fakeServer(); const a = mountProvider(server, storage()), b = mountProvider(server, storage());
  await flush();
  a().adicionarMaterial('o1', { nome: 'A', quantidade: '1', valor: 20 });
  b().adicionarMaterial('o1', { nome: 'B', quantidade: '1', valor: 30 });
  await flush();
  assert.equal(server.read().obras[0].materiais.length, 2);
  assert.equal(server.read().obras[0].gasto, 150);
  assert.equal(a().syncError, null); assert.equal(b().syncError, null);
});
test('provider stops at a conflicting task and combines independent photos after a choice', async () => {
  const server = fakeServer(); const a = mountProvider(server, storage()), b = mountProvider(server, storage());
  await flush(); a().atualizarStatusTarefa('o1', 't1', 'Em Andamento'); await flush();
  b().adicionarFoto('o1', 'photo.jpg'); b().atualizarStatusTarefa('o1', 't1', 'Concluído'); await flush();
  assert.ok(b().syncConflicts); assert.equal(server.read().obras[0].tarefas[0].status, 'Em Andamento');
  b().resolveSync('local'); await flush();
  assert.equal(server.read().obras[0].tarefas[0].status, 'Concluído');
  assert.equal(server.read().obras[0].fotos[0], 'photo.jpg'); assert.equal(b().syncConflicts, 0);
});
test('offline pending data survives remount and merges changes from another device', async () => {
  const server = fakeServer(), store = storage(); const originalGet = server.getGestaoData;
  let a = mountProvider(server, store); const b = mountProvider(server, storage()); await flush();
  server.getGestaoData = async () => { throw Error('offline'); };
  a().adicionarFoto('o1', 'offline.jpg'); await flush(); assert.ok(a().syncError);
  a = mountProvider(server, store); await flush(); assert.equal(a().obras[0].fotos[0], 'offline.jpg');
  server.getGestaoData = originalGet; b().adicionarMaterial('o1', { nome: 'B', quantidade: '1', valor: 40 }); await flush();
  a().retrySync(); await flush();
  assert.equal(server.read().obras[0].fotos[0], 'offline.jpg'); assert.equal(server.read().obras[0].gasto, 140);
  assert.equal(a().syncError, null);
});
