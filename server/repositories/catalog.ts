import type { DatabaseSync } from 'node:sqlite';
import type { CatalogCategory, CatalogListOptions, CatalogStatus, CatalogTopic, CategoryPlacement } from '../../shared/catalog.js';

type CategoryValues = Pick<CatalogCategory, 'slug' | 'name' | 'description' | 'position' | 'status'>;
type TopicValues = Pick<CatalogTopic, 'slug' | 'name' | 'description' | 'status'>;
type TopicRow = Omit<CatalogTopic, 'categoryPlacements'>;
type PageOptions = Required<Pick<CatalogListOptions, 'limit' | 'offset'>> & Pick<CatalogListOptions, 'status'>;

const categoryColumns = 'id, slug, name, description, position, status, revision, created_at AS createdAt, updated_at AS updatedAt';
const topicColumns = 'id, slug, name, description, status, revision, created_at AS createdAt, updated_at AS updatedAt';

export function createCatalogRepository(database: DatabaseSync) {
  function placementsForTopic(id: string): CategoryPlacement[] {
    const rows = database.prepare(`
      SELECT tc.category_id AS categoryId, tc.position
      FROM topic_categories tc JOIN categories c ON c.id = tc.category_id
      WHERE tc.topic_id = ? ORDER BY c.position, c.id
    `).all(id) as unknown as CategoryPlacement[];
    return rows.map((row) => ({ ...row }));
  }

  function findCategory(id: string): CatalogCategory | undefined {
    const row = database.prepare(`SELECT ${categoryColumns} FROM categories WHERE id = ?`).get(id) as unknown as CatalogCategory | undefined;
    return row ? { ...row } : undefined;
  }

  function findTopic(id: string): CatalogTopic | undefined {
    const row = database.prepare(`SELECT ${topicColumns} FROM topics WHERE id = ?`).get(id) as unknown as TopicRow | undefined;
    return row ? { ...row, categoryPlacements: placementsForTopic(id) } : undefined;
  }

  return {
    findCategory,
    findTopic,
    categoryWithSlug(slug: string): { id: string } | undefined {
      return database.prepare('SELECT id FROM categories WHERE slug = ?').get(slug) as { id: string } | undefined;
    },
    topicWithSlug(slug: string): { id: string } | undefined {
      return database.prepare('SELECT id FROM topics WHERE slug = ?').get(slug) as { id: string } | undefined;
    },
    listCategories(options: PageOptions) {
      const where = options.status ? 'WHERE status = ?' : '';
      const args = options.status ? [options.status] : [];
      const total = database.prepare(`SELECT COUNT(*) AS count FROM categories ${where}`).get(...args) as { count: number };
      const items = database.prepare(`SELECT ${categoryColumns} FROM categories ${where} ORDER BY position, id LIMIT ? OFFSET ?`)
        .all(...args, options.limit, options.offset) as unknown as CatalogCategory[];
      return { items: items.map((row) => ({ ...row })), total: total.count };
    },
    listTopics(options: PageOptions) {
      const where = options.status ? 'WHERE status = ?' : '';
      const args = options.status ? [options.status] : [];
      const total = database.prepare(`SELECT COUNT(*) AS count FROM topics ${where}`).get(...args) as { count: number };
      const rows = database.prepare(`SELECT ${topicColumns} FROM topics ${where} ORDER BY name COLLATE NOCASE, id LIMIT ? OFFSET ?`)
        .all(...args, options.limit, options.offset) as unknown as TopicRow[];
      const placements = new Map<string, CategoryPlacement[]>();
      if (rows.length) {
        const ids = rows.map((row) => row.id);
        const memberships = database.prepare(`
          SELECT tc.topic_id AS topicId, tc.category_id AS categoryId, tc.position
          FROM topic_categories tc JOIN categories c ON c.id = tc.category_id
          WHERE tc.topic_id IN (${ids.map(() => '?').join(',')}) ORDER BY c.position, c.id
        `).all(...ids) as unknown as Array<CategoryPlacement & { topicId: string }>;
        for (const membership of memberships) {
          const list = placements.get(membership.topicId) ?? [];
          list.push({ categoryId: membership.categoryId, position: membership.position });
          placements.set(membership.topicId, list);
        }
      }
      return { items: rows.map((row) => ({ ...row, categoryPlacements: placements.get(row.id) ?? [] })), total: total.count };
    },
    insertCategory(id: string, values: CategoryValues): void {
      database.prepare('INSERT INTO categories (id, slug, name, description, position, status) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, values.slug, values.name, values.description, values.position, values.status);
    },
    updateCategory(id: string, revision: number, values: CategoryValues): boolean {
      return database.prepare(`
        UPDATE categories SET slug = ?, name = ?, description = ?, position = ?, status = ?,
          revision = revision + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND revision = ?
      `).run(values.slug, values.name, values.description, values.position, values.status, id, revision).changes === 1;
    },
    insertTopic(id: string, values: TopicValues): void {
      database.prepare('INSERT INTO topics (id, slug, name, description, status) VALUES (?, ?, ?, ?, ?)')
        .run(id, values.slug, values.name, values.description, values.status);
    },
    updateTopic(id: string, revision: number, values: TopicValues): boolean {
      return database.prepare(`
        UPDATE topics SET slug = ?, name = ?, description = ?, status = ?, revision = revision + 1,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND revision = ?
      `).run(values.slug, values.name, values.description, values.status, id, revision).changes === 1;
    },
    replaceTopicPlacements(topicId: string, placements: readonly CategoryPlacement[]): void {
      database.prepare('DELETE FROM topic_categories WHERE topic_id = ?').run(topicId);
      const insert = database.prepare('INSERT INTO topic_categories (topic_id, category_id, position) VALUES (?, ?, ?)');
      for (const placement of placements) insert.run(topicId, placement.categoryId, placement.position);
    },
    categoryStatuses(ids: readonly string[]): Array<{ id: string; status: CatalogStatus }> {
      if (!ids.length) return [];
      return database.prepare(`SELECT id, status FROM categories WHERE id IN (${ids.map(() => '?').join(',')})`)
        .all(...ids) as unknown as Array<{ id: string; status: CatalogStatus }>;
    },
    wouldStrandPublishedTopic(categoryId: string): boolean {
      return !!database.prepare(`
        SELECT 1 FROM topics t JOIN topic_categories own ON own.topic_id = t.id
        WHERE own.category_id = ? AND t.status = 'published' AND NOT EXISTS (
          SELECT 1 FROM topic_categories other JOIN categories c ON c.id = other.category_id
          WHERE other.topic_id = t.id AND other.category_id != ? AND c.status = 'published'
        ) LIMIT 1
      `).get(categoryId, categoryId);
    },
  };
}
