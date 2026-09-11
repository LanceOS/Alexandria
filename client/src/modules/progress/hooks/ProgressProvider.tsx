import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { LoginInput, SessionResponse, User } from '../../../../../shared/auth';
import type { LearningProgress } from '../../../../../shared/progress';
import { progressRequest, ProgressRequestError, progressUrl } from '../utils/api';
import { isLearningProgress } from '../utils/progress';

export interface ProgressContextValue {
  user: User | null;
  csrfToken?: string | null;
  progress: LearningProgress | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  accountOpen: boolean;
  openAccount: () => void;
  closeAccount: () => void;
  retry: () => void;
  signIn: (input: LoginInput) => Promise<boolean>;
  signOut: () => Promise<void>;
  completeSection: (moduleId: string, partId: string, versionId: string) => Promise<boolean>;
  setWeeklyGoal: (goal: number) => Promise<boolean>;
}

const idle = async () => false;
const accountChangeKey = 'alexandria.account-change';

function announceAccountChange() {
  // Only an invalidation marker is shared; account details and tokens stay in memory.
  try { localStorage.setItem(accountChangeKey, `${Date.now()}:${Math.random()}`); } catch { /* Focus also refreshes the session when storage is unavailable. */ }
}
export const ProgressContext = createContext<ProgressContextValue>({
  user: null, progress: null, loading: false, busy: false, error: null, accountOpen: false,
  openAccount() {}, closeAccount() {}, retry() {}, signIn: idle, async signOut() {}, completeSection: idle, setWeeklyGoal: idle,
});

function isSession(value: unknown): value is SessionResponse {
  if (!value || typeof value !== 'object' || !('user' in value)) return false;
  if (value.user === null) return true;
  return typeof value.user === 'object' && value.user !== null && 'id' in value.user && typeof value.user.id === 'string'
    && 'displayName' in value.user && typeof value.user.displayName === 'string'
    && 'csrfToken' in value && typeof value.csrfToken === 'string';
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse>({ user: null });
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const revision = useRef(0);
  const locked = useRef(false);
  const currentSession = useRef(session);
  const pending = useRef<AbortController | null>(null);

  const invalidate = useCallback(() => {
    revision.current += 1;
    pending.current?.abort();
    pending.current = null;
    locked.current = false;
  }, []);

  const expire = useCallback(() => {
    invalidate();
    currentSession.current = { user: null };
    setSession({ user: null }); setProgress(null); setLoading(false); setBusy(false); locked.current = false;
    setError('Your session has ended. Sign in again to save your reading.');
  }, [invalidate]);

  const loadProgress = useCallback(async (stamp: number, csrfToken: string, signal: AbortSignal) => {
    const value = await progressRequest(progressUrl(), { headers: { 'x-csrf-token': csrfToken }, signal });
    if (!isLearningProgress(value)) throw new Error('Invalid progress');
    if (stamp === revision.current) setProgress(value);
  }, []);

  const retry = useCallback(() => {
    if (locked.current) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const stamp = ++revision.current;
    setProgress(null); setLoading(true); setBusy(false); setError(null);
    void (async () => {
      try {
        const value = await progressRequest('/api/auth/session', { signal: controller.signal });
        if (stamp !== revision.current) return;
        if (!isSession(value)) throw new Error('Invalid session');
        currentSession.current = value;
        setSession(value); setProgress(null);
        if (value.user) await loadProgress(stamp, value.csrfToken, controller.signal);
      } catch (failure) {
        if (stamp !== revision.current) return;
        if (failure instanceof ProgressRequestError && [401, 403].includes(failure.status)) expire();
        else setError('We couldn’t load your saved reading. Try again.');
      } finally { if (stamp === revision.current) setLoading(false); }
    })();
  }, [expire, loadProgress]);

  useEffect(() => {
    retry();
    return invalidate;
  }, [invalidate, retry]);

  useEffect(() => {
    function refresh() {
      invalidate();
      currentSession.current = { user: null };
      setSession({ user: null });
      retry();
    }
    function onStorage(event: StorageEvent) {
      if (event.key === accountChangeKey || event.key === null) refresh();
    }
    function onFocus() {
      // Do not interrupt a sign-in or save when a dialog/window returns focus.
      if (!locked.current && document.visibilityState === 'visible') retry();
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [invalidate, retry]);

  async function signIn(input: LoginInput) {
    if (locked.current) return false;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    locked.current = true;
    const stamp = ++revision.current;
    setBusy(true); setLoading(false); setError(null); setProgress(null);
    try {
      const value = await progressRequest('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: controller.signal,
      });
      if (stamp !== revision.current) return false;
      if (!isSession(value) || !value.user) throw new Error('Invalid session');
      currentSession.current = value; setSession(value); setAccountOpen(false);
      announceAccountChange();
      try { await loadProgress(stamp, value.csrfToken, controller.signal); }
      catch (failure) {
        if (stamp !== revision.current) return false;
        if (failure instanceof ProgressRequestError && [401, 403].includes(failure.status)) { expire(); return false; }
        setError('You’re signed in, but your saved reading couldn’t be loaded. Try again.');
      }
      return stamp === revision.current;
    } catch (failure) {
      if (stamp === revision.current) setError(failure instanceof ProgressRequestError && failure.status === 401
        ? 'The username or password wasn’t accepted.' : failure instanceof ProgressRequestError && failure.status === 429
          ? 'Too many sign-in attempts. Wait a moment and try again.' : 'We couldn’t sign you in. Check your connection and try again.');
      return false;
    } finally { if (stamp === revision.current) { locked.current = false; setBusy(false); } }
  }

  async function signOut() {
    if (locked.current || !currentSession.current.user) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    locked.current = true;
    const active = currentSession.current;
    const stamp = ++revision.current;
    setBusy(true); setError(null); setLoading(false);
    try {
      await progressRequest('/api/auth/logout', { method: 'POST', headers: { 'x-csrf-token': 'csrfToken' in active ? active.csrfToken : '' }, signal: controller.signal });
      if (stamp !== revision.current) return;
      currentSession.current = { user: null }; setSession({ user: null }); setProgress(null); setAccountOpen(false);
      announceAccountChange();
    } catch (failure) {
      if (stamp !== revision.current) return;
      if (failure instanceof ProgressRequestError && [401, 403].includes(failure.status)) expire();
      else setError('We couldn’t confirm sign-out. Try signing out again.');
    } finally { if (stamp === revision.current) { locked.current = false; setBusy(false); } }
  }

  async function mutate(path: string, method: string, body: unknown) {
    const active = currentSession.current;
    if (!active.user) { setAccountOpen(true); return false; }
    if (locked.current || loading) return false;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    locked.current = true;
    const stamp = ++revision.current;
    setBusy(true); setError(null);
    try {
      const value = await progressRequest(progressUrl(path), {
        method, headers: { 'Content-Type': 'application/json', 'x-csrf-token': active.csrfToken }, body: JSON.stringify(body), signal: controller.signal,
      });
      if (stamp !== revision.current) return false;
      if (!isLearningProgress(value)) throw new Error('Invalid progress');
      setProgress(value); return true;
    } catch (failure) {
      if (stamp !== revision.current) return false;
      if (failure instanceof ProgressRequestError && [401, 403].includes(failure.status)) expire();
      else setError(failure instanceof ProgressRequestError && failure.status === 409
        ? 'This module has been updated. Reload the page to read the latest version before saving.'
        : 'Your change couldn’t be saved. Try the action again; earned XP won’t be counted twice.');
      return false;
    } finally { if (stamp === revision.current) { locked.current = false; setBusy(false); } }
  }

  return <ProgressContext.Provider value={{ user: session.user, csrfToken: session.user ? session.csrfToken : null, progress, loading, busy, error, accountOpen,
    openAccount: () => setAccountOpen(true), closeAccount: () => setAccountOpen(false), retry, signIn, signOut,
    completeSection: (moduleId, partId, versionId) => mutate(`/api/progress/modules/${encodeURIComponent(moduleId)}/sections/${encodeURIComponent(partId)}`, 'PUT', { versionId }),
    setWeeklyGoal: (weeklyGoal) => mutate('/api/progress/goal', 'PATCH', { weeklyGoal }),
  }}>{children}</ProgressContext.Provider>;
}

export function useLearningProgress() { return useContext(ProgressContext); }
