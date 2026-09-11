import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import type { LearningProgress, ModuleProgress } from '../../../../../shared/progress';
import { readerFixture } from '../../curriculum/tests/fixtures';
import { ModuleCard } from '../../curriculum/components/ModuleCard';
import { SectionLinks } from '../../curriculum/components/SectionLinks';
import { SectionQuest } from '../components/SectionQuest';
import { ReadingJourney } from '../components/ReadingJourney';
import { AccountControls } from '../components/AccountControls';
import { ProgressContext, type ProgressContextValue } from '../hooks/ProgressProvider';
import { earnedMilestones, isLearningProgress, nextReadingModule, nextReadingPart, readingStatus } from '../utils/progress';
import { progressRequest, ProgressRequestError } from '../utils/api';

const { detail, outline, following } = readerFixture();
const modules = outline.units.flatMap((unit) => unit.modules);
const moduleProgress = (parts: string[], versionId = detail.version.id): ModuleProgress => ({
  moduleId: detail.module.id, versionId, completedPartIds: parts, lastPartId: parts.at(-1) ?? null,
  completedAt: parts.length === 2 ? '2026-09-11T12:00:00.000Z' : null, completedVersionId: parts.length === 2 ? versionId : null,
});
const progressFixture = (saved: ModuleProgress[] = []): LearningProgress => ({
  modules: saved, totalXp: 0, completedModules: 0, completedSections: 0, weeklyGoal: 3, weeklyCompleted: 0,
  weekStartsOn: '2026-09-07', timeZone: 'America/New_York',
});
function account(overrides: Partial<ProgressContextValue> = {}): ProgressContextValue {
  return { user: { id: 'reader', username: 'reader', displayName: 'Reader', role: 'member', status: 'active', createdAt: '', updatedAt: '' },
    progress: progressFixture(), loading: false, busy: false, error: null, accountOpen: false,
    openAccount() {}, closeAccount() {}, retry() {}, async signIn() { return true; }, async signOut() {},
    async completeSection() { return true; }, async setWeeklyGoal() { return true; }, ...overrides };
}
const render = (element: ReactNode, state = account()) => renderToStaticMarkup(<ProgressContext.Provider value={state}>{element}</ProgressContext.Provider>);

test('continuation follows published module order and resumes the first unread section, ignoring previous versions', () => {
  assert.equal(nextReadingModule(modules, null)?.id, detail.module.id);
  assert.equal(nextReadingPart(detail, progressFixture([moduleProgress(['intro'])]))?.id, 'practice');
  assert.equal(nextReadingPart(detail, progressFixture([moduleProgress(['practice'])]))?.id, 'intro');
  const complete = progressFixture([moduleProgress(['intro', 'practice'])]);
  assert.equal(nextReadingModule(modules, complete)?.id, following.id);
  assert.equal(nextReadingPart(detail, complete)?.id, 'intro');
  assert.equal(nextReadingModule([], complete), undefined);
  const previousVersion = progressFixture([moduleProgress(['intro', 'practice'], 'old-version')]);
  assert.equal(readingStatus(previousVersion, detail.module).complete, false);
  assert.equal(nextReadingPart(detail, previousVersion)?.id, 'intro');
  assert.equal(readingStatus(progressFixture([moduleProgress(['intro', 'intro'])]), detail.module).sections, 1);
});

test('milestones use earned reading counts and never imply assessed mastery', () => {
  assert.deepEqual(earnedMilestones(progressFixture()).map((item) => item.earned), [false, false, false]);
  assert.deepEqual(earnedMilestones({ ...progressFixture(), completedSections: 1 }).map((item) => item.earned), [true, false, false]);
  assert.deepEqual(earnedMilestones({ ...progressFixture(), completedSections: 15, completedModules: 5 }).map((item) => item.earned), [true, true, true]);
});

test('anonymous reading remains available and saving has an explicit sign-in control', () => {
  const html = render(<SectionQuest detail={detail} partId="intro" />, account({ user: null, progress: null }));
  assert.match(html, /Sign in to save progress/);
  assert.doesNotMatch(html, /Mark section read|Reading saved/);
  assert.match(html, /separate from demonstrated understanding/);
  const auth = render(<AccountControls />, account({ user: null, progress: null }));
  assert.match(auth, /autoComplete="username"/);
  assert.match(auth, /type="password" autoComplete="current-password"/);
  assert.match(auth, /aria-labelledby="account-heading"/);
});

test('section quest requires a mark-read action and reports saved section and module completion separately', () => {
  const untouched = render(<SectionQuest detail={detail} partId="intro" />);
  assert.match(untouched, />Mark section read<\/button>/);
  assert.doesNotMatch(untouched, /Reading saved/);
  const read = render(<SectionQuest detail={detail} partId="intro" />, account({ progress: progressFixture([moduleProgress(['intro'])]) }));
  assert.match(read, /Section reading complete/);
  assert.match(read, /disabled=""[^>]*>.*Reading saved<\/button>/);
  assert.doesNotMatch(read, /Module reading complete/);
  const complete = render(<SectionQuest detail={detail} partId="practice" />, account({ progress: progressFixture([moduleProgress(['intro', 'practice'])]) }));
  assert.match(complete, /Module reading complete/);
  assert.match(complete, /aria-live="polite"/);
});

test('failed and expired sessions expose recoverable controls without pretending a section was saved', () => {
  const failed = render(<SectionQuest detail={detail} partId="intro" />, account({ error: 'Your change couldn’t be saved.' }));
  assert.match(failed, /role="alert"/);
  assert.match(failed, /Mark section read/);
  assert.match(failed, /Refresh account/);
  assert.doesNotMatch(failed, /Reading saved/);
  const expired = render(<SectionQuest detail={detail} partId="intro" />, account({ user: null, progress: null, error: 'Your session has ended.' }));
  assert.match(expired, /Sign in to save progress/);
  assert.match(expired, /Your session has ended/);
});

test('course cards and section navigation show accurate reading state without hiding links', () => {
  const saved = progressFixture([moduleProgress(['intro', 'practice'])]);
  const card = render(<ModuleCard module={detail.module} index={0} topicSlug="cpp" navigate={() => {}} />, account({ progress: saved }));
  assert.match(card, /Reading complete/);
  assert.match(card, /href="\/\?topic=cpp&amp;module=z-first"/);
  const sections = renderToStaticMarkup(<SectionLinks parts={detail.parts} activePartId="intro" topicSlug="cpp" moduleId={detail.module.id} navigate={() => {}} completedPartIds={['intro']} />);
  assert.equal((sections.match(/Reading complete:/g) ?? []).length, 1);
  assert.match(sections, /part=practice/);
});

test('journey exposes reading progress, an editable weekly goal, XP and actual earned milestones', () => {
  const progress = { ...progressFixture(), totalXp: 40, weeklyCompleted: 4, completedModules: 1, completedSections: 2 };
  const html = render(<ReadingJourney topicName="C++" completedModules={1} totalModules={3} continueAction={<a href="/?topic=cpp">Continue reading</a>} />, account({ progress }));
  assert.match(html, /Weekly goal reached/);
  assert.match(html, /value="3" max="3" aria-label="Weekly reading goal"/);
  assert.match(html, /<strong>40<\/strong> XP/);
  assert.match(html, /Edit goal/);
  assert.equal((html.match(/class="is-earned"/g) ?? []).length, 2);
  assert.match(html, /Continue reading/);
});

test('progress validation rejects malformed responses instead of displaying misleading counts', () => {
  assert.equal(isLearningProgress(progressFixture()), true);
  for (const invalid of [null, {}, { ...progressFixture(), weeklyGoal: 0 }, { ...progressFixture(), totalXp: -1 }, { ...progressFixture(), modules: [{}] }]) {
    assert.equal(isLearningProgress(invalid), false);
  }
});

test('API requests carry server request protection and CSRF headers and surface HTTP errors', async () => {
  const originalFetch = globalThis.fetch;
  let sent: RequestInit | undefined;
  globalThis.fetch = async (_url, init) => { sent = init; return new Response(JSON.stringify(progressFixture()), { status: 200 }); };
  try {
    assert.deepEqual(await progressRequest('/api/progress/goal', { method: 'PATCH', headers: { 'x-csrf-token': 'session-token', 'Content-Type': 'application/json' }, body: '{"weeklyGoal":3}' }), progressFixture());
    assert.equal(new Headers(sent?.headers).get('X-Alexandria-Request'), '1');
    assert.equal(new Headers(sent?.headers).get('x-csrf-token'), 'session-token');
    assert.equal(sent?.credentials, 'same-origin');
    assert.equal(sent?.cache, 'no-store');
    globalThis.fetch = async () => new Response(null, { status: 401 });
    await assert.rejects(progressRequest('/api/progress'), (error: unknown) => error instanceof ProgressRequestError && error.status === 401);
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(await progressRequest('/api/auth/logout', { method: 'POST' }), null);
  } finally { globalThis.fetch = originalFetch; }
});

test('API requests honor caller cancellation so obsolete account requests can be stopped', async () => {
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  let requestSignal: AbortSignal | null | undefined;
  globalThis.fetch = async (_url, init) => {
    requestSignal = init?.signal;
    return await new Promise<Response>((_resolve, reject) => {
      const cancel = () => reject(requestSignal?.reason);
      if (requestSignal?.aborted) cancel();
      else requestSignal?.addEventListener('abort', cancel, { once: true });
    });
  };
  try {
    const pending = progressRequest('/api/auth/session', { signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, { name: 'AbortError' });
    assert.equal(requestSignal?.aborted, true);
    // A request cancelled before it starts must not silently receive a new active signal.
    await assert.rejects(progressRequest('/api/auth/session', { signal: controller.signal }), { name: 'AbortError' });
  } finally { globalThis.fetch = originalFetch; }
});

test('API request timeout aborts stalled requests and is cleared after settlement', async (t) => {
  const originalFetch = globalThis.fetch;
  t.mock.timers.enable({ apis: ['setTimeout'] });
  globalThis.fetch = async (_url, init) => await new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
  });
  try {
    const pending = progressRequest('/api/auth/session');
    t.mock.timers.tick(10000);
    await assert.rejects(pending, { name: 'AbortError' });
    let completedSignal: AbortSignal | null | undefined;
    globalThis.fetch = async (_url, init) => { completedSignal = init?.signal; return new Response(null, { status: 204 }); };
    assert.equal(await progressRequest('/api/auth/logout', { method: 'POST' }), null);
    t.mock.timers.tick(10000);
    assert.equal(completedSignal?.aborted, false);
  } finally {
    globalThis.fetch = originalFetch;
    t.mock.timers.reset();
  }
});
