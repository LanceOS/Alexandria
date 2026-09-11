import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { transaction } from '../db/transaction.js';
import type { ContentBundle, ContentModule } from './content-definition.js';
import { validateContentCatalog } from './content-catalog.js';

type Row = Record<string, SQLInputValue>;
interface ExpectedRecord { table: string; key: Row; values: Row }
interface PendingModule { module: ContentModule; records: ExpectedRecord[] }

/** A failure in any selected topic rolls back the entire catalog import. */
export function installContentCatalog(database: DatabaseSync, bundles: ContentBundle[]) {
  if (bundles.length === 0) throw new Error('Select at least one topic to import.');
  validateContentCatalog(bundles);
  return transaction(database, () => {
    const content = bundles.map((bundle) => installContentBundle(database, bundle));
    return {
      created: content.some((result) => result.created),
      addedModules: content.reduce((total, result) => total + result.addedModules, 0),
      topics: content.length,
      units: content.reduce((total, result) => total + result.units, 0),
      modules: content.reduce((total, result) => total + result.modules, 0),
      parts: content.reduce((total, result) => total + result.parts, 0),
      content,
    };
  });
}

function findRecord(database: DatabaseSync, record: ExpectedRecord) {
  const predicate = Object.keys(record.key).map((key) => `${key} = ?`).join(' AND ');
  return database.prepare(`SELECT * FROM ${record.table} WHERE ${predicate}`).get(...Object.values(record.key));
}

function assertMatching(database: DatabaseSync, record: ExpectedRecord, label: string): void {
  const actual = findRecord(database, record);
  if (!actual || Object.entries(record.values).some(([key, value]) => actual[key] !== value)) {
    throw new Error(`${label} conflicts with existing ${record.table} records. No content was changed; review the existing curriculum before installing.`);
  }
}

function assertCount(database: DatabaseSync, table: string, key: string, id: string, expected: number, label: string): void {
  const actual = database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${key} = ?`).get(id)?.count;
  if (actual !== expected) {
    throw new Error(`${label} has unexpected ${table} associations. No content was changed.`);
  }
}

function insertRecord(database: DatabaseSync, record: ExpectedRecord, overrides: Row = {}): void {
  const values = { ...record.key, ...record.values, ...overrides };
  const columns = Object.keys(values);
  database.prepare(`INSERT INTO ${record.table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`)
    .run(...Object.values(values));
}

function moduleRecords(module: ContentModule, unitId: string): ExpectedRecord[] {
  return [
    { table: 'modules', key: { id: module.id }, values: { unit_id: unitId, title: module.title,
      slug: module.slug, summary: module.summary, position: module.position, is_required: 1, status: 'published' } },
    { table: 'module_versions', key: { id: module.versionId }, values: { module_id: module.id, version: 1,
      title: module.title, summary: module.summary, status: 'published', content_schema_version: 1,
      objectives_json: JSON.stringify(module.objectives), completion_policy_json: '{}', revision: 2 } },
    ...module.parts.flatMap((part, position): ExpectedRecord[] => [
      { table: 'lesson_parts', key: { id: part.id }, values: { module_id: module.id } },
      { table: 'lesson_part_versions', key: { lesson_part_id: part.id, module_version_id: module.versionId },
        values: { module_id: module.id, title: part.title, position, is_required: 1, content_json: JSON.stringify(part.blocks) } },
    ]),
    ...module.sources.flatMap((source, position): ExpectedRecord[] => [
      { table: 'source_references', key: { id: source.id }, values: { title: source.title,
        authors_json: JSON.stringify(source.authors), publisher: source.publisher ?? null,
        publication_year: source.publicationYear ?? null, edition: source.edition ?? null,
        isbn: source.isbn ?? null, doi: null, url: source.url } },
      { table: 'module_version_sources', key: { module_version_id: module.versionId, source_reference_id: source.id },
        values: { locator: source.locator, position } },
    ]),
  ];
}

function assertModuleInstalled(database: DatabaseSync, module: ContentModule, records: ExpectedRecord[]): void {
  const label = `Module "${module.title}"`;
  for (const record of records) assertMatching(database, record, label);
  for (const [table, count] of [
    ['lesson_part_versions', module.parts.length],
    ['module_version_sources', module.sources.length],
    ['exercise_versions', 0],
  ] as const) {
    assertCount(database, table, 'module_version_id', module.versionId, count, label);
  }
}

/** Install a validated bundle additively; published records are only compared, never rewritten. */
export function installContentBundle(database: DatabaseSync, bundle: ContentBundle) {
  return transaction(database, () => {
    const topic = bundle.topic;
    const topicLabel = `Topic "${topic.name}"`;
    for (const placement of topic.categories) {
      const category = database.prepare('SELECT status FROM categories WHERE id = ?').get(placement.id);
      if (!category || category.status !== 'published') {
        throw new Error(`A published category with ID "${placement.id}" is required before installing topic "${topic.name}". No content was changed.`);
      }
    }

    const pendingRecords: ExpectedRecord[] = [];
    const topicRecord: ExpectedRecord = {
      table: 'topics', key: { id: topic.id }, values: {
        slug: topic.slug, name: topic.name, description: topic.description, status: 'published', revision: 1,
      },
    };
    const placements: ExpectedRecord[] = topic.categories.map((category) => ({
      table: 'topic_categories', key: { topic_id: topic.id, category_id: category.id }, values: { position: category.position },
    }));
    if (findRecord(database, topicRecord)) {
      assertMatching(database, topicRecord, topicLabel);
      for (const placement of placements) assertMatching(database, placement, topicLabel);
      assertCount(database, 'topic_categories', 'topic_id', topic.id, placements.length, topicLabel);
    } else {
      if (database.prepare('SELECT id FROM topics WHERE slug = ?').get(topic.slug)) {
        throw new Error(`A different topic already uses the ${topic.slug} slug. No content was changed; review that topic before installing.`);
      }
      pendingRecords.push(topicRecord, ...placements);
    }

    const pendingModules: PendingModule[] = [];
    let moduleCount = 0;
    let partCount = 0;
    for (const unit of bundle.units) {
      const record: ExpectedRecord = {
        table: 'units', key: { id: unit.id }, values: {
          topic_id: topic.id, parent_unit_id: unit.parentUnitId, name: unit.name, slug: unit.slug,
          description: unit.description, position: unit.position, status: 'published',
        },
      };
      if (findRecord(database, record)) {
        assertMatching(database, record, `Unit "${unit.name}"`);
      } else {
        if (database.prepare('SELECT id FROM units WHERE topic_id = ? AND slug = ?').get(topic.id, unit.slug)) {
          throw new Error(`A different unit already uses the ${unit.slug} slug in topic "${topic.name}". No content was changed.`);
        }
        pendingRecords.push(record);
      }

      for (const module of unit.modules) {
        moduleCount += 1;
        partCount += module.parts.length;
        const records = moduleRecords(module, unit.id);
        // A reserved child or citation ID alone is a partial installation, not permission to adopt it.
        if (records.some((record) => findRecord(database, record) !== undefined)) {
          assertModuleInstalled(database, module, records);
        } else {
          if (database.prepare('SELECT id FROM modules WHERE unit_id = ? AND slug = ?').get(unit.id, module.slug)) {
            throw new Error(`A different module already uses the ${module.slug} slug in unit "${unit.name}". No content was changed.`);
          }
          pendingModules.push({ module, records });
        }
      }
    }

    // The complete bundle has been checked before making any writes. The loader supplies units
    // parent-first, so their foreign keys are satisfied without changing existing hierarchy rows.
    for (const record of pendingRecords) insertRecord(database, record);
    for (const { module, records } of pendingModules) {
      for (const record of records) {
        const overrides: Row = record.table === 'modules' ? { status: 'draft' }
          : record.table === 'module_versions' ? { status: 'draft', revision: 1 } : {};
        insertRecord(database, record, overrides);
      }
      database.prepare(`UPDATE module_versions SET status = 'published', revision = revision + 1,
        published_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
        .run(module.versionId);
      database.prepare("UPDATE modules SET status = 'published', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
        .run(module.id);
      assertModuleInstalled(database, module, records);
    }

    return {
      created: pendingRecords.length > 0 || pendingModules.length > 0,
      addedModules: pendingModules.length,
      topicId: topic.id,
      topics: 1 as const,
      units: bundle.units.length,
      modules: moduleCount,
      parts: partCount,
    };
  });
}
