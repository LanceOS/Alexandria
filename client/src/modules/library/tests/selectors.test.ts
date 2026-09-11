import assert from 'node:assert/strict';
import test from 'node:test';
import type { LibraryResponse } from '../types/index.js';
import { countCategoryTopics, filterTopics, selectedCategory } from '../utils/selectors.js';
import { isLibraryResponse } from '../utils/validation.js';

const library: LibraryResponse = {
  instance: { id: 'test-instance', createdAt: '2026-09-11T00:00:00.000Z' },
  categories: [
    { id: 'software', slug: 'software', name: 'Software', description: 'Programs and systems.', position: 0 },
    { id: 'math', slug: 'mathematics', name: 'Mathematics', description: 'Patterns and proofs.', position: 1 },
    { id: 'ai', slug: 'artificial-intelligence', name: 'AI', description: 'Learning systems.', position: 2 },
  ],
  topics: [
    { id: 'cpp', slug: 'cpp', name: 'C++', description: 'Write small programs.', categoryIds: ['software'] },
    { id: 'algorithms', slug: 'algorithms', name: 'Algorithms', description: 'Programs, patterns, and reasoning.', categoryIds: ['software', 'math'] },
    { id: 'proofs', slug: 'proofs', name: 'Proofs', description: 'Build mathematical arguments.', categoryIds: ['math'] },
  ],
};

test('topic filters combine the selected category with trimmed case-insensitive name and description matching', () => {
  assert.deepEqual(filterTopics(library, { category: 'software', query: '  PROGRAMS  ' }).map((topic) => topic.id), ['cpp', 'algorithms']);
  assert.deepEqual(filterTopics(library, { category: 'mathematics', query: 'programs' }).map((topic) => topic.id), ['algorithms']);
  assert.deepEqual(filterTopics(library, { category: 'all', query: ' C++ ' }).map((topic) => topic.id), ['cpp']);
  assert.deepEqual(filterTopics(library, { category: 'all', query: 'does not exist' }), []);
  assert.deepEqual(library.topics.map((topic) => topic.id), ['cpp', 'algorithms', 'proofs']);
});

test('empty, loading, and stale subject filters retain the existing library behavior', () => {
  assert.deepEqual(filterTopics(null, { category: 'all', query: '' }), []);
  assert.deepEqual(filterTopics(library, { category: 'artificial-intelligence', query: '' }), []);
  assert.deepEqual(filterTopics(library, { category: 'removed-category', query: '  ' }), library.topics);
  assert.equal(selectedCategory(library, 'removed-category'), undefined);
  assert.equal(selectedCategory(library, 'mathematics')?.id, 'math');
});

test('subject totals count a topic in each of its categories independently of active search filters', () => {
  assert.equal(countCategoryTopics(library, 'software'), 2);
  assert.equal(countCategoryTopics(library, 'math'), 2);
  assert.equal(countCategoryTopics(library, 'ai'), 0);
  assert.equal(countCategoryTopics(null, 'software'), 0);
  filterTopics(library, { category: 'software', query: 'C++' });
  assert.equal(countCategoryTopics(library, 'software'), 2);
});

test('response validation accepts empty or populated catalogs without rewriting the response', () => {
  const before = JSON.stringify(library);
  assert.equal(isLibraryResponse(library), true);
  assert.equal(isLibraryResponse({ ...library, categories: [], topics: [] }), true);
  assert.equal(JSON.stringify(library), before);
});

test('response validation rejects malformed fields that topic filtering and navigation rely on', () => {
  const invalid: unknown[] = [
    null, [], {}, { ...library, instance: null },
    { ...library, categories: null }, { ...library, topics: {} },
    { ...library, categories: [null] },
    { ...library, categories: [{ ...library.categories[0], position: '0' }] },
    { ...library, categories: [{ ...library.categories[0], position: -1 }] },
    { ...library, topics: [null] },
    { ...library, topics: [{ ...library.topics[0], description: 42 }] },
    { ...library, topics: [{ ...library.topics[0], categoryIds: null }] },
    { ...library, topics: [{ ...library.topics[0], categoryIds: [42] }] },
  ];
  for (const response of invalid) assert.equal(isLibraryResponse(response), false);
});
