import type { RefObject } from 'react';
import { Badge, Icon, IconButton } from '../ui';

export function AboutDialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  return <dialog className="about-dialog" ref={dialogRef} aria-labelledby="about-heading"
    onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
    <div className="about-header">
      <span className="brand-mark"><Icon name="book" size={23} /></span>
      <IconButton aria-label="Close about Alexandria" onClick={() => dialogRef.current?.close()}><Icon name="x" /></IconButton>
    </div>
    <h2 id="about-heading">Room to understand more.</h2>
    <p>Alexandria is your personal place for thoughtful learning. Explore subjects, follow your interests, and build your understanding at your own pace.</p>
    <p>This is the beginning of your library. Topics will appear as your collection takes shape.</p>
    <div className="about-footer"><Badge>Alexandria 0.1</Badge><span>Hosted by you.</span></div>
  </dialog>;
}
