// Released migration SQL is immutable. Content schemas start empty; authoring is a later feature.
const versionChildren = ['lesson_part_versions', 'exercise_versions', 'module_version_sources']
  .map((table) => `
    CREATE TRIGGER ${table}_published_insert BEFORE INSERT ON ${table}
    WHEN EXISTS (SELECT 1 FROM module_versions WHERE id = NEW.module_version_id AND status = 'published')
    BEGIN SELECT RAISE(ABORT, 'published content is immutable'); END;
    CREATE TRIGGER ${table}_published_update BEFORE UPDATE ON ${table}
    WHEN EXISTS (SELECT 1 FROM module_versions WHERE id IN (OLD.module_version_id, NEW.module_version_id) AND status = 'published')
    BEGIN SELECT RAISE(ABORT, 'published content is immutable'); END;
    CREATE TRIGGER ${table}_published_delete BEFORE DELETE ON ${table}
    WHEN EXISTS (SELECT 1 FROM module_versions WHERE id = OLD.module_version_id AND status = 'published')
    BEGIN SELECT RAISE(ABORT, 'published content is immutable'); END;
  `).join('\n');

export const curriculumSql = `
  CREATE TABLE units (
    id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
    parent_unit_id TEXT,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
    description TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) CHECK (julianday(created_at) IS NOT NULL),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) CHECK (julianday(updated_at) IS NOT NULL AND julianday(updated_at) >= julianday(created_at)),
    UNIQUE (id, topic_id),
    UNIQUE (topic_id, slug),
    CHECK (parent_unit_id IS NULL OR parent_unit_id <> id),
    FOREIGN KEY (parent_unit_id, topic_id) REFERENCES units(id, topic_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE INDEX units_outline ON units(topic_id, parent_unit_id, position, id);
  CREATE INDEX units_parent ON units(parent_unit_id);

  CREATE TRIGGER units_no_cycle_insert BEFORE INSERT ON units
  WHEN NEW.parent_unit_id IS NOT NULL
  BEGIN
    SELECT RAISE(ABORT, 'unit hierarchy cannot contain a cycle') WHERE EXISTS (
      WITH RECURSIVE ancestors(id, parent_unit_id) AS (
        SELECT id, parent_unit_id FROM units WHERE id = NEW.parent_unit_id
        UNION
        SELECT units.id, units.parent_unit_id FROM units JOIN ancestors ON units.id = ancestors.parent_unit_id
      ) SELECT 1 FROM ancestors WHERE id = NEW.id OR parent_unit_id = NEW.id
    );
  END;
  CREATE TRIGGER units_no_cycle_update BEFORE UPDATE OF parent_unit_id ON units
  WHEN NEW.parent_unit_id IS NOT NULL
  BEGIN
    SELECT RAISE(ABORT, 'unit hierarchy cannot contain a cycle') WHERE EXISTS (
      WITH RECURSIVE ancestors(id, parent_unit_id) AS (
        SELECT id, parent_unit_id FROM units WHERE id = NEW.parent_unit_id
        UNION
        SELECT units.id, units.parent_unit_id FROM units JOIN ancestors ON units.id = ancestors.parent_unit_id
      ) SELECT 1 FROM ancestors WHERE id = NEW.id OR parent_unit_id = NEW.id
    );
  END;
  CREATE TRIGGER units_stable_ownership BEFORE UPDATE OF id, topic_id ON units
  WHEN NEW.id <> OLD.id OR NEW.topic_id <> OLD.topic_id
  BEGIN SELECT RAISE(ABORT, 'unit identity and topic are immutable'); END;

  CREATE TABLE modules (
    id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
    unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    slug TEXT NOT NULL CHECK (length(trim(slug)) > 0),
    summary TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    is_required INTEGER NOT NULL DEFAULT 1 CHECK (is_required IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) CHECK (julianday(created_at) IS NOT NULL),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) CHECK (julianday(updated_at) IS NOT NULL AND julianday(updated_at) >= julianday(created_at)),
    UNIQUE (unit_id, slug)
  ) STRICT;
  CREATE INDEX modules_outline ON modules(unit_id, position, id);

  CREATE TABLE module_versions (
    id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE RESTRICT,
    version INTEGER NOT NULL CHECK (version > 0),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    summary TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    content_schema_version INTEGER NOT NULL DEFAULT 1 CHECK (content_schema_version > 0),
    objectives_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(objectives_json) AND json_type(objectives_json) = 'array'),
    completion_policy_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(completion_policy_json) AND json_type(completion_policy_json) = 'object'),
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision BETWEEN 1 AND 9007199254740991),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) CHECK (julianday(created_at) IS NOT NULL),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) CHECK (julianday(updated_at) IS NOT NULL AND julianday(updated_at) >= julianday(created_at)),
    published_at TEXT CHECK (published_at IS NULL OR julianday(published_at) IS NOT NULL),
    UNIQUE (module_id, version),
    UNIQUE (id, module_id),
    CHECK ((status = 'draft' AND published_at IS NULL) OR
      (status = 'published' AND published_at IS NOT NULL AND julianday(published_at) >= julianday(created_at)))
  ) STRICT;

  CREATE TABLE lesson_parts (
    id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE RESTRICT,
    UNIQUE (id, module_id)
  ) STRICT;
  CREATE TABLE lesson_part_versions (
    lesson_part_id TEXT NOT NULL,
    module_version_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    is_required INTEGER NOT NULL DEFAULT 1 CHECK (is_required IN (0, 1)),
    content_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(content_json) AND json_type(content_json) = 'array'),
    PRIMARY KEY (lesson_part_id, module_version_id),
    UNIQUE (lesson_part_id, module_version_id, module_id),
    FOREIGN KEY (lesson_part_id, module_id) REFERENCES lesson_parts(id, module_id) ON DELETE RESTRICT,
    FOREIGN KEY (module_version_id, module_id) REFERENCES module_versions(id, module_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE INDEX lesson_part_versions_order ON lesson_part_versions(module_version_id, position, lesson_part_id);

  CREATE TABLE exercises (
    id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE RESTRICT,
    UNIQUE (id, module_id)
  ) STRICT;
  CREATE TABLE exercise_versions (
    id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
    exercise_id TEXT NOT NULL,
    module_version_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    lesson_part_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('choice', 'structured', 'text', 'numeric', 'code')),
    prompt_json TEXT NOT NULL CHECK (json_valid(prompt_json) AND json_type(prompt_json) = 'object'),
    response_schema_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(response_schema_json) AND json_type(response_schema_json) = 'object'),
    grading_method TEXT NOT NULL CHECK (grading_method IN ('automatic', 'manual', 'self_review')),
    position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    is_required INTEGER NOT NULL DEFAULT 1 CHECK (is_required IN (0, 1)),
    UNIQUE (exercise_id, module_version_id),
    UNIQUE (id, module_version_id, module_id),
    FOREIGN KEY (exercise_id, module_id) REFERENCES exercises(id, module_id) ON DELETE RESTRICT,
    FOREIGN KEY (lesson_part_id, module_version_id, module_id)
      REFERENCES lesson_part_versions(lesson_part_id, module_version_id, module_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE INDEX exercise_versions_order ON exercise_versions(module_version_id, lesson_part_id, position, id);

  -- Protected answer keys are deliberately separate from public exercise content.
  CREATE TABLE exercise_grading_specs (
    exercise_version_id TEXT PRIMARY KEY NOT NULL REFERENCES exercise_versions(id) ON DELETE RESTRICT,
    spec_json TEXT NOT NULL CHECK (json_valid(spec_json) AND json_type(spec_json) = 'object'),
    solution_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(solution_json) AND json_type(solution_json) = 'object')
  ) STRICT;

  CREATE TABLE source_references (
    id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    authors_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(authors_json) AND json_type(authors_json) = 'array'),
    publisher TEXT,
    publication_year INTEGER CHECK (publication_year BETWEEN 1 AND 9999),
    edition TEXT,
    isbn TEXT,
    doi TEXT,
    url TEXT CHECK (url IS NULL OR url LIKE 'https://%' OR url LIKE 'http://%')
  ) STRICT;
  CREATE TABLE module_version_sources (
    module_version_id TEXT NOT NULL REFERENCES module_versions(id) ON DELETE RESTRICT,
    source_reference_id TEXT NOT NULL REFERENCES source_references(id) ON DELETE RESTRICT,
    locator TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    PRIMARY KEY (module_version_id, source_reference_id)
  ) STRICT;
  CREATE INDEX module_version_sources_reference ON module_version_sources(source_reference_id);

  CREATE TRIGGER module_versions_begin_as_draft BEFORE INSERT ON module_versions
  WHEN NEW.status <> 'draft' OR NEW.revision <> 1
  BEGIN SELECT RAISE(ABORT, 'module versions must begin as draft revision 1'); END;
  CREATE TRIGGER module_versions_revision BEFORE UPDATE ON module_versions
  WHEN NEW.id <> OLD.id OR NEW.module_id <> OLD.module_id OR NEW.version <> OLD.version
    OR NEW.revision <> OLD.revision + 1 OR NEW.created_at <> OLD.created_at
    OR julianday(NEW.updated_at) < julianday(OLD.updated_at)
  BEGIN SELECT RAISE(ABORT, 'version identity is immutable and revision must advance'); END;
  CREATE TRIGGER module_versions_published_update BEFORE UPDATE ON module_versions
  WHEN OLD.status = 'published'
  BEGIN SELECT RAISE(ABORT, 'published content is immutable'); END;
  CREATE TRIGGER module_versions_published_delete BEFORE DELETE ON module_versions
  WHEN OLD.status = 'published'
  BEGIN SELECT RAISE(ABORT, 'published content is immutable'); END;
  CREATE TRIGGER module_versions_publish_requirements BEFORE UPDATE OF status ON module_versions
  WHEN NEW.status = 'published'
  BEGIN
    SELECT RAISE(ABORT, 'published versions need lesson parts')
      WHERE NOT EXISTS (SELECT 1 FROM lesson_part_versions WHERE module_version_id = NEW.id);
    SELECT RAISE(ABORT, 'published exercises need private grading specifications')
      WHERE EXISTS (SELECT 1 FROM exercise_versions e LEFT JOIN exercise_grading_specs s ON s.exercise_version_id = e.id
        WHERE e.module_version_id = NEW.id AND s.exercise_version_id IS NULL);
  END;
  CREATE TRIGGER modules_publish_insert BEFORE INSERT ON modules WHEN NEW.status = 'published'
  BEGIN SELECT RAISE(ABORT, 'create a draft module before publishing a version'); END;
  CREATE TRIGGER modules_publish_update BEFORE UPDATE OF status ON modules WHEN NEW.status = 'published'
  BEGIN
    SELECT RAISE(ABORT, 'published modules need a published version')
      WHERE NOT EXISTS (SELECT 1 FROM module_versions WHERE module_id = NEW.id AND status = 'published');
  END;

  ${versionChildren}

  CREATE TRIGGER grading_specs_published_insert BEFORE INSERT ON exercise_grading_specs
  WHEN EXISTS (SELECT 1 FROM exercise_versions e JOIN module_versions v ON v.id = e.module_version_id
    WHERE e.id = NEW.exercise_version_id AND v.status = 'published')
  BEGIN SELECT RAISE(ABORT, 'published content is immutable'); END;
  CREATE TRIGGER grading_specs_published_update BEFORE UPDATE ON exercise_grading_specs
  WHEN EXISTS (SELECT 1 FROM exercise_versions e JOIN module_versions v ON v.id = e.module_version_id
    WHERE e.id IN (OLD.exercise_version_id, NEW.exercise_version_id) AND v.status = 'published')
  BEGIN SELECT RAISE(ABORT, 'published content is immutable'); END;
  CREATE TRIGGER grading_specs_published_delete BEFORE DELETE ON exercise_grading_specs
  WHEN EXISTS (SELECT 1 FROM exercise_versions e JOIN module_versions v ON v.id = e.module_version_id
    WHERE e.id = OLD.exercise_version_id AND v.status = 'published')
  BEGIN SELECT RAISE(ABORT, 'published content is immutable'); END;
  CREATE TRIGGER source_references_published_update BEFORE UPDATE ON source_references
  WHEN EXISTS (SELECT 1 FROM module_version_sources s JOIN module_versions v ON v.id = s.module_version_id
    WHERE s.source_reference_id = OLD.id AND v.status = 'published')
  BEGIN SELECT RAISE(ABORT, 'published citations are immutable'); END;
`;
