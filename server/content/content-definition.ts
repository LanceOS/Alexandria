import type { LessonBlock } from '../../shared/curriculum.js';

export interface ContentModule {
  $schema?: string;
  id: string;
  versionId: string;
  /** Published release number. Omitted for the original release (version 1). */
  version?: number;
  slug: string;
  title: string;
  summary: string;
  position: number;
  objectives: string[];
  parts: Array<{ id: string; title: string; blocks: LessonBlock[] }>;
  sources: Array<{
    id: string;
    title: string;
    authors: string[];
    publisher?: string;
    publicationYear?: number;
    edition?: string;
    isbn?: string;
    url: string;
    locator: string;
  }>;
}

export interface ContentUnit {
  id: string;
  name: string;
  slug: string;
  description: string;
  position: number;
  parentUnitId: string | null;
  modules: ContentModule[];
}

export interface ContentTopic {
  id: string;
  name: string;
  slug: string;
  description: string;
  categories: Array<{ id: string; position: number }>;
}

export interface ContentBundle {
  topic: ContentTopic;
  /** Parent-before-child, with siblings and modules ordered by position. */
  units: ContentUnit[];
}
