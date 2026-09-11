import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { CurriculumLink } from '../components/CurriculumLink';
import { Sources } from '../components/Sources';
import type { ModuleDetail, NavigationDestination } from '../types';
import { navigateFromLink } from '../utils/navigation';
import { webLink } from '../utils/sources';

test('curriculum links keep real encoded deep-link hrefs and intercept only ordinary clicks', () => {
  const destination = { topicSlug: 'c++', moduleId: 'module/one', partId: 'part & two' };
  const html = renderToStaticMarkup(<CurriculumLink destination={destination} navigate={() => {}} current>Open lesson</CurriculumLink>);
  assert.match(html, /href="\/\?topic=c%2B%2B&amp;module=module%2Fone&amp;part=part\+%26\+two"/);
  assert.match(html, /aria-current="page"/);

  const calls: NavigationDestination[] = [];
  let prevented = 0;
  const click = {
    defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false,
    preventDefault: () => { prevented += 1; },
  };
  const navigate = (next: NavigationDestination) => calls.push(next);
  navigateFromLink(click, destination, navigate);
  assert.equal(prevented, 1);
  assert.deepEqual(calls, [destination]);

  for (const variation of [{ button: 1 }, { button: 2 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { defaultPrevented: true }]) {
    navigateFromLink({ ...click, ...variation }, destination, navigate);
  }
  assert.equal(prevented, 1);
  assert.equal(calls.length, 1);
  navigateFromLink(click, null, navigate);
  assert.equal(calls.at(-1), null);
});

test('source links accept public web URLs and leave executable, local, or malformed addresses unlinked', () => {
  assert.equal(webLink('https://example.com/reference#section'), 'https://example.com/reference#section');
  assert.equal(webLink('http://example.com'), 'http://example.com/');
  for (const url of [null, '', 'javascript:alert(1)', 'data:text/html,test', 'file:///private/book.pdf', '/relative', 'not a URL']) {
    assert.equal(webLink(url), null, String(url));
  }
});

test('further reading remains visible on the final section with safe links and useful book locators', () => {
  const sources: ModuleDetail['sources'] = [
    { id: 'web', title: '<script>Reference</script>', authors: ['Author'], edition: null, publicationYear: null, locator: 'The relevant section', url: 'https://example.com/docs' },
    { id: 'book', title: 'A book', authors: ['Book author'], edition: '4th edition', publicationYear: 2013, locator: 'Chapter 2, page 39', url: null },
    { id: 'unsafe', title: 'Unlinked reference', authors: [], edition: null, publicationYear: null, locator: '', url: 'javascript:alert(1)' },
  ];
  const expanded = renderToStaticMarkup(<Sources sources={sources} expanded moduleTitle="First program" />);
  assert.match(expanded, /<section class="lesson-sources lesson-sources-expanded"/);
  assert.match(expanded, /Further reading/);
  assert.match(expanded, /href="https:\/\/example.com\/docs" target="_blank" rel="noreferrer"/);
  assert.match(expanded, /Chapter 2, page 39/);
  assert.match(expanded, /4th edition · 2013/);
  assert.match(expanded, /&lt;script&gt;Reference&lt;\/script&gt;/);
  assert.doesNotMatch(expanded, /<script>|href="javascript:/);
  assert.match(expanded, /class="lesson-source-title">A book/);
  assert.match(expanded, /class="lesson-source-title">Unlinked reference/);

  const earlier = renderToStaticMarkup(<Sources sources={sources} expanded={false} moduleTitle="First program" />);
  assert.match(earlier, /^<details class="lesson-sources">/);
  assert.equal(renderToStaticMarkup(<Sources sources={[]} expanded moduleTitle="No references" />), '');
});
