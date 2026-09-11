import type { LessonBlock } from '../types';
import { CodeBlock } from './CodeBlock';
import { Reflection } from './Reflection';

export function ContentBlock({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'paragraph': return <p>{block.text}</p>;
    case 'code': return <CodeBlock block={block} />;
    case 'list': return <ul className="lesson-list">{block.items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
    case 'callout': return <aside className="lesson-callout"><span className="lesson-callout-mark" aria-hidden="true">↳</span><div><h3>{block.title}</h3><p>{block.text}</p></div></aside>;
    case 'reflection': return <Reflection block={block} />;
  }
}

