import type { ReactNode, RefObject } from 'react';
import { Icon, IconButton } from '../ui';

interface SidebarProps {
  open: boolean;
  sidebarRef: RefObject<HTMLElement | null>;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onAbout: () => void;
  children: ReactNode;
}

export function Sidebar({ open, sidebarRef, closeButtonRef, onClose, onAbout, children }: SidebarProps) {
  return <aside id="library-navigation" ref={sidebarRef} className={`sidebar ${open ? 'sidebar-open' : ''}`}
    aria-label="Library navigation" role={open ? 'dialog' : undefined} aria-modal={open ? true : undefined}>
    <IconButton ref={closeButtonRef} className="mobile-sidebar-close" aria-label="Close navigation" onClick={onClose}>
      <Icon name="x" />
    </IconButton>
    <a className="brand" href="/" aria-label="Alexandria home">
      <span className="brand-mark"><Icon name="book" size={23} /></span>
      <span>Alexandria<span className="brand-period">.</span></span>
    </a>
    {children}
    <div className="sidebar-bottom">
      <span className="sidebar-flower" aria-hidden="true">✳</span>
      <p>A little more curious.<br />A little further every day.</p>
      <button className="about-link" onClick={onAbout}>About Alexandria<Icon name="arrow-up-right" size={14} /></button>
    </div>
  </aside>;
}
