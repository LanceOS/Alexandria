import type { LearningProgress, ModuleProgress } from '../../../../../shared/progress';
import type { ModuleDetail, ModuleSummary } from '../../../../../shared/curriculum';

export function currentModuleProgress(progress: LearningProgress | null, module: Pick<ModuleSummary, 'id' | 'versionId'>): ModuleProgress | undefined {
  return progress?.modules.find((entry) => entry.moduleId === module.id && entry.versionId === module.versionId);
}

export function readingStatus(progress: LearningProgress | null, module: ModuleSummary) {
  const saved = currentModuleProgress(progress, module);
  const sections = Math.min(module.sectionCount, new Set(saved?.completedPartIds ?? []).size);
  const complete = module.sectionCount > 0 && sections === module.sectionCount;
  return { sections, complete, label: complete ? 'Reading complete' : sections ? `${sections} of ${module.sectionCount} sections read` : 'Ready to explore' };
}

export function nextReadingModule(modules: ModuleSummary[], progress: LearningProgress | null) {
  return modules.find((module) => !readingStatus(progress, module).complete);
}

/** A saved explicit section link always takes priority over suggested continuation. */
export function nextReadingPart(detail: ModuleDetail, progress: LearningProgress | null) {
  const saved = currentModuleProgress(progress, detail.module);
  return detail.parts.find((part) => !saved?.completedPartIds.includes(part.id)) ?? detail.parts[0];
}

export function earnedMilestones(progress: LearningProgress) {
  return [
    { title: 'First page turned', description: 'Read your first section', earned: progress.completedSections >= 1 },
    { title: 'First volume', description: 'Finish reading one module', earned: progress.completedModules >= 1 },
    { title: 'Building a collection', description: 'Finish reading five modules', earned: progress.completedModules >= 5 },
  ];
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const count = (value: unknown) => Number.isInteger(value) && Number(value) >= 0;
const nullableString = (value: unknown) => value === null || typeof value === 'string';

export function isLearningProgress(value: unknown): value is LearningProgress {
  return record(value) && Array.isArray(value.modules) && value.modules.every((entry: unknown) => record(entry)
    && typeof entry.moduleId === 'string' && typeof entry.versionId === 'string'
    && Array.isArray(entry.completedPartIds) && entry.completedPartIds.every((id: unknown) => typeof id === 'string')
    && nullableString(entry.lastPartId) && nullableString(entry.completedAt) && nullableString(entry.completedVersionId))
    && count(value.totalXp) && count(value.completedModules) && count(value.completedSections)
    && Number.isInteger(value.weeklyGoal) && Number(value.weeklyGoal) >= 1 && Number(value.weeklyGoal) <= 14
    && count(value.weeklyCompleted) && typeof value.weekStartsOn === 'string' && typeof value.timeZone === 'string';
}
