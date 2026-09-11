import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExtraReading } from '../components/ExtraReading';
import type { ExtraReadingReference } from '../types';
import { isOutline } from '../utils/validation';
import { readerFixture } from './fixtures';

const reference: ExtraReadingReference = {
  id: 'book', title: 'A useful book', authors: ['An Author'], edition: '4th edition', publicationYear: 2013,
  url: 'https://example.com/book', citations: [{ moduleId: 'z-first', locator: 'Chapter 2, pages 40–42' }],
};

test('overview reading links to resources and their modules while retaining useful bibliographic notes', () => {
  const { outline } = readerFixture();
  const html = renderToStaticMarkup(<ExtraReading references={[reference]} modules={outline.units.flatMap((unit) => unit.modules)} topicSlug="cpp" navigate={() => {}} />);
  assert.match(html, /id="extra-reading-heading" tabindex="-1">Extra Reading/);
  assert.match(html, /href="https:\/\/example.com\/book" target="_blank" rel="noreferrer"/);
  assert.match(html, /4th edition · 2013/);
  assert.match(html, /Chapter 2, pages 40–42/);
  assert.match(html, /href="\/\?topic=cpp&amp;module=z-first"/);
  assert.match(html, /Reading notes/);
});

test('the overview previews four references and offers the full list without making the page long by default', () => {
  const references = Array.from({ length: 6 }, (_, index) => ({ ...reference, id: String(index), title: `Reference ${index}` }));
  const html = renderToStaticMarkup(<ExtraReading references={references} modules={[]} topicSlug="cpp" navigate={() => {}} />);
  assert.equal((html.match(/class="curriculum-reading-card"/g) ?? []).length, 4);
  assert.match(html, /Show all 6 references/);
  assert.match(html, /aria-expanded="false" aria-controls="extra-reading-list"/);
  assert.doesNotMatch(html, /Reference 4|Reference 5/);
});

test('reading without links and an empty overview remain useful without rendering unsafe markup', () => {
  const html = renderToStaticMarkup(<ExtraReading references={[{ ...reference, title: '<script>Book</script>', url: 'javascript:alert(1)' },
    { ...reference, id: 'offline', url: null }]} modules={[]} topicSlug="cpp" navigate={() => {}} />);
  assert.match(html, /&lt;script&gt;Book&lt;\/script&gt;/);
  assert.doesNotMatch(html, /href=|<script>/);
  const empty = renderToStaticMarkup(<ExtraReading references={[]} modules={[]} topicSlug="empty" navigate={() => {}} />);
  assert.match(empty, /Extra Reading/);
  assert.match(empty, /Reading references will appear here as modules are added/);
});

test('outline validation requires safe-to-render reading shapes, including module citations', () => {
  const { outline } = readerFixture();
  assert.equal(isOutline(outline), true);
  assert.equal(isOutline({ ...outline, extraReading: [reference] }), true);
  for (const bad of [undefined, null, {}, [null], [{ ...reference, authors: [42] }], [{ ...reference, citations: [null] }], [{ ...reference, citations: [{ moduleId: 'z-first' }] }]]) {
    assert.equal(isOutline({ ...outline, extraReading: bad }), false);
  }
});
