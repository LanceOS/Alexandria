export interface CurriculumTopic {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface ModuleSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  unitId: string;
  versionId: string;
  sectionCount: number;
}

export interface CurriculumUnit {
  id: string;
  parentUnitId: string | null;
  name: string;
  slug: string;
  description: string;
  position: number;
  modules: ModuleSummary[];
}

export interface TopicOutline {
  topic: CurriculumTopic;
  units: CurriculumUnit[];
  extraReading: ExtraReadingReference[];
}

export interface SourceReference {
  id: string;
  title: string;
  authors: string[];
  edition: string | null;
  publicationYear: number | null;
  url: string | null;
}

export interface ModuleSource extends SourceReference {
  locator: string;
}

export interface ExtraReadingReference extends SourceReference {
  citations: Array<{ moduleId: string; locator: string }>;
}

// Plain text blocks are rendered as text by the client, never as stored HTML.
export type LessonBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'code'; language: 'cpp' | 'text' | 'shell'; code: string; caption?: string }
  | { type: 'callout'; title: string; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'reflection'; prompt: string; explanation: string };

export interface ModuleDetail {
  module: ModuleSummary;
  topic: CurriculumTopic;
  units: Array<{ id: string; name: string; slug: string }>;
  version: { id: string; number: number; objectives: string[] };
  parts: Array<{ id: string; title: string; position: number; blocks: LessonBlock[] }>;
  sources: ModuleSource[];
}
