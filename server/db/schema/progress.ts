// Sparse learner state and immutable evidence. No content or learner rows are seeded.
export const progressSql = `
  CREATE TABLE user_module_progress (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    last_module_version_id TEXT NOT NULL,
    last_lesson_part_id TEXT,
    completed_module_version_id TEXT,
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision BETWEEN 1 AND 9007199254740991),
    started_at TEXT NOT NULL CHECK (julianday(started_at) IS NOT NULL),
    last_activity_at TEXT NOT NULL CHECK (julianday(last_activity_at) IS NOT NULL AND julianday(last_activity_at) >= julianday(started_at)),
    completed_at TEXT CHECK (completed_at IS NULL OR julianday(completed_at) IS NOT NULL),
    PRIMARY KEY (user_id, module_id),
    FOREIGN KEY (last_module_version_id, module_id) REFERENCES module_versions(id, module_id) ON DELETE RESTRICT,
    FOREIGN KEY (completed_module_version_id, module_id) REFERENCES module_versions(id, module_id) ON DELETE RESTRICT,
    FOREIGN KEY (last_lesson_part_id, last_module_version_id, module_id)
      REFERENCES lesson_part_versions(lesson_part_id, module_version_id, module_id) ON DELETE RESTRICT,
    CHECK ((status = 'in_progress' AND completed_at IS NULL AND completed_module_version_id IS NULL) OR
      (status = 'completed' AND completed_at IS NOT NULL AND completed_module_version_id IS NOT NULL
        AND julianday(completed_at) >= julianday(started_at) AND julianday(last_activity_at) >= julianday(completed_at)))
  ) STRICT;
  CREATE INDEX user_module_progress_activity ON user_module_progress(user_id, last_activity_at DESC, module_id);
  CREATE INDEX user_module_progress_module ON user_module_progress(module_id);

  CREATE TRIGGER progress_initial_revision BEFORE INSERT ON user_module_progress WHEN NEW.revision <> 1
  BEGIN SELECT RAISE(ABORT, 'progress must begin at revision 1'); END;
  CREATE TRIGGER progress_no_replace BEFORE INSERT ON user_module_progress
  WHEN EXISTS (SELECT 1 FROM user_module_progress WHERE user_id = NEW.user_id AND module_id = NEW.module_id)
  BEGIN SELECT RAISE(ABORT, 'existing progress must be updated with its revision'); END;
  CREATE TRIGGER progress_revision BEFORE UPDATE ON user_module_progress
  WHEN NEW.user_id <> OLD.user_id OR NEW.module_id <> OLD.module_id OR NEW.started_at <> OLD.started_at
    OR NEW.revision <> OLD.revision + 1 OR julianday(NEW.last_activity_at) < julianday(OLD.last_activity_at)
  BEGIN SELECT RAISE(ABORT, 'progress identity and start are immutable; advance revision and activity'); END;
  CREATE TRIGGER progress_preserve_completion BEFORE UPDATE ON user_module_progress
  WHEN OLD.status = 'completed' AND (NEW.status <> 'completed' OR NEW.completed_at IS NOT OLD.completed_at
    OR NEW.completed_module_version_id IS NOT OLD.completed_module_version_id)
  BEGIN SELECT RAISE(ABORT, 'historical completion cannot regress or change'); END;
  CREATE TRIGGER progress_preserve_completion_delete BEFORE DELETE ON user_module_progress WHEN OLD.status = 'completed'
  BEGIN SELECT RAISE(ABORT, 'historical completion cannot be deleted'); END;
  CREATE TRIGGER progress_published_insert BEFORE INSERT ON user_module_progress
  BEGIN
    SELECT RAISE(ABORT, 'progress requires a published module version') WHERE NOT EXISTS
      (SELECT 1 FROM module_versions WHERE id = NEW.last_module_version_id AND status = 'published');
    SELECT RAISE(ABORT, 'completion requires a published module version') WHERE NEW.completed_module_version_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM module_versions WHERE id = NEW.completed_module_version_id AND status = 'published');
  END;
  CREATE TRIGGER progress_published_update BEFORE UPDATE ON user_module_progress
  BEGIN
    SELECT RAISE(ABORT, 'progress requires a published module version') WHERE NOT EXISTS
      (SELECT 1 FROM module_versions WHERE id = NEW.last_module_version_id AND status = 'published');
    SELECT RAISE(ABORT, 'completion requires a published module version') WHERE NEW.completed_module_version_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM module_versions WHERE id = NEW.completed_module_version_id AND status = 'published');
  END;

  CREATE TABLE user_lesson_part_progress (
    user_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    module_version_id TEXT NOT NULL,
    lesson_part_id TEXT NOT NULL,
    completed_at TEXT NOT NULL CHECK (julianday(completed_at) IS NOT NULL),
    PRIMARY KEY (user_id, module_version_id, lesson_part_id),
    FOREIGN KEY (user_id, module_id) REFERENCES user_module_progress(user_id, module_id) ON DELETE RESTRICT,
    FOREIGN KEY (lesson_part_id, module_version_id, module_id)
      REFERENCES lesson_part_versions(lesson_part_id, module_version_id, module_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE TRIGGER lesson_progress_valid_insert BEFORE INSERT ON user_lesson_part_progress
  BEGIN
    SELECT RAISE(ABORT, 'lesson completion is immutable') WHERE EXISTS
      (SELECT 1 FROM user_lesson_part_progress WHERE user_id = NEW.user_id AND module_version_id = NEW.module_version_id
        AND lesson_part_id = NEW.lesson_part_id);
    SELECT RAISE(ABORT, 'lesson completion requires a published version') WHERE NOT EXISTS
      (SELECT 1 FROM module_versions WHERE id = NEW.module_version_id AND status = 'published');
    SELECT RAISE(ABORT, 'lesson completion cannot precede module start') WHERE EXISTS
      (SELECT 1 FROM user_module_progress WHERE user_id = NEW.user_id AND module_id = NEW.module_id
        AND julianday(started_at) > julianday(NEW.completed_at));
  END;
  CREATE TRIGGER lesson_progress_no_update BEFORE UPDATE ON user_lesson_part_progress
  BEGIN SELECT RAISE(ABORT, 'lesson completion is immutable'); END;
  CREATE TRIGGER lesson_progress_no_delete BEFORE DELETE ON user_lesson_part_progress
  BEGIN SELECT RAISE(ABORT, 'lesson completion is immutable'); END;

  CREATE TABLE exercise_drafts (
    user_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    module_version_id TEXT NOT NULL,
    exercise_version_id TEXT NOT NULL,
    response_json TEXT NOT NULL CHECK (json_valid(response_json) AND json_type(response_json) = 'object'),
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision BETWEEN 1 AND 9007199254740991),
    updated_at TEXT NOT NULL CHECK (julianday(updated_at) IS NOT NULL),
    PRIMARY KEY (user_id, exercise_version_id),
    FOREIGN KEY (user_id, module_id) REFERENCES user_module_progress(user_id, module_id) ON DELETE RESTRICT,
    FOREIGN KEY (exercise_version_id, module_version_id, module_id)
      REFERENCES exercise_versions(id, module_version_id, module_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE TRIGGER exercise_drafts_valid_insert BEFORE INSERT ON exercise_drafts
  BEGIN
    SELECT RAISE(ABORT, 'existing drafts must be updated with their revision') WHERE EXISTS
      (SELECT 1 FROM exercise_drafts WHERE user_id = NEW.user_id AND exercise_version_id = NEW.exercise_version_id);
    SELECT RAISE(ABORT, 'drafts must begin at revision 1') WHERE NEW.revision <> 1;
    SELECT RAISE(ABORT, 'exercise drafts require a published version') WHERE NOT EXISTS
      (SELECT 1 FROM module_versions WHERE id = NEW.module_version_id AND status = 'published');
    SELECT RAISE(ABORT, 'exercise draft cannot precede module start') WHERE EXISTS
      (SELECT 1 FROM user_module_progress WHERE user_id = NEW.user_id AND module_id = NEW.module_id
        AND julianday(started_at) > julianday(NEW.updated_at));
  END;
  CREATE TRIGGER exercise_drafts_revision BEFORE UPDATE ON exercise_drafts
  WHEN NEW.user_id <> OLD.user_id OR NEW.module_id <> OLD.module_id OR NEW.module_version_id <> OLD.module_version_id
    OR NEW.exercise_version_id <> OLD.exercise_version_id OR NEW.revision <> OLD.revision + 1
    OR julianday(NEW.updated_at) < julianday(OLD.updated_at)
  BEGIN SELECT RAISE(ABORT, 'draft identity is immutable; advance revision and timestamp'); END;

  CREATE TABLE exercise_attempts (
    id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
    user_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    module_version_id TEXT NOT NULL,
    exercise_version_id TEXT NOT NULL,
    submission_key TEXT NOT NULL CHECK (length(trim(submission_key)) BETWEEN 1 AND 200),
    response_json TEXT NOT NULL CHECK (json_valid(response_json) AND json_type(response_json) = 'object'),
    submitted_at TEXT NOT NULL CHECK (julianday(submitted_at) IS NOT NULL),
    time_spent_ms INTEGER CHECK (time_spent_ms >= 0),
    hints_used INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
    solution_viewed INTEGER NOT NULL DEFAULT 0 CHECK (solution_viewed IN (0, 1)),
    UNIQUE (user_id, submission_key),
    FOREIGN KEY (user_id, module_id) REFERENCES user_module_progress(user_id, module_id) ON DELETE RESTRICT,
    FOREIGN KEY (exercise_version_id, module_version_id, module_id)
      REFERENCES exercise_versions(id, module_version_id, module_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE INDEX exercise_attempts_history ON exercise_attempts(user_id, exercise_version_id, submitted_at, id);
  CREATE INDEX exercise_attempts_version ON exercise_attempts(exercise_version_id);
  CREATE TRIGGER exercise_attempts_valid_insert BEFORE INSERT ON exercise_attempts
  BEGIN
    SELECT RAISE(ABORT, 'submitted attempts cannot be replaced or duplicated') WHERE EXISTS
      (SELECT 1 FROM exercise_attempts WHERE id = NEW.id OR (user_id = NEW.user_id AND submission_key = NEW.submission_key));
    SELECT RAISE(ABORT, 'attempts require a published version') WHERE NOT EXISTS
      (SELECT 1 FROM module_versions WHERE id = NEW.module_version_id AND status = 'published');
    SELECT RAISE(ABORT, 'attempt cannot precede module start') WHERE EXISTS
      (SELECT 1 FROM user_module_progress WHERE user_id = NEW.user_id AND module_id = NEW.module_id
        AND julianday(started_at) > julianday(NEW.submitted_at));
  END;
  CREATE TRIGGER exercise_attempts_no_update BEFORE UPDATE ON exercise_attempts
  BEGIN SELECT RAISE(ABORT, 'submitted attempts are immutable'); END;
  CREATE TRIGGER exercise_attempts_no_delete BEFORE DELETE ON exercise_attempts
  BEGIN SELECT RAISE(ABORT, 'submitted attempts are immutable'); END;

  -- No result means pending. Append grading events without rewriting submitted work.
  CREATE TABLE exercise_attempt_results (
    attempt_id TEXT NOT NULL REFERENCES exercise_attempts(id) ON DELETE RESTRICT,
    sequence INTEGER NOT NULL CHECK (sequence > 0),
    status TEXT NOT NULL CHECK (status IN ('running', 'graded', 'failed')),
    outcome TEXT CHECK (outcome IN ('correct', 'incorrect', 'partial', 'reviewed')),
    score REAL CHECK (score BETWEEN 0 AND 1),
    feedback_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(feedback_json) AND json_type(feedback_json) = 'object'),
    error_code TEXT CHECK (error_code IS NULL OR length(trim(error_code)) > 0),
    recorded_at TEXT NOT NULL CHECK (julianday(recorded_at) IS NOT NULL),
    PRIMARY KEY (attempt_id, sequence),
    CHECK ((status = 'graded' AND outcome IS NOT NULL AND error_code IS NULL) OR
      (status = 'running' AND outcome IS NULL AND score IS NULL AND error_code IS NULL) OR
      (status = 'failed' AND outcome IS NULL AND score IS NULL AND error_code IS NOT NULL))
  ) STRICT;
  CREATE UNIQUE INDEX exercise_attempt_results_final ON exercise_attempt_results(attempt_id) WHERE status = 'graded';
  CREATE TRIGGER exercise_attempt_results_valid_insert BEFORE INSERT ON exercise_attempt_results
  BEGIN
    SELECT RAISE(ABORT, 'grading events must advance sequence') WHERE NEW.sequence <>
      COALESCE((SELECT MAX(sequence) + 1 FROM exercise_attempt_results WHERE attempt_id = NEW.attempt_id), 1);
    SELECT RAISE(ABORT, 'a final grade is immutable') WHERE EXISTS
      (SELECT 1 FROM exercise_attempt_results WHERE attempt_id = NEW.attempt_id AND status = 'graded');
    SELECT RAISE(ABORT, 'grading time cannot go backwards') WHERE EXISTS
      (SELECT 1 FROM exercise_attempts WHERE id = NEW.attempt_id AND julianday(submitted_at) > julianday(NEW.recorded_at))
      OR EXISTS (SELECT 1 FROM exercise_attempt_results WHERE attempt_id = NEW.attempt_id
        AND julianday(recorded_at) > julianday(NEW.recorded_at));
  END;
  CREATE TRIGGER exercise_attempt_results_no_update BEFORE UPDATE ON exercise_attempt_results
  BEGIN SELECT RAISE(ABORT, 'grading events are immutable'); END;
  CREATE TRIGGER exercise_attempt_results_no_delete BEFORE DELETE ON exercise_attempt_results
  BEGIN SELECT RAISE(ABORT, 'grading events are immutable'); END;
`;
