import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export function useMobileNavigation(routeKey: string, aboutRef: RefObject<HTMLDialogElement | null>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenuRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

  useEffect(() => closeMenu(), [routeKey, closeMenu]);

  useEffect(() => {
    window.addEventListener('popstate', closeMenu);
    return () => window.removeEventListener('popstate', closeMenu);
  }, [closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const mobileViewport = window.matchMedia('(max-width: 700px)');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeMenuRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      // The native modal owns Escape and focus while it is above the navigation drawer.
      if (aboutRef.current?.open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
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
        closeMenu();
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
  }, [menuOpen, aboutRef, closeMenu]);

  return { menuOpen, closeMenu, toggleMenu, sidebarRef, menuButtonRef, closeMenuRef };
}
