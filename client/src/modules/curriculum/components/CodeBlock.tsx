import { useEffect, useRef, useState } from 'react';
import { Button, Icon } from '../../../components/ui';
import type { LessonBlock } from '../types';

export function CodeBlock({ block }: { block: Extract<LessonBlock, { type: 'code' }> }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(resetRef.current), []);
  const label = block.language === 'cpp' ? 'C++' : block.language === 'shell' ? 'Terminal' : 'Output';

  async function copy() {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    window.clearTimeout(resetRef.current);
    resetRef.current = window.setTimeout(() => setCopyState('idle'), 3000);
  }

  return <figure className="lesson-code">
    <div className="lesson-code-toolbar">
      <span>{label}</span>
      <Button variant="ghost" className="lesson-copy" aria-label={`Copy ${label === 'Output' ? 'output' : 'code'}`} onClick={() => void copy()}>
        {copyState === 'copied' && <Icon name="check" size={14} />}<span aria-live="polite">{copyState === 'copied' ? 'Copied' : 'Copy'}</span>
      </Button>
    </div>
    <pre tabIndex={0} aria-label={`${label} example`}><code>{block.code}</code></pre>
    {copyState === 'failed' && <p className="lesson-copy-help" role="status">Select the text above to copy it.</p>}
    {block.caption && <figcaption>{block.caption}</figcaption>}
  </figure>;
}

