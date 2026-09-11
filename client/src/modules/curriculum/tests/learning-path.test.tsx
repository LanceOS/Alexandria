import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CurriculumUnit, ModuleSummary } from '../types';
import { LearningPath } from '../components/LearningPath';
import { LearningPathNavigation } from '../components/LearningPathNavigation';
import { buildLearningPath, initialExpandedUnits, revealUnit } from '../utils/learningPath';

function pathFixture() {
  const module = (id: string, unitId: string): ModuleSummary => ({ id, unitId, slug: id, title: id, summary: '', versionId: `${id}-v1`, sectionCount: 1 });
  const unit = (id: string, parentUnitId: string | null, modules: ModuleSummary[] = []): CurriculumUnit => ({
    id, parentUnitId, name: id, slug: id, description: '', position: 0, modules,
  });
  // A published outline can list parents and children apart; preserve sibling/module order.
  return [
    unit('C++', null),
    unit('Basics', 'C++', [module('First program', 'Basics'), module('Variables', 'Basics')]),
    unit('Advanced', 'C++', [module('Ownership', 'Advanced')]),
    unit('Another topic unit', null),
    unit('Templates', 'Advanced', [module('Generic functions', 'Templates')]),
  ];
}

test('learning-path navigation follows the hierarchy and counts nested modules without duplicating them', () => {
  const { roots, entries } = buildLearningPath(pathFixture());
  assert.deepEqual(roots.map((entry) => entry.unit.id), ['C++', 'Another topic unit']);
  assert.deepEqual(entries.map((entry) => entry.unit.id), ['C++', 'Basics', 'Advanced', 'Templates', 'Another topic unit']);
  assert.deepEqual(entries.find((entry) => entry.unit.id === 'Templates')?.ancestors, ['C++', 'Advanced']);
  assert.equal(roots[0]?.moduleCount, 4);
  assert.equal(entries.find((entry) => entry.unit.id === 'Advanced')?.moduleCount, 2);
  assert.equal(roots[1]?.moduleCount, 0);
});

test('the first learning branch starts open while saved collapsed or expanded choices survive returning to the path', () => {
  const { entries } = buildLearningPath(pathFixture());
  assert.deepEqual([...initialExpandedUnits(entries, null)], ['Basics']);
  assert.deepEqual([...initialExpandedUnits(entries, '[]')], []);
  assert.deepEqual([...initialExpandedUnits(entries, '["Advanced","Templates","removed-unit","C++"]')], ['Advanced', 'Templates']);
  for (const invalid of ['{', 'null', '{}', '[42]']) {
    assert.deepEqual([...initialExpandedUnits(entries, invalid)], ['Basics']);
  }
});

test('jumping to a nested subunit reveals every ancestor and retains other open branches', () => {
  const { entries } = buildLearningPath(pathFixture());
  const expanded = new Set(['Basics']);
  assert.deepEqual([...revealUnit(entries, expanded, 'Templates')], ['Basics', 'Advanced', 'Templates']);
  assert.deepEqual([...expanded], ['Basics']);
  assert.deepEqual([...revealUnit(entries, expanded, 'deleted')], ['Basics']);
});

test('empty paths and missing parents are safe and malformed cycles cannot recurse indefinitely', () => {
  assert.deepEqual(buildLearningPath([]), { roots: [], entries: [] });
  const units = pathFixture();
  const basics = units[1];
  const advanced = units[2];
  assert.ok(basics && advanced);
  const orphan = { ...basics, parentUnitId: 'not-published' };
  assert.equal(buildLearningPath([orphan]).roots[0]?.unit.id, 'Basics');
  const cycle = [{ ...basics, parentUnitId: 'Advanced' }, { ...advanced, parentUnitId: 'Basics' }];
  assert.deepEqual(buildLearningPath(cycle), { roots: [], entries: [] });
});

test('subunit controls expose their expanded state and hide collapsed module links from keyboard navigation', () => {
  const html = renderToStaticMarkup(<LearningPath units={pathFixture()} topicSlug="cpp" navigate={() => {}} />);
  assert.match(html, /aria-expanded="true" aria-controls="unit-content-Basics"/);
  assert.match(html, /aria-expanded="false" aria-controls="unit-content-Advanced"/);
  assert.match(html, /id="unit-content-Advanced" class="curriculum-unit-content" hidden=""/);
  assert.match(html, /id="unit-content-Templates" class="curriculum-unit-content" hidden=""/);
  assert.match(html, /curriculum-subunit-count">2 modules/);
  assert.match(html, /href="\/\?topic=cpp&amp;module=Generic\+functions"/);
  assert.match(html, /Expand all/);
});

test('the jump picker exposes modules inside collapsed nested subunits with an explicit Go action', () => {
  const { entries } = buildLearningPath(pathFixture());
  const html = renderToStaticMarkup(<LearningPathNavigation entries={entries} topicSlug="cpp" navigate={() => {}}
    onJumpToUnit={() => {}} allExpanded={false} onToggleAll={() => {}} collapsibleCount={3} />);
  assert.match(html, /<optgroup label="C\+\+ \/ Advanced \/ Templates">/);
  assert.match(html, /value="unit:Templates">Templates — overview/);
  assert.match(html, /value="module:Generic functions">Generic functions/);
  assert.match(html, /<button type="submit"[^>]*disabled="" aria-label="Go to selection"/);
});
