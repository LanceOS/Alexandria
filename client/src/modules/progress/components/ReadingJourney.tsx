import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Icon } from '../../../components/ui';
import { useLearningProgress, type ProgressContextValue } from '../hooks/ProgressProvider';
import { earnedMilestones } from '../utils/progress';

interface ReadingJourneyProps {
  topicName: string; completedModules: number; totalModules: number; continueAction?: ReactNode;
}

export function ReadingJourney(props: ReadingJourneyProps) {
  const account = useLearningProgress();
  return <ReadingJourneyContent key={account.user?.id ?? 'anonymous'} {...props} account={account} />;
}

function ReadingJourneyContent({ topicName, completedModules, totalModules, continueAction, account }: ReadingJourneyProps & { account: ProgressContextValue }) {
  const [goal, setGoal] = useState('3');
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (account.progress && !editing) setGoal(String(account.progress.weeklyGoal)); }, [account.progress?.weeklyGoal, editing]);
  async function saveGoal(event: FormEvent) { event.preventDefault(); if (await account.setWeeklyGoal(Number(goal))) setEditing(false); }

  if (account.loading) return <section className="reading-journey reading-journey-empty" aria-busy="true"><p role="status">Opening your reading journey…</p></section>;
  if (!account.user || !account.progress) return <section className="reading-journey reading-journey-empty" aria-labelledby="journey-heading">
    <span className="journey-emblem" aria-hidden="true"><Icon name="bookmark" size={25} /></span>
    <div><h2 id="journey-heading">A little further, every day.</h2><p>Save your reading, earn XP, and build a collection of completed modules.</p>
      {account.error && <p className="progress-error" role="alert">{account.error}</p>}</div>
    {account.user ? <Button variant="secondary" onClick={account.retry} disabled={account.busy}>Try again</Button>
      : <div className="journey-entry-actions"><Button variant="secondary" onClick={account.openAccount}>Sign in to save progress</Button>{account.error && <Button variant="ghost" onClick={account.retry}>Retry connection</Button>}</div>}
  </section>;

  const progress = account.progress;
  const achieved = progress.weeklyCompleted >= progress.weeklyGoal;
  return <section className="reading-journey" aria-labelledby="journey-heading">
    <div className="journey-heading"><div><span className="progress-eyebrow">YOUR EXPEDITION</span><h2 id="journey-heading">Your reading journey</h2></div><span className="journey-xp"><Icon name="sparkles" size={18} /><strong>{progress.totalXp.toLocaleString()}</strong> XP</span></div>
    <div className="journey-grid">
      <div className="journey-topic"><h3>{topicName}</h3><p><strong>{completedModules}</strong> of {totalModules} modules read</p><progress className="reading-progress" value={completedModules} max={Math.max(1, totalModules)} aria-label={`${topicName} reading progress`} />{continueAction}</div>
      <div className="journey-week"><div className="journey-goal-heading"><h3>{achieved ? 'Weekly goal reached' : 'This week’s goal'}</h3><Button variant="ghost" onClick={() => { setGoal(String(progress.weeklyGoal)); setEditing(!editing); }} disabled={account.busy} aria-expanded={editing}>{editing ? 'Cancel' : 'Edit goal'}</Button></div>
        <p><strong>{progress.weeklyCompleted}</strong> of {progress.weeklyGoal} modules read <span className="journey-week-date">· week of {progress.weekStartsOn}</span></p>
        <progress className="reading-progress" value={Math.min(progress.weeklyCompleted, progress.weeklyGoal)} max={progress.weeklyGoal} aria-label="Weekly reading goal" />
        {editing ? <form className="journey-goal-form" onSubmit={(event) => void saveGoal(event)}><label htmlFor="weekly-reading-goal">Modules per week</label><input id="weekly-reading-goal" className="ui-input" type="number" min={1} max={14} step={1} required value={goal} onChange={(event) => setGoal(event.target.value)} disabled={account.busy} /><Button type="submit" variant="secondary" disabled={account.busy || !Number.isInteger(Number(goal)) || Number(goal) < 1 || Number(goal) > 14}>Save goal</Button></form>
          : <p className="journey-note">{achieved ? 'Keep exploring, or take a well-earned pause.' : 'Across all courses. Set a pace that fits your week.'}</p>}
      </div>
    </div>
    <ul className="journey-milestones" aria-label="Reading milestones">{earnedMilestones(progress).map((milestone) => <li key={milestone.title} className={milestone.earned ? 'is-earned' : ''}><Icon name={milestone.earned ? 'check' : 'circle'} size={17} /><span><strong>{milestone.title}</strong><small>{milestone.earned ? 'Earned · ' : ''}{milestone.description}</small></span></li>)}</ul>
    <p className="journey-note journey-disclosure">10 XP per new section + 20 XP for finishing a module. Reading completion records your activity; practice helps you check understanding.</p>
    {account.error && <div className="progress-error" role="alert">{account.error}<Button variant="ghost" onClick={account.retry} disabled={account.busy}>Refresh progress</Button></div>}
  </section>;
}
