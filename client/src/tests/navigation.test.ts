import assert from 'node:assert/strict';
import test from 'node:test';
import { curriculumUrl, destinationHref, filtersUrl, readNavigation, shouldInterceptNavigation, subjectUrl } from '../utils/navigation';

test('deep links restore both the reader location and library filters', () => {
  assert.deepEqual(readNavigation('?subject=software&q=C%2B%2B&topic=cpp&module=first&part=output'), {
    filters: { category: 'software', query: 'C++' },
    curriculum: { topicSlug: 'cpp', moduleId: 'first', partId: 'output' },
  });
  assert.deepEqual(readNavigation(''), {
    filters: { category: 'all', query: '' },
    curriculum: { topicSlug: null, moduleId: null, partId: null },
  });
});

test('reader navigation clears stale sections while retaining library context and unrelated query parameters', () => {
  const original = 'http://localhost:5173/?subject=software&q=loops&topic=cpp&module=first&part=old&view=quiet#subjects';
  const next = curriculumUrl(original, { topicSlug: 'cpp', moduleId: 'next' });
  assert.equal(next.searchParams.get('subject'), 'software');
  assert.equal(next.searchParams.get('q'), 'loops');
  assert.equal(next.searchParams.get('view'), 'quiet');
  assert.equal(next.searchParams.get('module'), 'next');
  assert.equal(next.searchParams.has('part'), false);
  assert.equal(next.hash, '');
  const library = curriculumUrl(next.href, null);
  assert.equal(library.searchParams.has('topic'), false);
  assert.equal(library.searchParams.has('module'), false);
  assert.equal(library.searchParams.get('q'), 'loops');
});

test('subject selection returns to the library and search updates preserve the selected subject', () => {
  const original = 'http://localhost:5173/?subject=software&q=hello&topic=cpp&module=first&part=old#subjects';
  const subject = subjectUrl(original, 'mathematics');
  assert.equal(subject.searchParams.get('subject'), 'mathematics');
  assert.equal(subject.searchParams.get('q'), 'hello');
  assert.equal(subject.searchParams.has('topic'), false);
  assert.equal(subject.searchParams.has('part'), false);
  const search = filtersUrl(subject.href, { query: 'a & b' });
  assert.equal(search.searchParams.get('subject'), 'mathematics');
  assert.equal(search.searchParams.get('q'), 'a & b');
  assert.equal(search.hash, '#subjects');
  const cleared = filtersUrl(search.href, { query: '', category: 'all' });
  assert.equal(cleared.search, '');
});

test('link destinations encode special characters and modified clicks keep browser behavior', () => {
  const href = destinationHref({ topicSlug: 'c++', moduleId: 'module/one', partId: 'a & b' });
  assert.deepEqual(readNavigation(href.slice(1)).curriculum, { topicSlug: 'c++', moduleId: 'module/one', partId: 'a & b' });
  assert.equal(destinationHref(null), '/');
  const click = { defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
  assert.equal(shouldInterceptNavigation(click), true);
  for (const change of [{ defaultPrevented: true }, { button: 1 }, { button: 2 }, { metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }]) {
    assert.equal(shouldInterceptNavigation({ ...click, ...change }), false);
  }
});
