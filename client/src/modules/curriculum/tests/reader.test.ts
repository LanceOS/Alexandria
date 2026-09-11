import assert from 'node:assert/strict';
import test from 'node:test';
import { getReaderNavigation, hasUnavailableContent, selectReaderSection } from '../utils/reader';
import { readerFixture } from './fixtures';

test('section selection supports the initial page and stable deep links without replacing stale IDs', () => {
  const { detail } = readerFixture();
  assert.equal(selectReaderSection(detail, null).part?.id, 'intro');
  assert.equal(selectReaderSection(detail, 'practice').partIndex, 1);
  assert.deepEqual(selectReaderSection(detail, 'removed-part'), { partIndex: -1, part: undefined });
  assert.deepEqual(selectReaderSection(null, 'practice'), { partIndex: -1, part: undefined });
  assert.equal(selectReaderSection({ ...detail, parts: [] }, null).part, undefined);
});

test('section navigation stays in the module until its last section', () => {
  const { outline, detail } = readerFixture();
  const first = getReaderNavigation(outline, detail, 0, 'cpp');
  assert.equal(first.finalSection, false);
  assert.equal(first.previous, undefined);
  assert.deepEqual(first.nextDestination, { topicSlug: 'cpp', moduleId: 'z-first', partId: 'practice' });
});

test('the last section advances in owning-unit outline order and starts the next module without a stale part', () => {
  const { outline, detail, following } = readerFixture();
  const last = getReaderNavigation(outline, detail, 1, 'cpp');
  assert.equal(last.finalSection, true);
  assert.equal(last.previous?.id, 'intro');
  assert.equal(last.next, undefined);
  assert.equal(last.nextModule?.id, following.id);
  assert.deepEqual(last.nextDestination, { topicSlug: 'cpp', moduleId: following.id });
});

test('the final module returns to its learning path without crossing into another unit', () => {
  const { outline, detail, following } = readerFixture();
  const last = getReaderNavigation(outline, { ...detail, module: following }, 1, 'cpp');
  assert.equal(last.nextModule, undefined);
  assert.deepEqual(last.nextDestination, { topicSlug: 'cpp' });
});

test('unavailable module links cannot show another topic or a module missing from the published outline', () => {
  const { outline, detail } = readerFixture();
  assert.equal(hasUnavailableContent(outline, detail, 'cpp', detail.module.id), false);
  assert.equal(hasUnavailableContent(outline, detail, 'python', detail.module.id), true);
  assert.equal(hasUnavailableContent(outline, detail, 'cpp', 'another-module'), true);
  assert.equal(hasUnavailableContent({ ...outline, units: [] }, detail, 'cpp', detail.module.id), true);
  assert.equal(hasUnavailableContent(outline, { ...detail, topic: { ...detail.topic, slug: 'python' } }, 'cpp', detail.module.id), true);
});
