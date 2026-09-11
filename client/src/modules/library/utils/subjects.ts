import type { IconName } from '../../../components/ui/index.js';

export const subjectStyles: Record<string, { icon: IconName; label: string; className: string }> = {
  software: { icon: 'code', label: 'Software & Computing', className: 'software' },
  mathematics: { icon: 'sigma', label: 'Mathematics', className: 'mathematics' },
  'artificial-intelligence': { icon: 'sparkles', label: 'Artificial Intelligence', className: 'ai' },
};
