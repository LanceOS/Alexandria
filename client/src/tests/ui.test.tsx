import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button, EmptyState, IconButton, TextField } from '../components/ui';

test('shared buttons default to non-submitting controls and retain accessible labels', () => {
  const button = renderToStaticMarkup(<Button disabled>Save</Button>);
  assert.match(button, /type="button"/);
  assert.match(button, /disabled=""/);
  const iconButton = renderToStaticMarkup(<IconButton aria-label="Open navigation">Menu</IconButton>);
  assert.match(iconButton, /aria-label="Open navigation"/);
  assert.match(renderToStaticMarkup(<Button type="submit">Submit</Button>), /type="submit"/);
});

test('shared fields associate labels with inputs and render supplied text safely', () => {
  const field = renderToStaticMarkup(<TextField id="search" label="Search topics" defaultValue={'<script>alert(1)</script>'} />);
  assert.match(field, /for="search"/);
  assert.match(field, /id="search"/);
  assert.doesNotMatch(field, /<script>/);
  const empty = renderToStaticMarkup(<EmptyState title="Nothing here" description={'<img src=x onerror=alert(1)>'} />);
  assert.doesNotMatch(empty, /<img/);
  assert.match(empty, /&lt;img/);
});
