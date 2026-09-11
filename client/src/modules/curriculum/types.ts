import type { RefObject } from 'react';
import type { Navigate } from '../../types/navigation';

export type { CurriculumUnit, LessonBlock, ModuleDetail, ModuleSummary, TopicOutline } from '../../../../shared/curriculum';
export type { Navigate, NavigationDestination } from '../../types/navigation';

export interface CurriculumProps {
  topicSlug: string;
  moduleId: string | null;
  partId: string | null;
  onNavigate: Navigate;
}

export type HeadingRef = RefObject<HTMLHeadingElement | null>;
