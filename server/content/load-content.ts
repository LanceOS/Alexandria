import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, readdirSync, readSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv, type AnySchema, type ValidateFunction } from 'ajv';
import type { ContentBundle, ContentModule, ContentTopic, ContentUnit } from './content-definition.js';

export const defaultContentDirectory = fileURLToPath(new URL('../../content/units/', import.meta.url));

interface UnitFile {
  $schema?: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  position: number;
  topic?: ContentTopic;
}

interface UnitTree {
  file: string;
  unit: ContentUnit;
  children: UnitTree[];
}

const limits = { fileBytes: 2 * 1024 * 1024, totalBytes: 32 * 1024 * 1024, files: 1000, entries: 2000, units: 250, depth: 16 };
const ajv = new Ajv({ strict: true, allErrors: true, coerceTypes: false, removeAdditional: false, useDefaults: false, ownProperties: true });
const validateModule = ajv.compile<ContentModule>(readSchema('module'));
const validateUnit = ajv.compile<UnitFile>(readSchema('unit'));

function readSchema(name: 'module' | 'unit'): AnySchema {
  return JSON.parse(readFileSync(new URL(`../../content/schemas/${name}.schema.json`, import.meta.url), 'utf8')) as AnySchema;
}

function fail(file: string, message: string): never {
  throw new Error(`${file}: ${message}`);
}

function validated<T>(file: string, data: unknown, validate: ValidateFunction<T>): T {
  if (!validate(data)) {
    const details = validate.errors?.slice(0, 3).map((error) => {
      const property = error.keyword === 'additionalProperties' ? ` (${String(error.params.additionalProperty)})` : '';
      return `${error.instancePath || '/'} ${error.message ?? 'is invalid'}${property}`;
    }).join('; ');
    return fail(file, `invalid content: ${details ?? 'schema validation failed'}`);
  }
  return data;
}

function requireLength(file: string, path: string, value: string, maximum: number): void {
  // JSON Schema measures Unicode code points; the public reader uses JS string
  // length. Check both so supplementary characters cannot exceed reader limits.
  if (value.length > maximum) fail(file, `${path} exceeds the reader limit of ${maximum} UTF-16 code units`);
}

function checkReaderLimits(file: string, module: ContentModule): void {
  module.objectives.forEach((objective, index) => requireLength(file, `/objectives/${index}`, objective, 1000));
  for (const [partIndex, part] of module.parts.entries()) {
    const prefix = `/parts/${partIndex}/blocks`;
    if (JSON.stringify(part.blocks).length > 200_000) fail(file, `${prefix} exceeds the reader's 200000-character JSON limit`);
    for (const [index, block] of part.blocks.entries()) {
      const path = `${prefix}/${index}`;
      switch (block.type) {
        case 'paragraph': requireLength(file, `${path}/text`, block.text, 30_000); break;
        case 'code':
          requireLength(file, `${path}/code`, block.code, 40_000);
          if (block.caption !== undefined) requireLength(file, `${path}/caption`, block.caption, 1000);
          break;
        case 'callout':
          requireLength(file, `${path}/title`, block.title, 500);
          requireLength(file, `${path}/text`, block.text, 30_000);
          break;
        case 'list': block.items.forEach((item, itemIndex) => requireLength(file, `${path}/items/${itemIndex}`, item, 5000)); break;
        case 'reflection':
          requireLength(file, `${path}/prompt`, block.prompt, 5000);
          requireLength(file, `${path}/explanation`, block.explanation, 30_000);
          break;
      }
    }
  }
  for (const [index, source] of module.sources.entries()) {
    source.authors.forEach((author, authorIndex) => requireLength(file, `/sources/${index}/authors/${authorIndex}`, author, 300));
    requireLength(file, `/sources/${index}/url`, source.url, 2000);
    let url: URL;
    try { url = new URL(source.url); } catch { return fail(file, `/sources/${index}/url must be an absolute HTTP(S) URL`); }
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password
      || /[\s\\\u0000-\u001f\u007f]/.test(source.url)) {
      fail(file, `/sources/${index}/url must be an HTTP(S) URL without credentials, whitespace, or backslashes`);
    }
  }
}

/** Load one topic directory, such as join(defaultContentDirectory, 'cpp'). */
export function loadContentBundle(rootDirectory: string): ContentBundle {
  const root = resolve(rootDirectory);
  const ids = new Map<string, string>();
  const unitSlugs = new Map<string, string>();
  let topic: ContentTopic | undefined;
  let fileCount = 0;
  let entryCount = 0;
  let totalBytes = 0;
  let unitCount = 0;

  function unique(seen: Map<string, string>, value: string, file: string, kind: string): void {
    const previous = seen.get(value);
    if (previous !== undefined) fail(file, `duplicate ${kind} "${value}" (already defined in ${previous})`);
    seen.set(value, file);
  }

  function readJson(file: string): unknown {
    if (++fileCount > limits.files) fail(file, `content tree exceeds ${limits.files} JSON files`);
    let descriptor: number;
    try { descriptor = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK); } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      return fail(file, code === 'ELOOP' ? 'symbolic links are not allowed' : `cannot open content file (${code ?? 'I/O error'})`);
    }
    let bytes: Buffer;
    try {
      const stat = fstatSync(descriptor);
      if (!stat.isFile()) return fail(file, 'content must be a regular file');
      if (stat.size > limits.fileBytes) return fail(file, `content file exceeds ${limits.fileBytes} bytes`);
      // Bound the read even if the file changes after its size was checked.
      const buffer = Buffer.alloc(limits.fileBytes + 1);
      let length = 0;
      while (length < buffer.length) {
        const read = readSync(descriptor, buffer, length, buffer.length - length, null);
        if (read === 0) break;
        length += read;
      }
      if (length > limits.fileBytes) return fail(file, `content file exceeds ${limits.fileBytes} bytes`);
      totalBytes += length;
      if (totalBytes > limits.totalBytes) return fail(file, `content tree exceeds ${limits.totalBytes} bytes of JSON`);
      bytes = buffer.subarray(0, length);
    } finally { closeSync(descriptor); }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown; } catch {
      return fail(file, 'content must contain valid UTF-8 JSON');
    }
  }

  function walk(directory: string, parentUnitId: string | null, depth: number): UnitTree {
    if (depth > limits.depth) fail(directory, `unit nesting exceeds ${limits.depth} levels`);
    if (++unitCount > limits.units) fail(directory, `content tree exceeds ${limits.units} units`);
    try {
      const stat = lstatSync(directory);
      if (stat.isSymbolicLink()) return fail(directory, 'symbolic links are not allowed');
      if (!stat.isDirectory()) return fail(directory, 'a unit must be a directory containing unit.json');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code) return fail(directory, `cannot read unit directory (${(error as NodeJS.ErrnoException).code})`);
      throw error;
    }
    const file = join(directory, 'unit.json');
    const metadata = validated(file, readJson(file), validateUnit);
    if (metadata.slug !== basename(directory)) fail(file, `unit slug must match its directory name "${basename(directory)}"`);
    if (parentUnitId === null) {
      if (!metadata.topic) return fail(file, 'the root unit must define topic metadata');
      topic = metadata.topic;
      unique(ids, topic.id, file, 'ID');
      const categoryIds = new Map<string, string>();
      for (const category of topic.categories) unique(categoryIds, category.id, file, 'category ID');
    } else if (metadata.topic !== undefined) return fail(file, 'only the root unit may define topic metadata');
    unique(ids, metadata.id, file, 'ID');
    unique(unitSlugs, metadata.slug, file, 'unit slug');
    const unit: ContentUnit = { id: metadata.id, name: metadata.name, slug: metadata.slug, description: metadata.description,
      position: metadata.position, parentUnitId, modules: [] };
    const children: UnitTree[] = [];
    const moduleSlugs = new Map<string, string>();
    const modulePositions = new Map<string, string>();
    const childPositions = new Map<string, string>();
    let entries: string[];
    try { entries = readdirSync(directory).sort(); } catch (error) {
      return fail(directory, `cannot list unit directory (${(error as NodeJS.ErrnoException).code ?? 'I/O error'})`);
    }
    entryCount += entries.length;
    if (entryCount > limits.entries) fail(directory, `content tree exceeds ${limits.entries} directory entries`);
    for (const entry of entries) {
      const path = join(directory, entry);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) fail(path, 'symbolic links are not allowed');
      if (stat.isDirectory()) {
        const child = walk(path, unit.id, depth + 1);
        unique(childPositions, String(child.unit.position), child.file, 'sibling unit position');
        children.push(child);
      } else if (!stat.isFile()) {
        fail(path, 'only regular files and unit directories are allowed');
      } else if (entry !== 'unit.json' && entry.endsWith('.json')) {
        const module = validated(path, readJson(path), validateModule);
        unique(ids, module.id, path, 'ID');
        unique(ids, module.versionId, path, 'ID');
        unique(moduleSlugs, module.slug, path, 'module slug');
        unique(modulePositions, String(module.position), path, 'module position');
        for (const part of module.parts) unique(ids, part.id, path, 'ID');
        for (const source of module.sources) unique(ids, source.id, path, 'ID');
        checkReaderLimits(path, module);
        // Preserve authored object key order and all lesson arrays. Published
        // content is compared by its exact JSON representation by the installer.
        unit.modules.push(module);
      }
    }
    unit.modules.sort((left, right) => left.position - right.position);
    children.sort((left, right) => left.unit.position - right.unit.position);
    return { file, unit, children };
  }

  const tree = walk(root, null, 1);
  const units: ContentUnit[] = [];
  function flatten(node: UnitTree): void {
    units.push(node.unit);
    for (const child of node.children) flatten(child);
  }
  flatten(tree);
  if (!topic) return fail(root, 'the root unit must define topic metadata');
  return { topic, units };
}
