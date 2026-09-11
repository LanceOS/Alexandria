import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { animate, stagger } from 'animejs';
import { Badge, Button, EmptyState, Icon, IconButton, TextField } from '../library';
import type { IconName } from '../library';
import type { LibraryResponse } from '../shared/library';
import { useTheme } from './useTheme';
import { Curriculum } from './Curriculum';

function readCurriculumLocation() {
  const params = new URLSearchParams(window.location.search);
  return { topicSlug: params.get('topic'), moduleId: params.get('module'), partId: params.get('part') };
}

const subjectStyles: Record<string, { icon: IconName; label: string; className: string }> = {
  software: { icon: 'code', label: 'Software & Computing', className: 'software' },
  mathematics: { icon: 'sigma', label: 'Mathematics', className: 'mathematics' },
  'artificial-intelligence': { icon: 'sparkles', label: 'Artificial Intelligence', className: 'ai' },
};

function readFilters() {
  const params = new URLSearchParams(window.location.search);
  return { category: params.get('subject') || 'all', query: params.get('q') || '' };
}

function LibraryIllustration() {
  return (
    <svg className="library-illustration" viewBox="0 0 360 240" fill="none" aria-hidden="true">
      <circle cx="226" cy="104" r="86" fill="var(--color-surface-soft)" />
      <path d="M124 212V92a61 61 0 0 1 122 0v120M137 211V93a48 48 0 0 1 96 0v118" stroke="var(--color-border-strong)" strokeWidth="1.4" />
      <path d="M137 127h96M137 168h96M130 213h111" stroke="var(--color-border-strong)" strokeWidth="1.4" />
      <g stroke="var(--color-border-strong)" strokeWidth="1.2">
        <path fill="var(--color-surface)" d="M146 96h12v30h-12zM163 87h10v39h-10zM177 95h14v31h-14zM194 89l10-3 11 37-10 3z" />
        <path d="M150 100h4m12-7h4m10 8h8m-38 16h4m14-6h3m13 5h7" />
        <path fill="var(--color-selected)" d="M147 139h10v28h-10zM161 135h13v32h-13zM178 144h12v23h-12z" />
        <path fill="var(--color-emphasis)" d="m195 137 10-3 10 30-10 3z" />
        <path d="M149 145h6m9-3h7m10 11h6M146 179h14v32h-14zM165 185h11v26h-11zM182 178h12v33h-12z" />
      </g>
      <path d="M83 213h208" stroke="var(--color-border-strong)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M257 212h22l5-30h-32l5 30Z" fill="var(--color-accent-soft)" stroke="var(--color-emphasis)" strokeWidth="1.2" />
      <path d="M268 181v-44m0 31c-18-1-27-11-25-23 13 0 24 7 25 23Zm1-11c0-15 9-25 23-24 0 13-9 23-23 24Zm-1-12c-13-5-18-16-13-27 12 5 16 14 13 27Z" fill="var(--color-border-strong)" stroke="var(--color-border-strong)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M85 199h36v13H85z" fill="var(--color-selected)" stroke="var(--color-border-strong)" strokeWidth="1.2" />
      <path d="M90 187h34v11H90z" fill="var(--color-surface)" stroke="var(--color-border-strong)" strokeWidth="1.2" />
      <path d="M99 191h20m-29 12h25" stroke="var(--color-border-strong)" strokeWidth="1.2" />
      <path d="m289 75 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7ZM91 103v10m-5-5h11" stroke="var(--color-emphasis)" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="110" cy="65" r="2.5" fill="var(--color-emphasis)" />
    </svg>
  );
}

export function App() {
  const { theme, chooseTheme } = useTheme();
  const [filters, setFilters] = useState(readFilters);
  const [curriculum, setCurriculum] = useState(readCurriculumLocation);
  const [data, setData] = useState<LibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [request, setRequest] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLDialogElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const mobileViewport = window.matchMedia('(max-width: 700px)');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeMenuRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (aboutRef.current?.open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
      }
      if (event.key !== 'Tab') return;
      const controls = sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
      const first = controls?.[0];
      const last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    function onViewportChange(event: MediaQueryListEvent) {
      if (!event.matches) {
        if (document.activeElement === closeMenuRef.current) {
          sidebarRef.current?.querySelector<HTMLElement>('.brand')?.focus();
        }
        setMenuOpen(false);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    mobileViewport.addEventListener('change', onViewportChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      mobileViewport.removeEventListener('change', onViewportChange);
      if (mobileViewport.matches) menuButtonRef.current?.focus();
    };
  }, [menuOpen]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    let active = true;
    setLoading(true);
    setError(false);
    async function load() {
      try {
        const response = await fetch('/api/library', { signal: controller.signal });
        if (!response.ok) throw new Error('Library request failed');
        const library: LibraryResponse = await response.json();
        if (!Array.isArray(library.categories) || !Array.isArray(library.topics)) throw new Error('Invalid library response');
        if (active) setData(library);
      } catch {
        if (active) { setError(true); setData(null); }
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [request]);

  useEffect(() => {
    const onPopState = () => { setFilters(readFilters()); setCurriculum(readCurriculumLocation()); setMenuOpen(false); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    document.title = curriculum.topicSlug ? `${data?.topics.find((topic) => topic.slug === curriculum.topicSlug)?.name ?? 'Learning'} · Alexandria` : 'Library · Alexandria';
  }, [curriculum.topicSlug, data]);

  useEffect(() => {
    if (curriculum.topicSlug) return;
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [curriculum.topicSlug, curriculum.moduleId, curriculum.partId]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !mainRef.current) return;
    const animation = animate(mainRef.current.querySelectorAll('[data-entrance]'), {
      opacity: [0, 1], translateY: [10, 0], duration: 500, delay: stagger(70), ease: 'outQuad',
    });
    return () => { animation.revert(); };
  }, []);

  const categories = data?.categories ?? [];
  const selected = categories.find((category) => category.slug === filters.category);
  const query = filters.query.trim().toLocaleLowerCase();
  const topics = (data?.topics ?? []).filter((topic) =>
    (!selected || topic.categoryIds.includes(selected.id)) &&
    (!query || `${topic.name} ${topic.description}`.toLocaleLowerCase().includes(query)),
  );
  const categoryCount = (id: string) => data?.topics.filter((topic) => topic.categoryIds.includes(id)).length ?? 0;

  function updateFilters(next: Partial<typeof filters>, replace = false) {
    const updated = { ...filters, ...next };
    setFilters(updated);
    const url = new URL(window.location.href);
    if (updated.category === 'all') url.searchParams.delete('subject');
    else url.searchParams.set('subject', updated.category);
    if (updated.query) url.searchParams.set('q', updated.query);
    else url.searchParams.delete('q');
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
  }

  function chooseSubject(category: string) {
    const url = new URL(window.location.href);
    for (const key of ['topic', 'module', 'part']) url.searchParams.delete(key);
    if (category === 'all') url.searchParams.delete('subject');
    else url.searchParams.set('subject', category);
    window.history.pushState({}, '', url);
    setCurriculum(readCurriculumLocation());
    setFilters(readFilters());
    setMenuOpen(false);
  }

  function navigateCurriculum(next: { topicSlug: string; moduleId?: string | null; partId?: string | null } | null) {
    const url = new URL(window.location.href);
    for (const key of ['topic', 'module', 'part']) url.searchParams.delete(key);
    url.hash = '';
    if (next) {
      url.searchParams.set('topic', next.topicSlug);
      if (next.moduleId) url.searchParams.set('module', next.moduleId);
      if (next.partId) url.searchParams.set('part', next.partId);
    }
    window.history.pushState({}, '', url);
    setCurriculum(readCurriculumLocation());
    setMenuOpen(false);
  }

  function openTopic(event: MouseEvent<HTMLAnchorElement>, topicSlug: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigateCurriculum({ topicSlug });
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside id="library-navigation" ref={sidebarRef} className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`} aria-label="Library navigation" role={menuOpen ? 'dialog' : undefined} aria-modal={menuOpen ? true : undefined}>
        <IconButton ref={closeMenuRef} className="mobile-sidebar-close" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><Icon name="x" /></IconButton>
        <a className="brand" href="/" aria-label="Alexandria home">
          <span className="brand-mark"><Icon name="book" size={23} /></span>
          <span>Alexandria<span className="brand-period">.</span></span>
        </a>
        <div className="sidebar-content">
          <div className="nav-label">YOUR WORKSPACE</div>
          <button className="nav-item nav-primary" onClick={() => chooseSubject('all')} aria-current={!selected && !curriculum.topicSlug ? 'page' : undefined}>
            <Icon name="grid" size={19} /><span>Library</span><Icon name="chevron-right" size={15} />
          </button>
          <div className="nav-label subjects-label">SUBJECTS</div>
          <nav aria-label="Subjects">
            <button className={`nav-item ${!selected ? 'is-current' : ''}`} aria-pressed={!selected} onClick={() => chooseSubject('all')}>
              <span className="subject-dot dot-all" /><span>All subjects</span><span className="nav-count">{data?.topics.length ?? '–'}</span>
            </button>
            {categories.map((category) => (
              <button key={category.id} className={`nav-item ${selected?.id === category.id ? 'is-current' : ''}`} aria-pressed={selected?.id === category.id} onClick={() => chooseSubject(category.slug)}>
                <span className={`subject-dot dot-${subjectStyles[category.slug]?.className ?? 'all'}`} />
                <span>{category.slug === 'software' ? 'Software' : category.slug === 'artificial-intelligence' ? 'Artificial Intelligence' : category.name}</span>
                <span className="nav-count">{categoryCount(category.id)}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <span className="sidebar-flower" aria-hidden="true">✳</span>
          <p>A little more curious.<br />A little further every day.</p>
          <button className="about-link" onClick={() => aboutRef.current?.showModal()}>About Alexandria<Icon name="arrow-up-right" size={14} /></button>
        </div>
      </aside>
      {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" tabIndex={-1} onClick={() => setMenuOpen(false)} />}

      <div className="workspace" inert={menuOpen}>
        <header className="topbar">
          <IconButton ref={menuButtonRef} className="mobile-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-controls="library-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'x' : 'menu'} /></IconButton>
          <div className="breadcrumb"><span>Your workspace</span><span className="breadcrumb-slash">/</span>{curriculum.topicSlug ? <><button className="breadcrumb-link" onClick={() => navigateCurriculum(null)}>Library</button><span aria-hidden="true">/</span><span>{data?.topics.find((topic) => topic.slug === curriculum.topicSlug)?.name ?? 'Learning'}</span></> : <span>Library</span>}</div>
          <div className="topbar-actions">
            <span className={`connection-status ${error ? 'is-offline' : ''}`} role="status"><span className="connection-dot" /><span className="connection-label">{loading ? 'Connecting' : error ? 'Server unavailable' : 'Connected to your server'}</span></span>
            <div className="theme-switch" role="group" aria-label="Color theme">
              <Button variant="ghost" className="theme-option" aria-pressed={theme === 'light'} onClick={() => chooseTheme('light')}><Icon name="sun" size={15} />Light</Button>
              <Button variant="ghost" className="theme-option" aria-pressed={theme === 'dark'} onClick={() => chooseTheme('dark')}><Icon name="moon" size={15} />Dark</Button>
            </div>
          </div>
        </header>

        <main id="main-content" className="main-content" ref={mainRef} tabIndex={-1}>
          {curriculum.topicSlug ? <Curriculum topicSlug={curriculum.topicSlug} moduleId={curriculum.moduleId} partId={curriculum.partId} onNavigate={navigateCurriculum} /> : <>
          <section className="welcome" aria-labelledby="welcome-heading" data-entrance>
            <div className="welcome-copy">
              <div className="eyebrow"><span />A SPACE FOR CURIOUS MINDS</div>
              <h1 id="welcome-heading">Follow your<br /><em>curiosity.</em></h1>
              <p>Ideas to explore. Connections to make.<br />A world of understanding, one topic at a time.</p>
              <a className="explore-link" href="#subjects">Explore your library<Icon name="arrow-right" size={17} /></a>
            </div>
            <LibraryIllustration />
          </section>

          <section id="subjects" className="subjects-section" aria-labelledby="subjects-heading" data-entrance>
            <div className="section-heading"><h2 id="subjects-heading">Browse by subject</h2><span className="section-note">Find your next direction</span></div>
            <div className="subject-grid" aria-busy={loading}>
              {loading && [0, 1, 2].map((index) => <div key={index} className="subject-skeleton" aria-hidden="true" />)}
              {!loading && categories.map((category, index) => {
                const style = subjectStyles[category.slug];
                return <button key={category.id} className={`subject-card ${style?.className ?? ''} ${selected?.id === category.id ? 'subject-selected' : ''}`} aria-pressed={selected?.id === category.id} onClick={() => chooseSubject(selected?.id === category.id ? 'all' : category.slug)}>
                  <div className="subject-card-top"><span className="subject-symbol"><Icon name={style?.icon ?? 'book'} size={27} /></span><span className="subject-number">0{index + 1}</span></div>
                  <h3>{style?.label ?? category.name}</h3>
                  <p>{category.description}</p>
                  <div className="subject-card-bottom"><span>{categoryCount(category.id)} {categoryCount(category.id) === 1 ? 'topic' : 'topics'}</span><Icon name={selected?.id === category.id ? 'check' : 'arrow-up-right'} size={18} /></div>
                </button>;
              })}
            </div>
          </section>

          <section className="topics-section" aria-labelledby="topics-heading" aria-busy={loading} data-entrance>
            <div className="topics-toolbar">
              <div className="topics-heading"><h2 id="topics-heading">{selected?.name ?? 'All topics'}</h2><Badge>{topics.length}</Badge></div>
              <div className="search-wrap"><TextField id="topic-search" aria-label="Search topics" placeholder="Search topics…" type="search" value={filters.query} onChange={(event) => updateFilters({ query: event.target.value }, true)} leadingIcon={<Icon name="search" size={17} />} /></div>
            </div>
            {selected && <button className="filter-chip" onClick={() => chooseSubject('all')}>{selected.name}<Icon name="x" size={13} /><span className="sr-only">Clear subject filter</span></button>}
            <div className="topics-body" aria-live="polite">
              {loading ? <div className="loading-state"><span className="loading-dot" />Opening your library…</div> : error ? (
                <EmptyState icon={<Icon name="server" size={28} />} title="We couldn’t reach your library" description="Check that your Alexandria server is running, then try connecting again.">
                  <Button variant="secondary" onClick={() => setRequest((current) => current + 1)}><Icon name="refresh" size={16} />Try again</Button>
                </EmptyState>
              ) : topics.length ? (
                <div className="topic-grid">{topics.map((topic) => <a className="topic-card topic-card-link" key={topic.id} href={`/?topic=${encodeURIComponent(topic.slug)}`} onClick={(event) => openTopic(event, topic.slug)}><div className="topic-card-symbol"><Icon name={topic.slug === 'cpp' ? 'code' : 'book'} size={22} /><Icon name="arrow-up-right" size={18} /></div><h3>{topic.name}</h3><p>{topic.description}</p><span className="topic-card-action">Explore topic<Icon name="arrow-right" size={16} /></span></a>)}</div>
              ) : query ? (
                <EmptyState icon={<Icon name="search" size={27} />} title="No topics found" description={`No topics match “${filters.query.trim()}”${selected ? ` in ${selected.name}` : ''}. Try another search.`}>
                  <Button variant="secondary" onClick={() => updateFilters({ query: '', category: 'all' })}>Clear filters</Button>
                </EmptyState>
              ) : (
                <EmptyState icon={<Icon name="book" size={29} />} title={selected ? `${selected.name} starts here` : 'Your library starts here'} description={selected ? 'There are no topics in this subject yet. New topics will appear here when they’re ready.' : 'A little room for a lot of possibility. Your topics will appear here as your library grows.'}>
                  <span className="empty-caption">Good things begin with a little curiosity.</span>
                </EmptyState>
              )}
            </div>
          </section>
          </>}
          <footer className="page-footer"><span>Alexandria<span className="footer-dot">·</span>Built for understanding.</span><span>Your library. Your pace.</span></footer>
        </main>
      </div>
      <dialog className="about-dialog" ref={aboutRef} aria-labelledby="about-heading" onClick={(event) => { if (event.target === event.currentTarget) aboutRef.current?.close(); }}>
        <div className="about-header"><span className="brand-mark"><Icon name="book" size={23} /></span><IconButton aria-label="Close about Alexandria" onClick={() => aboutRef.current?.close()}><Icon name="x" /></IconButton></div>
        <h2 id="about-heading">Room to understand more.</h2><p>Alexandria is your personal place for thoughtful learning. Explore subjects, follow your interests, and build your understanding at your own pace.</p>
        <p>This is the beginning of your library. Topics will appear as your collection takes shape.</p>
        <div className="about-footer"><Badge>Alexandria 0.1</Badge><span>Hosted by you.</span></div>
      </dialog>
    </div>
  );
}
