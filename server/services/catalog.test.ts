import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test, { type TestContext } from 'node:test';
import type { CreateCategoryInput, CreateTopicInput, UpdateTopicInput } from '../../shared/catalog.js';
import { readLibrary } from '../db/library.js';
import { initializeSchema } from '../db/migrations.js';
import { AppError } from '../http/errors.js';
import { createCatalogService } from './catalog.js';

function fixture(t: TestContext) {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  initializeSchema(database);
  t.after(() => database.close());
  return { database, catalog: createCatalogService(database) };
}

function errorIs(statusCode: number, code?: string) {
  return (error: unknown): boolean => error instanceof AppError && error.statusCode === statusCode && (!code || error.code === code);
}

const software = { categoryId: 'category_software', position: 4 };
const ai = { categoryId: 'category_ai', position: 2 };

test('catalog records start as drafts, keep stable UUIDs, and appear publicly only after publishing', (t) => {
  const { database, catalog } = fixture(t);
  const category = catalog.createCategory({ slug: 'systems', name: ' Systems ', description: 'A category' });
  assert.match(category.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(category.name, 'Systems');
  assert.equal(category.status, 'draft');
  assert.equal(category.revision, 1);
  const topic = catalog.createTopic({ slug: 'operating-systems', name: 'Operating systems', categoryPlacements: [{ categoryId: category.id, position: 0 }] });
  assert.equal(topic.status, 'draft');
  assert.equal(topic.revision, 1);
  assert.ok(!readLibrary(database).categories.some((record) => record.id === category.id));
  assert.deepEqual(readLibrary(database).topics, []);
  const publishedCategory = catalog.updateCategory(category.id, { revision: 1, status: 'published' });
  assert.equal(publishedCategory.revision, 2);
  assert.deepEqual(readLibrary(database).topics, []);
  const published = catalog.updateTopic(topic.id, { revision: 1, slug: 'os', status: 'published' });
  assert.equal(published.id, topic.id);
  assert.equal(published.revision, 2);
  assert.equal(readLibrary(database).topics[0]?.slug, 'os');
  assert.deepEqual(readLibrary(database).topics[0]?.categoryIds, [category.id]);
});

test('topics support multiple category placements and partial updates retain membership and ordering', (t) => {
  const { database, catalog } = fixture(t);
  const topic = catalog.createTopic({ slug: 'learning', name: 'Learning', status: 'published', categoryPlacements: [ai, software] });
  assert.deepEqual(topic.categoryPlacements, [software, ai]);
  assert.deepEqual(readLibrary(database).topics[0]?.categoryIds, ['category_software', 'category_ai']);
  const renamed = catalog.updateTopic(topic.id, { revision: 1, name: 'Machine learning' });
  assert.equal(renamed.id, topic.id);
  assert.deepEqual(renamed.categoryPlacements, topic.categoryPlacements);
  const moved = catalog.updateTopic(topic.id, { revision: 2, categoryPlacements: [{ ...ai, position: 9 }] });
  assert.deepEqual(moved.categoryPlacements, [{ ...ai, position: 9 }]);
  assert.deepEqual(readLibrary(database).topics[0]?.categoryIds, ['category_ai']);
  assert.throws(() => catalog.updateTopic(topic.id, { revision: 3, name: 'Rejected', categoryPlacements: [] }), errorIs(409, 'TOPIC_REQUIRES_PUBLISHED_CATEGORY'));
  assert.deepEqual(catalog.getTopic(topic.id), moved);
});

test('publication and category archives preserve discovery invariants without deleting catalog history', (t) => {
  const { database, catalog } = fixture(t);
  const category = catalog.createCategory({ slug: 'draft-category', name: 'Draft category' });
  assert.throws(() => catalog.createTopic({ slug: 'unplaced', name: 'Unplaced', status: 'published' }), errorIs(409, 'TOPIC_REQUIRES_PUBLISHED_CATEGORY'));
  const draft = catalog.createTopic({ slug: 'draft-topic', name: 'Draft topic', categoryPlacements: [{ categoryId: category.id, position: 0 }] });
  assert.throws(() => catalog.updateTopic(draft.id, { revision: 1, status: 'published', name: 'Rejected name' }), errorIs(409, 'TOPIC_REQUIRES_PUBLISHED_CATEGORY'));
  assert.deepEqual(catalog.getTopic(draft.id), draft);
  const topic = catalog.createTopic({ slug: 'published-topic', name: 'Published topic', status: 'published', categoryPlacements: [software] });
  for (const status of ['draft', 'archived'] as const) {
    assert.throws(() => catalog.updateCategory('category_software', { revision: 1, status }), errorIs(409, 'CATEGORY_HAS_PUBLISHED_TOPICS'));
  }
  assert.equal(catalog.getCategory('category_software').revision, 1);
  catalog.updateTopic(topic.id, { revision: 1, categoryPlacements: [software, ai] });
  catalog.updateCategory('category_software', { revision: 1, status: 'archived' });
  assert.deepEqual(readLibrary(database).topics[0]?.categoryIds, ['category_ai']);
  assert.equal(catalog.getTopic(topic.id).categoryPlacements.length, 2);
  assert.throws(() => catalog.updateCategory('category_ai', { revision: 1, status: 'archived' }), errorIs(409, 'CATEGORY_HAS_PUBLISHED_TOPICS'));
  catalog.updateTopic(topic.id, { revision: 2, status: 'archived' });
  catalog.updateCategory('category_ai', { revision: 1, status: 'archived' });
  assert.deepEqual(readLibrary(database).topics, []);
  assert.equal(catalog.getTopic(topic.id).status, 'archived');
  assert.equal(catalog.getTopic(topic.id).categoryPlacements.length, 2);
  assert.equal(catalog.listTopics().pagination.total, 2);
});

test('stale revisions and slug conflicts leave both metadata and memberships unchanged', (t) => {
  const { catalog } = fixture(t);
  const topic = catalog.createTopic({ slug: 'first', name: 'First', categoryPlacements: [software] });
  const updated = catalog.updateTopic(topic.id, { revision: 1, name: 'Updated' });
  assert.throws(() => catalog.updateTopic(topic.id, { revision: 1, name: 'Stale', categoryPlacements: [ai] }), errorIs(409, 'REVISION_CONFLICT'));
  assert.deepEqual(catalog.getTopic(topic.id), updated);
  catalog.createTopic({ slug: 'taken', name: 'Taken' });
  assert.throws(() => catalog.updateTopic(topic.id, { revision: 2, slug: 'taken', categoryPlacements: [ai] }), errorIs(409, 'SLUG_CONFLICT'));
  assert.deepEqual(catalog.getTopic(topic.id), updated);
  const category = catalog.updateCategory('category_software', { revision: 1, name: 'Renamed software' });
  assert.throws(() => catalog.updateCategory(category.id, { revision: 1, name: 'Stale category' }), errorIs(409, 'REVISION_CONFLICT'));
  assert.throws(() => catalog.updateCategory(category.id, { revision: 2, slug: 'mathematics' }), errorIs(409, 'SLUG_CONFLICT'));
  assert.deepEqual(catalog.getCategory(category.id), category);
  assert.throws(() => catalog.createCategory({ slug: 'software', name: 'Duplicate' }), errorIs(409, 'SLUG_CONFLICT'));
});

test('membership insertion failures roll back new topics and every part of existing-topic updates', (t) => {
  const { database, catalog } = fixture(t);
  const topic = catalog.createTopic({ slug: 'rollback', name: 'Before failure', categoryPlacements: [software] });
  database.exec(`
    CREATE TRIGGER fail_placement BEFORE INSERT ON topic_categories
    WHEN NEW.category_id = 'category_ai'
    BEGIN SELECT RAISE(ABORT, 'Simulated membership insertion failure'); END;
  `);
  assert.throws(() => catalog.updateTopic(topic.id, { revision: 1, name: 'Must roll back', categoryPlacements: [software, ai] }), /Simulated membership/);
  assert.deepEqual(catalog.getTopic(topic.id), topic);
  assert.throws(() => catalog.createTopic({ slug: 'rolled-back-create', name: 'Must not exist', categoryPlacements: [software, ai] }), /Simulated membership/);
  assert.equal(database.prepare("SELECT id FROM topics WHERE slug = 'rolled-back-create'").get(), undefined);
  assert.equal(database.isTransaction, false);
  assert.deepEqual(database.prepare('PRAGMA foreign_key_check').all(), []);
});

test('input validation rejects malformed records, duplicate or missing placements, and invalid pagination', (t) => {
  const { catalog } = fixture(t);
  for (const input of [
    { slug: 'Bad Slug', name: 'Name' }, { slug: 'valid', name: '  ' },
    { slug: 'valid', name: 'Name', status: 'unknown' }, { slug: 'valid', name: 'Name', position: -1 },
    { slug: 'valid', name: 'Name', description: 'x'.repeat(4001) }, { slug: 'valid', name: 'Name', description: null },
    { slug: 'valid', name: 'Name', extra: true },
  ]) assert.throws(() => catalog.createCategory(input as CreateCategoryInput), errorIs(400));
  for (const categoryPlacements of [[software, software], [{ categoryId: 'missing', position: 0 }], [{ categoryId: 'category_ai', position: -1 }]]) {
    assert.throws(() => catalog.createTopic({ slug: 'invalid', name: 'Invalid', categoryPlacements } as CreateTopicInput), errorIs(400));
  }
  assert.equal(catalog.listTopics().pagination.total, 0);
  const topic = catalog.createTopic({ slug: 'valid', name: 'Valid' });
  assert.throws(() => catalog.updateTopic(topic.id, { revision: 1 } as UpdateTopicInput), errorIs(400));
  for (const options of [{ limit: 0 }, { limit: 101 }, { offset: -1 }, { offset: Number.MAX_SAFE_INTEGER + 1 }, { offset: 0.5 }]) {
    assert.throws(() => catalog.listTopics(options), errorIs(400));
  }
  assert.throws(() => catalog.getCategory('missing'), errorIs(404, 'CATEGORY_NOT_FOUND'));
  assert.throws(() => catalog.getTopic('missing'), errorIs(404, 'TOPIC_NOT_FOUND'));
});

test('admin lists are bounded, filter status, and use stable ordering across page boundaries', (t) => {
  const { catalog } = fixture(t);
  const page = catalog.listCategories({ limit: 1, offset: 1 });
  assert.deepEqual(page.pagination, { limit: 1, offset: 1, total: 3 });
  assert.equal(page.items[0]?.id, 'category_mathematics');
  const first = catalog.createTopic({ slug: 'first-same-name', name: 'Same name' });
  const second = catalog.createTopic({ slug: 'second-same-name', name: 'Same name' });
  catalog.createTopic({ slug: 'archived', name: 'Archived topic', status: 'archived' });
  const expected = [first.id, second.id].sort();
  const left = catalog.listTopics({ status: 'draft', limit: 1 });
  const right = catalog.listTopics({ status: 'draft', limit: 1, offset: 1 });
  assert.equal(left.pagination.total, 2);
  assert.deepEqual([left.items[0]?.id, right.items[0]?.id], expected);
  assert.deepEqual(catalog.listTopics({ offset: 100 }).items, []);
  assert.equal(catalog.listTopics({ status: 'archived' }).items[0]?.slug, 'archived');
});
