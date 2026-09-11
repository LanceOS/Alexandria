import type { ModuleDetail, ModuleSummary, TopicOutline } from '../types';

export function readerFixture() {
  const topic = { id: 'cpp', slug: 'cpp', name: 'C++', description: 'A language topic' };
  const module = (id: string, unitId: string): ModuleSummary => ({
    id, unitId, slug: id, title: id, summary: '', versionId: `${id}-v1`, sectionCount: 2,
  });
  const current = module('z-first', 'basics');
  const following = module('a-second', 'basics');
  const outline: TopicOutline = { topic, units: [
    { id: 'basics', parentUnitId: null, name: 'Basics', slug: 'basics', description: '', position: 0, modules: [current, following] },
    { id: 'other', parentUnitId: null, name: 'Other', slug: 'other', description: '', position: 1, modules: [module('other-module', 'other')] },
  ] };
  const detail: ModuleDetail = {
    module: current, topic, units: [{ id: 'basics', name: 'Basics', slug: 'basics' }],
    version: { id: current.versionId, number: 1, objectives: [] },
    parts: [
      { id: 'intro', title: 'Introduction', position: 0, blocks: [{ type: 'paragraph', text: 'First idea.' }] },
      { id: 'practice', title: 'Practice', position: 1, blocks: [{ type: 'paragraph', text: 'Try the idea.' }] },
    ],
    sources: [],
  };
  return { outline, detail, following };
}
