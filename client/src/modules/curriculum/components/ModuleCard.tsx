import { Icon } from '../../../components/ui';
import type { ModuleSummary, Navigate } from '../types';
import { CurriculumLink } from './CurriculumLink';

export function ModuleCard({ module, index, topicSlug, navigate }: {
  module: ModuleSummary; index: number; topicSlug: string; navigate: Navigate;
}) {
  return <CurriculumLink destination={{ topicSlug, moduleId: module.id }} navigate={navigate} className="curriculum-module-card">
    <span className="curriculum-module-icon"><Icon name="book" size={21} /></span>
    <span className="curriculum-module-copy">
      <span className="curriculum-label">MODULE {String(index + 1).padStart(2, '0')}</span>
      <span className="curriculum-module-title">{module.title}</span>
      <span className="curriculum-module-summary">{module.summary}</span>
      <span className="curriculum-module-meta"><span>{module.sectionCount} {module.sectionCount === 1 ? 'section' : 'sections'}</span><span aria-hidden="true">·</span><span>Read at your own pace</span></span>
    </span>
    <Icon name="arrow-right" size={20} />
  </CurriculumLink>;
}

