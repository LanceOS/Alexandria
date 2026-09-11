/** Reading activity is self-reported; it does not establish assessed mastery. */
export interface ModuleProgress {
  moduleId: string;
  versionId: string;
  completedPartIds: string[];
  lastPartId: string | null;
  completedAt: string | null;
  completedVersionId: string | null;
}

export interface LearningProgress {
  modules: ModuleProgress[];
  totalXp: number;
  completedModules: number;
  completedSections: number;
  weeklyGoal: number;
  weeklyCompleted: number;
  weekStartsOn: string;
  timeZone: string;
}

export const SECTION_XP = 10;
export const MODULE_XP = 20;
