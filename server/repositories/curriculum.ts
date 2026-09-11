import type { DatabaseSync } from 'node:sqlite';
import type { CurriculumTopic, CurriculumUnit, ExtraReadingReference, LessonBlock, ModuleDetail, ModuleSource, ModuleSummary, TopicOutline } from '../../shared/curriculum.js';
import { AppError } from '../http/errors.js';

interface UnitRow {
  id: string;
  parentUnitId: string | null;
  name: string;
  slug: string;
  description: string;
  position: number;
}
interface VersionRow extends ModuleSummary {
  version: number;
  schemaVersion: number;
  objectivesJson: string;
}
interface PartRow { id: string; title: string; position: number; contentJson: string }
interface SourceRow {
  id: string;
  title: string;
  authorsJson: string;
  edition: string | null;
  publicationYear: number | null;
  locator: string;
  url: string | null;
}

const visibleTopic = `
  t.status = 'published' AND EXISTS (
    SELECT 1 FROM topic_categories tc JOIN categories c ON c.id = tc.category_id
    WHERE tc.topic_id = t.id AND c.status = 'published'
  )`;

// Starting at published roots ensures that a published descendant never leaks
// through an unpublished ancestor. The schema rejects hierarchy cycles.
const visibleUnits = `WITH RECURSIVE visible_units AS (
  SELECT id, parent_unit_id, name, slug, description, position FROM units
  WHERE topic_id = ? AND parent_unit_id IS NULL AND status = 'published'
  UNION ALL
  SELECT u.id, u.parent_unit_id, u.name, u.slug, u.description, u.position
  FROM units u JOIN visible_units parent ON parent.id = u.parent_unit_id
  WHERE u.status = 'published'
)`;

const versionColumns = `
  m.id, m.slug, v.title, v.summary, m.unit_id AS unitId, v.id AS versionId,
  (SELECT count(*) FROM lesson_part_versions p WHERE p.module_version_id = v.id) AS sectionCount,
  v.version, v.content_schema_version AS schemaVersion, v.objectives_json AS objectivesJson`;
const latestPublishedVersion = `v.module_id = m.id AND v.status = 'published' AND v.version = (
  SELECT max(latest.version) FROM module_versions latest WHERE latest.module_id = m.id AND latest.status = 'published'
)`;

function missing(): never {
  throw new AppError(404, 'NOT_FOUND', 'This resource does not exist.');
}

function invalidContent(): never {
  throw new AppError(500, 'CONTENT_UNAVAILABLE', 'This lesson cannot be displayed right now.');
}

function parseJson(value: string): unknown {
  if (value.length > 200_000) return invalidContent();
  try { return JSON.parse(value) as unknown; } catch { return invalidContent(); }
}

function text(value: unknown, max = 30_000): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) return invalidContent();
  return value;
}

function strings(value: unknown, maxItems: number, maxLength: number, allowEmpty = true): string[] {
  if (!Array.isArray(value) || value.length > maxItems || (!allowEmpty && value.length === 0)) return invalidContent();
  return value.map((item: unknown) => text(item, maxLength));
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return invalidContent();
  return value as Record<string, unknown>;
}

function fields(value: Record<string, unknown>, allowed: string[]): void {
  if (Object.keys(value).some((key) => !allowed.includes(key))) invalidContent();
}

function lessonBlocks(value: string): LessonBlock[] {
  const blocks = parseJson(value);
  if (!Array.isArray(blocks) || blocks.length === 0 || blocks.length > 100) return invalidContent();
  return blocks.map((item: unknown): LessonBlock => {
    const block = record(item);
    switch (block.type) {
      case 'paragraph':
        fields(block, ['type', 'text']);
        return { type: 'paragraph', text: text(block.text) };
      case 'code': {
        fields(block, ['type', 'language', 'code', 'caption']);
        if (block.language !== 'cpp' && block.language !== 'text' && block.language !== 'shell') return invalidContent();
        return { type: 'code', language: block.language, code: text(block.code, 40_000),
          ...(block.caption === undefined ? {} : { caption: text(block.caption, 1_000) }) };
      }
      case 'callout':
        fields(block, ['type', 'title', 'text']);
        return { type: 'callout', title: text(block.title, 500), text: text(block.text) };
      case 'list':
        fields(block, ['type', 'items']);
        return { type: 'list', items: strings(block.items, 50, 5_000, false) };
      case 'reflection':
        fields(block, ['type', 'prompt', 'explanation']);
        return { type: 'reflection', prompt: text(block.prompt, 5_000), explanation: text(block.explanation) };
      default: return invalidContent();
    }
  });
}

function sourceUrl(value: string | null): string | null {
  if (value === null) return null;
  if (value.length > 2_000) return invalidContent();
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return invalidContent();
    return url.href;
  } catch { return invalidContent(); }
}

function summary(row: VersionRow): ModuleSummary {
  return { id: row.id, slug: row.slug, title: row.title, summary: row.summary, unitId: row.unitId,
    versionId: row.versionId, sectionCount: row.sectionCount };
}

function readVisibleUnits(database: DatabaseSync, topicId: string): UnitRow[] {
  return database.prepare(`${visibleUnits}
    SELECT id, parent_unit_id AS parentUnitId, name, slug, description, position
    FROM visible_units ORDER BY position, id`).all(topicId) as unknown as UnitRow[];
}

function moduleSource(source: SourceRow): ModuleSource {
  return { id: source.id, title: source.title,
    authors: strings(parseJson(source.authorsJson), 30, 300), edition: source.edition,
    publicationYear: source.publicationYear, locator: source.locator, url: sourceUrl(source.url) };
}

function readExtraReading(database: DatabaseSync, topicId: string): ExtraReadingReference[] {
  const rows = database.prepare(`${visibleUnits}
    SELECT s.id, s.title, s.authors_json AS authorsJson, s.edition,
      s.publication_year AS publicationYear, link.locator, s.url, m.id AS moduleId
    FROM modules m JOIN visible_units u ON u.id = m.unit_id
    JOIN module_versions v ON ${latestPublishedVersion}
    JOIN module_version_sources link ON link.module_version_id = v.id
    JOIN source_references s ON s.id = link.source_reference_id
    WHERE m.status = 'published' ORDER BY m.position, m.id, link.position, s.id`)
    .all(topicId) as unknown as Array<SourceRow & { moduleId: string }>;
  const references = new Map<string, ExtraReadingReference>();
  for (const row of rows) {
    const { locator, ...source } = moduleSource(row);
    // Module-specific titles can describe different parts of the same resource.
    // Keep different editions/authorship distinct, and retain every reading locator.
    const key = JSON.stringify([source.url ?? source.title, source.authors, source.edition, source.publicationYear]);
    let reference = references.get(key);
    if (!reference) {
      reference = { ...source, citations: [] };
      references.set(key, reference);
    }
    if (!reference.citations.some((citation) => citation.moduleId === row.moduleId && citation.locator === locator)) {
      reference.citations.push({ moduleId: row.moduleId, locator });
    }
  }
  return [...references.values()];
}

export function readTopicOutline(database: DatabaseSync, slug: string): TopicOutline {
  const topic = database.prepare(`SELECT t.id, t.slug, t.name, t.description FROM topics t
    WHERE t.slug = ? AND ${visibleTopic}`).get(slug) as unknown as CurriculumTopic | undefined;
  if (!topic) return missing();
  const units: CurriculumUnit[] = readVisibleUnits(database, topic.id).map((unit) => ({ ...unit, modules: [] }));
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const modules = database.prepare(`${visibleUnits}
    SELECT ${versionColumns} FROM modules m
    JOIN visible_units u ON u.id = m.unit_id JOIN module_versions v ON ${latestPublishedVersion}
    WHERE m.status = 'published' ORDER BY m.position, m.id`).all(topic.id) as unknown as VersionRow[];
  for (const module of modules) byId.get(module.unitId)?.modules.push(summary(module));
  return { topic, units, extraReading: readExtraReading(database, topic.id) };
}

export function readModuleDetail(database: DatabaseSync, id: string): ModuleDetail {
  const topic = database.prepare(`SELECT t.id, t.slug, t.name, t.description FROM topics t
    JOIN units u ON u.topic_id = t.id JOIN modules m ON m.unit_id = u.id
    WHERE m.id = ? AND m.status = 'published' AND ${visibleTopic}`).get(id) as unknown as CurriculumTopic | undefined;
  if (!topic) return missing();
  const units = readVisibleUnits(database, topic.id);
  const row = database.prepare(`${visibleUnits}
    SELECT ${versionColumns} FROM modules m JOIN visible_units u ON u.id = m.unit_id
    JOIN module_versions v ON ${latestPublishedVersion} WHERE m.id = ? AND m.status = 'published'`)
    .get(topic.id, id) as unknown as VersionRow | undefined;
  if (!row) return missing();
  if (row.schemaVersion !== 1) return invalidContent();
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const ancestors: ModuleDetail['units'] = [];
  let ancestor = byId.get(row.unitId);
  while (ancestor) {
    ancestors.unshift({ id: ancestor.id, name: ancestor.name, slug: ancestor.slug });
    ancestor = ancestor.parentUnitId === null ? undefined : byId.get(ancestor.parentUnitId);
  }
  const parts = database.prepare(`SELECT lesson_part_id AS id, title, position, content_json AS contentJson
    FROM lesson_part_versions WHERE module_version_id = ? ORDER BY position, lesson_part_id`)
    .all(row.versionId) as unknown as PartRow[];
  if (parts.length === 0 || parts.length > 200) return invalidContent();
  const sources = database.prepare(`SELECT s.id, s.title, s.authors_json AS authorsJson, s.edition,
    s.publication_year AS publicationYear, link.locator, s.url
    FROM module_version_sources link JOIN source_references s ON s.id = link.source_reference_id
    WHERE link.module_version_id = ? ORDER BY link.position, s.id`).all(row.versionId) as unknown as SourceRow[];
  if (sources.length > 100) return invalidContent();
  return {
    module: summary(row), topic, units: ancestors,
    version: { id: row.versionId, number: row.version, objectives: strings(parseJson(row.objectivesJson), 20, 1_000) },
    parts: parts.map((part) => ({ id: part.id, title: part.title, position: part.position, blocks: lessonBlocks(part.contentJson) })),
    sources: sources.map(moduleSource),
  };
}
