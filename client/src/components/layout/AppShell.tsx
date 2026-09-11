import { useEffect, useRef, type ReactNode } from 'react';
import { useMobileNavigation } from '../../hooks/useMobileNavigation';
import { usePageEntrance } from '../../hooks/usePageEntrance';
import { AboutDialog } from './AboutDialog';
import { PageFooter } from './PageFooter';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import '../../styles/layout.css';

export interface AppShellProps {
  children: ReactNode;
  navigation: (closeMenu: () => void) => ReactNode;
  breadcrumbTitle: string | null;
  onLibrary: () => void;
  connection: { loading: boolean; error: boolean };
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  routeKey: string;
  account?: ReactNode;
}

export function AppShell({ children, navigation, breadcrumbTitle, onLibrary, connection,
  theme, onThemeChange, routeKey, account }: AppShellProps) {
  const mainRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLDialogElement>(null);
  const { menuOpen, closeMenu, toggleMenu, sidebarRef, menuButtonRef, closeMenuRef } = useMobileNavigation(routeKey, aboutRef);

  useEffect(() => {
    if (breadcrumbTitle !== null) return;
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
    // Only a route transition should move focus; filtering or fetched titles must not interrupt typing.
  }, [routeKey]);
  usePageEntrance(mainRef);

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Sidebar open={menuOpen} sidebarRef={sidebarRef} closeButtonRef={closeMenuRef} onClose={closeMenu}
      onAbout={() => aboutRef.current?.showModal()}>
      {navigation(closeMenu)}
    </Sidebar>
    {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" tabIndex={-1} onClick={closeMenu} />}
    <div className="workspace" inert={menuOpen}>
      <Topbar menuOpen={menuOpen} menuButtonRef={menuButtonRef} onToggleMenu={toggleMenu}
        account={account}
        breadcrumbTitle={breadcrumbTitle} onLibrary={onLibrary} connection={connection} theme={theme} onThemeChange={onThemeChange} />
      <main id="main-content" className="main-content" ref={mainRef} tabIndex={-1}>
        {children}
        <PageFooter />
      </main>
    </div>
    <AboutDialog dialogRef={aboutRef} />
  </div>;
}
