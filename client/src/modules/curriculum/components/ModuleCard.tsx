import { Icon } from '../../../components/ui';
import type { ModuleSummary, Navigate } from '../types';
import { CurriculumLink } from './CurriculumLink';
import { readingStatus, useLearningProgress } from '../../progress';

export function ModuleCard({ module, index, topicSlug, navigate }: {
  module: ModuleSummary; index: number; topicSlug: string; navigate: Navigate;
}) {
  const { progress } = useLearningProgress();
  const status = readingStatus(progress, module);
  return <CurriculumLink destination={{ topicSlug, moduleId: module.id }} navigate={navigate} className="curriculum-module-card">
    <span className={`curriculum-module-icon${status.complete ? ' is-read' : ''}`}><Icon name={status.complete ? 'check' : 'book'} size={21} /></span>
    <span className="curriculum-module-copy">
      <span className="curriculum-label">MODULE {String(index + 1).padStart(2, '0')}</span>
      <span className="curriculum-module-title">{module.title}</span>
      <span className="curriculum-module-summary">{module.summary}</span>
      <span className="curriculum-module-meta"><span>{module.sectionCount} {module.sectionCount === 1 ? 'section' : 'sections'}</span><span aria-hidden="true">·</span><span className={status.complete ? 'module-reading-complete' : ''}>{progress ? status.label : 'Read at your own pace'}</span></span>
    </span>
    <Icon name="arrow-right" size={20} />
  </CurriculumLink>;
}
