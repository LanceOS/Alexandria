import type { ModuleDetail } from '../../../../../shared/curriculum';
import { Button, Icon } from '../../../components/ui';
import { useLearningProgress } from '../hooks/ProgressProvider';
import { currentModuleProgress } from '../utils/progress';

export function SectionQuest({ detail, partId }: { detail: ModuleDetail; partId: string }) {
  const account = useLearningProgress();
  const saved = currentModuleProgress(account.progress, detail.module);
  const read = saved?.completedPartIds.includes(partId) ?? false;
  const moduleComplete = detail.parts.length > 0 && detail.parts.every((part) => saved?.completedPartIds.includes(part.id));
  return <section className={`section-quest ${read ? 'is-complete' : ''}`} aria-labelledby="section-quest-heading">
    <div className="section-quest-copy"><span className="journey-emblem" aria-hidden="true"><Icon name={read ? 'check' : 'bookmark'} size={22} /></span><div>
      <span className="progress-eyebrow">READING QUEST</span><h3 id="section-quest-heading" aria-live="polite">{moduleComplete ? 'Module reading complete' : read ? 'Section reading complete' : 'One more page in your collection.'}</h3>
      <p>{moduleComplete ? 'Every section in this module is marked read. Revisit the practice whenever you like.' : read ? 'Your place is saved. You can return to this section any time.' : 'When you’ve finished reading, mark this section read to save your progress.'}</p>
    </div></div>
    <div className="section-quest-action">
      {account.loading ? <p role="status">Loading saved reading…</p> : !account.user ? <Button variant="secondary" onClick={account.openAccount}>Sign in to save progress</Button>
        : !account.progress ? <Button variant="secondary" onClick={account.retry} disabled={account.busy}>Retry saved progress</Button>
          : <Button variant={read ? 'secondary' : 'primary'} disabled={read || account.busy} onClick={() => void account.completeSection(detail.module.id, partId, detail.version.id)}><Icon name={read ? 'check' : 'bookmark'} size={16} />{read ? 'Reading saved' : account.busy ? 'Saving…' : 'Mark section read'}</Button>}
      {!read && <small>+10 XP per new section · +20 XP per completed module</small>}
    </div>
    {account.error && <div className="progress-error" role="alert">{account.error}{!account.busy && <Button variant="ghost" onClick={account.retry}>Refresh account</Button>}</div>}
    <p className="section-quest-note">Reading completion is separate from demonstrated understanding.</p>
  </section>;
}
