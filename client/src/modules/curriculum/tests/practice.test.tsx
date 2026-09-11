import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadPracticeCatalog } from '../../../../../server/content/practice';
import { PracticeQuestion } from '../components/PracticeQuests';

test('self-check questions have accessible answer groups and do not reveal explanations before submission', () => {
  const quest = loadPracticeCatalog()[0]!.quests[0]!;
  const html = renderToStaticMarkup(<PracticeQuestion quest={quest} onComplete={() => {}} />);
  assert.match(html, /<fieldset/);
  assert.match(html, /<legend>Choose your answer<\/legend>/);
  assert.equal((html.match(/type="radio"/g) ?? []).length, quest.choices.length);
  assert.match(html, /disabled="">Check answer/);
  assert.match(html, /Show a hint/);
  assert.ok(!html.includes(quest.explanation));
  assert.ok(!html.includes(quest.hint));
});
