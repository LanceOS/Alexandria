import type { ModuleDetail, Navigate } from '../types';
import { CurriculumLink } from './CurriculumLink';

export function SectionLinks({ parts, activePartId, topicSlug, moduleId, navigate }: {
  parts: ModuleDetail['parts']; activePartId: string; topicSlug: string; moduleId: string; navigate: Navigate;
}) {
  return <ol>{parts.map((section, index) => <li key={section.id}>
    <CurriculumLink destination={{ topicSlug, moduleId, partId: section.id }} navigate={navigate} className="lesson-section-link" current={section.id === activePartId}>
      <span className="lesson-section-number">{String(index + 1).padStart(2, '0')}</span><span>{section.title}</span>
    </CurriculumLink>
  </li>)}</ol>;
}
