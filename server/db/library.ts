import type { DatabaseSync } from 'node:sqlite';
import type { Category, LibraryResponse, Topic } from '../../shared/library.js';

export function readLibrary(database: DatabaseSync): LibraryResponse {
  const instance = database.prepare('SELECT id, created_at AS createdAt FROM instance_metadata WHERE singleton = 1').get();
  if (!instance) throw new Error('Database instance metadata is missing.');

  const categories = database.prepare(`
    SELECT id, slug, name, description, position FROM categories
    WHERE status = 'published' ORDER BY position, id
  `).all() as unknown as Category[];
  const placements = database.prepare(`
    SELECT tc.topic_id AS topicId, tc.category_id AS categoryId
    FROM topic_categories tc
    JOIN categories c ON c.id = tc.category_id AND c.status = 'published'
    JOIN topics t ON t.id = tc.topic_id AND t.status = 'published'
    ORDER BY c.position, c.id, tc.position, tc.topic_id
  `).all() as Array<{ topicId: string; categoryId: string }>;
  const categoryIds = new Map<string, string[]>();
  for (const placement of placements) {
    const ids = categoryIds.get(placement.topicId) ?? [];
    ids.push(placement.categoryId);
    categoryIds.set(placement.topicId, ids);
  }
  const topics = (database.prepare(`
    SELECT id, slug, name, description FROM topics
    WHERE status = 'published' AND EXISTS (
      SELECT 1 FROM topic_categories tc JOIN categories c ON c.id = tc.category_id
      WHERE tc.topic_id = topics.id AND c.status = 'published'
    ) ORDER BY name COLLATE NOCASE, id
  `).all() as unknown as Omit<Topic, 'categoryIds'>[])
    .map((topic) => ({ ...topic, categoryIds: categoryIds.get(topic.id) ?? [] }));

  return { categories, topics, instance: instance as unknown as LibraryResponse['instance'] };
}
