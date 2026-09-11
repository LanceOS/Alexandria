import { Icon } from '../../../components/ui';
import type { LessonBlock } from '../types';

export function Reflection({ block }: { block: Extract<LessonBlock, { type: 'reflection' }> }) {
  return <section className="lesson-reflection" aria-label="Pause and reflect">
    <div className="curriculum-label"><Icon name="sparkles" size={15} />PAUSE & REFLECT</div>
    <p>{block.prompt}</p>
    <details><summary>Reveal explanation<Icon name="chevron-down" size={15} /></summary><p>{block.explanation}</p></details>
  </section>;
}
