import { useEffect, useId, useRef, useState } from 'react';
import { isModulePractice, type ModulePractice, type PracticeQuest } from '../../../../../shared/practice';
import { Button, Icon } from '../../../components/ui';
import { useResource } from '../../../hooks/useResource';
import { CodeBlock } from './CodeBlock';

export function PracticeQuestion({ quest, onComplete }: { quest: PracticeQuest; onComplete: (id: string) => void }) {
  const groupId = useId();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const [assisted, setAssisted] = useState(false);
  const firstChoice = useRef<HTMLInputElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const submitted = useRef(false);
  const correct = choice === quest.answerIndex;

  useEffect(() => {
    if (submitted.current) (checked ? feedback.current : firstChoice.current)?.focus();
  }, [checked]);

  function check() {
    if (choice === null) return;
    submitted.current = true;
    setChecked(true);
    if (correct) onComplete(quest.id);
    else setAssisted(true);
  }

  return <div className="practice-question">
    <p>{quest.prompt}</p>
    <CodeBlock block={{ type: 'code', language: 'cpp', code: quest.code }} />
    <fieldset disabled={checked} aria-describedby={checked ? `${groupId}-feedback` : undefined}>
      <legend>Choose your answer</legend>
      {quest.choices.map((answer, index) => <label key={index} className={`practice-choice${choice === index ? ' is-selected' : ''}`}>
        <input ref={index === 0 ? firstChoice : undefined} type="radio" name={groupId} value={index} checked={choice === index} onChange={() => setChoice(index)} />
        <span>{answer}</span>
      </label>)}
    </fieldset>
    {!checked && <div className="practice-question-actions">
      <Button onClick={check} disabled={choice === null}>Check answer<Icon name="arrow-right" size={15} /></Button>
      <Button variant="ghost" onClick={() => { setHint(true); setAssisted(true); }} disabled={hint}>Show a hint</Button>
    </div>}
    {hint && !checked && <p className="practice-hint" role="status">{quest.hint}</p>}
    {checked && <div ref={feedback} tabIndex={-1} id={`${groupId}-feedback`} className={`practice-feedback${correct ? ' is-correct' : ''}`} role="status">
      <strong>{correct ? assisted ? 'Correct, with help' : 'Correct' : 'Not quite yet'}</strong>
      <p>{quest.explanation}</p>
      {correct ? <span><Icon name="check" size={14} />Quest finished for this visit</span>
        : <Button variant="secondary" onClick={() => { setChoice(null); setChecked(false); }}>Try again</Button>}
    </div>}
  </div>;
}

function QuestCollection({ practice }: { practice: ModulePractice }) {
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());
  const titleId = useId();
  return <section className="practice-expedition" aria-labelledby={titleId}>
    <div className="curriculum-label"><Icon name="sparkles" size={15} />PUT IT INTO PRACTICE</div>
    <div className="practice-heading"><h2 id={titleId}>Your next challenge</h2><span aria-live="polite">{completed.size} / {practice.quests.length} finished</span></div>
    <p className="practice-intro">Predict, debug, and test your reasoning. Hints are welcome. These self-checks stay in this visit and do not award XP.</p>
    {practice.quests.map((quest, index) => <details className="practice-quest" key={quest.id} open={index === 0 ? true : undefined}>
      <summary><span><span className="practice-quest-marker" aria-hidden="true">{completed.has(quest.id) ? <Icon name="check" size={17} /> : String(index + 1).padStart(2, '0')}</span>{quest.title}{completed.has(quest.id) && <span className="sr-only"> · Finished for this visit</span>}</span><Icon name="chevron-down" size={16} /></summary>
      <PracticeQuestion quest={quest} onComplete={(id) => setCompleted((previous) => new Set([...previous, id]))} />
    </details>)}
    {completed.size === practice.quests.length && <p className="practice-celebration" role="status"><Icon name="sparkles" size={17} />Expedition finished. Try explaining one solution in your own words.</p>}
  </section>;
}

export function PracticeQuests({ moduleId, versionId }: { moduleId: string; versionId: string }) {
  const resource = useResource<ModulePractice>(`/api/modules/${encodeURIComponent(moduleId)}/practice`, isModulePractice);
  if (resource.error) return <div className="practice-unavailable" role="status">Practice challenges couldn’t load. <Button variant="ghost" onClick={resource.retry}>Try again</Button></div>;
  if (!resource.data || resource.data.moduleId !== moduleId || resource.data.versionId !== versionId || !resource.data.quests.length) return null;
  return <QuestCollection key={`${moduleId}-${versionId}`} practice={resource.data} />;
}
