import { useEffect, useId, useState, type ComponentType } from 'react';
import { Button, Icon } from '../../../components/ui';

export interface CodeEditorProps { initialSource: string }

export function CodePlayground({ initialSource, scratchpad = false }: CodeEditorProps & { scratchpad?: boolean }) {
  const editorId = useId();
  const [expanded, setExpanded] = useState(false);
  const [opened, setOpened] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [Editor, setEditor] = useState<ComponentType<CodeEditorProps> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!opened) return;
    let active = true;
    setFailed(false);
    void import('./CodeEditor').then((module) => { if (active) setEditor(() => module.CodeEditor); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [opened, attempt]);

  return <div className="code-playground">
    <div className="code-playground-launcher">
      <Button variant="secondary" aria-expanded={expanded} aria-controls={editorId}
        onClick={() => { setOpened(true); setExpanded(!expanded); }}>
        <Icon name="code" size={16} />{expanded ? 'Hide editor' : scratchpad ? 'Open C++ scratchpad' : 'Edit and run'}
      </Button>
      <span>C++20 · edits for this visit</span>
    </div>
    <div id={editorId} hidden={!expanded}>
      {opened && (Editor ? <Editor initialSource={initialSource} /> : failed
        ? <p className="code-runner-message" role="alert">The editor couldn’t load. <Button variant="ghost" onClick={() => setAttempt((value) => value + 1)}>Try again</Button></p>
        : <p className="code-runner-message" role="status">Opening the code editor…</p>)}
    </div>
  </div>;
}
