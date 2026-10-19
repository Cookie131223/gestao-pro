import type { AuthSession } from './supabase-api';

type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> };
export const SESSION_KEY = '@obramax:session';

/** Serializes refreshes in this tab; the supplied lock also serializes browser tabs. */
export class SessionManager {
  current: AuthSession | null = null;
  private generation = 0;
  private refreshing: Promise<string> | null = null;
  private writes = Promise.resolve();

  constructor(private storage: Storage, private refresh: (token: string) => Promise<AuthSession>,
    private notify: (session: AuthSession | null) => void, private now = Date.now,
    private lock: <T>(work: () => Promise<T>) => Promise<T> = (work) => work()) {}

  private write(session: AuthSession | null, generation: number) {
    this.writes = this.writes.catch(() => {}).then(async () => {
      if (generation !== this.generation) return;
      if (session) await this.storage.setItem(SESSION_KEY, JSON.stringify(session));
      else await this.storage.removeItem(SESSION_KEY);
    });
    return this.writes;
  }

  async set(session: AuthSession | null) {
    const generation = ++this.generation;
    this.refreshing = null;
    this.current = session;
    this.notify(session);
    await this.write(session, generation);
  }

  async restore() {
    const generation = this.generation;
    let saved: AuthSession | null = null;
    try { saved = JSON.parse(await this.storage.getItem(SESSION_KEY) || 'null'); } catch { /* Invalid local data. */ }
    if (generation !== this.generation) return;
    if (!saved?.user?.id || !saved.access_token || !saved.refresh_token) {
      if (this.current) { ++this.generation; this.current = null; this.notify(null); }
      return;
    }
    if (this.current && this.current.user.id !== saved.user.id) ++this.generation;
    this.current = saved;
    this.notify(saved);
    try { await this.getAccessToken(); } catch { /* Offline sessions are retained for the next attempt. */ }
  }

  async getAccessToken(): Promise<string> {
    const session = this.current;
    if (!session) throw new Error('Entre novamente para continuar.');
    if ((session.expires_at || 0) * 1000 > this.now() + 60_000) return session.access_token;
    if (this.refreshing) return this.refreshing;
    await this.writes;
    if (this.refreshing) return this.refreshing;
    if (this.current !== session) return this.getAccessToken();
    const generation = this.generation;
    const task = this.lock(async () => {
      const raw = await this.storage.getItem(SESSION_KEY);
      const stored = raw ? JSON.parse(raw) as AuthSession : null;
      if (generation !== this.generation) throw new Error('A sessão foi alterada.');
      if (!stored || stored.user.id !== session.user.id) {
        await this.set(stored);
        throw new Error('A sessão foi alterada em outra aba.');
      }
      // A different tab may have already renewed this session while we waited.
      let next = stored;
      if ((stored.expires_at || 0) * 1000 <= this.now() + 60_000) {
        next = await this.refresh(stored.refresh_token);
        next = { ...next, expires_at: next.expires_at || Math.floor(this.now() / 1000) + (next.expires_in || 3600) };
      }
      if (generation !== this.generation) throw new Error('A sessão foi encerrada.');
      this.current = next;
      await this.write(next, generation);
      if (generation !== this.generation) throw new Error('A sessão foi encerrada.');
      this.notify(next);
      return next.access_token;
    }).catch(async (error: unknown) => {
      if (generation === this.generation) {
        const status = (error as { status?: number }).status;
        if (status === 400 || status === 401 || status === 403) await this.set(null);
        // A proactive refresh may fail while the current access token is still valid.
        else if ((session.expires_at || 0) * 1000 > this.now()) return session.access_token;
      }
      throw error;
    });
    this.refreshing = task;
    try { return await task; } finally { if (this.refreshing === task) this.refreshing = null; }
  }
}
