import type { RefObject } from 'react';
import { Button, Icon, IconButton } from '../ui';

interface TopbarProps {
  menuOpen: boolean;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onToggleMenu: () => void;
  breadcrumbTitle: string | null;
  onLibrary: () => void;
  connection: { loading: boolean; error: boolean };
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

export function Topbar({ menuOpen, menuButtonRef, onToggleMenu, breadcrumbTitle, onLibrary,
  connection, theme, onThemeChange }: TopbarProps) {
  return <header className="topbar">
    <IconButton ref={menuButtonRef} className="mobile-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
      aria-controls="library-navigation" aria-expanded={menuOpen} onClick={onToggleMenu}>
      <Icon name={menuOpen ? 'x' : 'menu'} />
    </IconButton>
    <div className="breadcrumb">
      <span>Your workspace</span><span className="breadcrumb-slash">/</span>
      {breadcrumbTitle !== null ? <>
        <button className="breadcrumb-link" onClick={onLibrary}>Library</button>
        <span aria-hidden="true">/</span><span>{breadcrumbTitle}</span>
      </> : <span>Library</span>}
    </div>
    <div className="topbar-actions">
      <span className={`connection-status ${connection.error ? 'is-offline' : ''}`} role="status">
        <span className="connection-dot" />
        <span className="connection-label">{connection.loading ? 'Connecting' : connection.error ? 'Server unavailable' : 'Connected to your server'}</span>
      </span>
      <div className="theme-switch" role="group" aria-label="Color theme">
        <Button variant="ghost" className="theme-option" aria-pressed={theme === 'light'} onClick={() => onThemeChange('light')}>
          <Icon name="sun" size={15} />Light
        </Button>
        <Button variant="ghost" className="theme-option" aria-pressed={theme === 'dark'} onClick={() => onThemeChange('dark')}>
          <Icon name="moon" size={15} />Dark
        </Button>
      </div>
    </div>
  </header>;
}
