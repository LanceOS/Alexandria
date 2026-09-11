import type { DatabaseSync } from 'node:sqlite';
import { MODULE_XP, SECTION_XP, type LearningProgress, type ModuleProgress } from '../../shared/progress.js';
import { transaction } from '../db/transaction.js';
import { AppError } from '../http/errors.js';
import { readModuleDetail } from '../repositories/curriculum.js';

// Match curriculum visibility, including every ancestor and category placement.
const visibleModules = `WITH RECURSIVE visible_units AS (
  SELECT u.id FROM units u JOIN topics t ON t.id = u.topic_id
  WHERE u.parent_unit_id IS NULL AND u.status = 'published' AND t.status = 'published'
    AND EXISTS (SELECT 1 FROM topic_categories tc JOIN categories c ON c.id = tc.category_id
      WHERE tc.topic_id = t.id AND c.status = 'published')
  UNION ALL
  SELECT u.id FROM units u JOIN visible_units parent ON u.parent_unit_id = parent.id
  WHERE u.status = 'published'
), visible_modules AS (
  SELECT m.id, v.id AS version_id FROM modules m JOIN visible_units u ON m.unit_id = u.id
  JOIN module_versions v ON v.module_id = m.id AND v.status = 'published'
    AND v.version = (SELECT max(latest.version) FROM module_versions latest
      WHERE latest.module_id = m.id AND latest.status = 'published')
  WHERE m.status = 'published'
)`;

export function progressTimeZone(value = 'UTC'): string {
  try {
    // Intl also accepts numeric offsets, but this API deliberately uses named zones.
    if (!/^[A-Za-z][A-Za-z0-9_+\-/]{0,99}$/.test(value)) throw new Error('Invalid zone');
    return new Intl.DateTimeFormat('en-US', { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    throw new AppError(400, 'INVALID_TIME_ZONE', 'Choose a valid time zone.');
  }
}

function localDate(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** Calendar dates avoid assuming that a local week always contains 168 hours. */
export function progressWeek(now: Date, timeZone: string): { startsOn: string; endsBefore: string } {
  const day = new Date(`${localDate(now, timeZone)}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  const startsOn = day.toISOString().slice(0, 10);
  day.setUTCDate(day.getUTCDate() + 7);
  return { startsOn, endsBefore: day.toISOString().slice(0, 10) };
}

interface StoredProgress {
  lastVersionId: string;
  lastPartId: string | null;
  completedAt: string | null;
  completedVersionId: string | null;
  lastActivityAt: string;
}

export class ProgressService {
  constructor(private readonly database: DatabaseSync, private readonly clock: () => Date = () => new Date()) {}

  read(userId: string, requestedTimeZone?: string): LearningProgress {
    const timeZone = progressTimeZone(requestedTimeZone);
    const now = this.clock();
    const week = progressWeek(now, timeZone);
    const rows = this.database.prepare(`${visibleModules}
      SELECT p.module_id AS moduleId, v.version_id AS versionId, p.last_module_version_id AS lastVersionId,
        p.last_lesson_part_id AS lastPartId, p.completed_at AS completedAt,
        p.completed_module_version_id AS completedVersionId
      FROM user_module_progress p JOIN visible_modules v ON v.id = p.module_id
      WHERE p.user_id = ? ORDER BY p.last_activity_at DESC, p.module_id`).all(userId) as unknown as
      Array<Omit<ModuleProgress, 'completedPartIds'> & { lastVersionId: string }>;
    const completedParts = this.database.prepare(`${visibleModules}
      SELECT p.module_id AS moduleId, p.lesson_part_id AS partId
      FROM user_lesson_part_progress p JOIN visible_modules v ON v.id = p.module_id AND v.version_id = p.module_version_id
      JOIN lesson_part_versions part ON part.lesson_part_id = p.lesson_part_id AND part.module_version_id = p.module_version_id
      WHERE p.user_id = ? ORDER BY part.position, p.lesson_part_id`).all(userId) as unknown as Array<{ moduleId: string; partId: string }>;
    const partsByModule = new Map<string, string[]>();
    for (const part of completedParts) {
      const parts = partsByModule.get(part.moduleId) ?? [];
      parts.push(part.partId);
      partsByModule.set(part.moduleId, parts);
    }
    const modules: ModuleProgress[] = rows.map(({ lastVersionId, ...row }) => ({ ...row,
      lastPartId: lastVersionId === row.versionId ? row.lastPartId : null,
      completedPartIds: partsByModule.get(row.moduleId) ?? [],
    }));
    // Stable identities keep revisiting or new versions from farming XP. Earned
    // totals survive catalog changes, without exposing hidden content identities.
    const completedSections = Number(this.database.prepare(`SELECT count(*) AS count FROM (
      SELECT module_id, lesson_part_id FROM user_lesson_part_progress WHERE user_id = ?
      GROUP BY module_id, lesson_part_id)`).get(userId)!.count);
    const completions = this.database.prepare(`SELECT completed_at AS completedAt FROM user_module_progress
      WHERE user_id = ? AND status = 'completed'`).all(userId) as unknown as Array<{ completedAt: string }>;
    const weeklyCompleted = completions.filter(({ completedAt }) => {
      const instant = new Date(completedAt);
      const date = localDate(instant, timeZone);
      return instant.getTime() <= now.getTime() && date >= week.startsOn && date < week.endsBefore;
    }).length;
    const weeklyGoal = Number(this.database.prepare('SELECT weekly_goal FROM user_learning_goals WHERE user_id = ?')
      .get(userId)?.weekly_goal ?? 3);
    return { modules, totalXp: completedSections * SECTION_XP + completions.length * MODULE_XP,
      completedModules: completions.length, completedSections, weeklyGoal, weeklyCompleted,
      weekStartsOn: week.startsOn, timeZone };
  }

  completeSection(userId: string, moduleId: string, partId: string, versionId: string, requestedTimeZone?: string): LearningProgress {
    const timeZone = progressTimeZone(requestedTimeZone);
    return transaction(this.database, () => {
      const detail = readModuleDetail(this.database, moduleId);
      if (detail.version.id !== versionId) {
        throw new AppError(409, 'VERSION_CHANGED', 'This lesson has been updated. Reload it before saving progress.');
      }
      if (!detail.parts.some((part) => part.id === partId)) {
        throw new AppError(404, 'NOT_FOUND', 'This resource does not exist.');
      }
      const policy = this.database.prepare(`SELECT completion_policy_json AS policy,
        EXISTS (SELECT 1 FROM exercise_versions WHERE module_version_id = ? AND is_required = 1) AS requiresExercises
        FROM module_versions WHERE id = ?`).get(versionId, versionId)!;
      if (Object.keys(JSON.parse(String(policy.policy)) as object).length > 0 || policy.requiresExercises === 1) {
        throw new AppError(409, 'COMPLETION_UNSUPPORTED', 'Reading progress is not available for this lesson yet.');
      }
      const existing = this.database.prepare(`SELECT last_module_version_id AS lastVersionId,
        last_lesson_part_id AS lastPartId, completed_at AS completedAt,
        completed_module_version_id AS completedVersionId, last_activity_at AS lastActivityAt
        FROM user_module_progress WHERE user_id = ? AND module_id = ?`).get(userId, moduleId) as unknown as StoredProgress | undefined;
      const alreadyRead = this.database.prepare(`SELECT 1 FROM user_lesson_part_progress
        WHERE user_id = ? AND module_version_id = ? AND lesson_part_id = ?`).get(userId, versionId, partId);
      if (alreadyRead) return this.read(userId, timeZone);
      const timestamp = new Date(Math.max(this.clock().getTime(), existing ? Date.parse(existing.lastActivityAt) : 0)).toISOString();
      if (!existing) {
        this.database.prepare(`INSERT INTO user_module_progress
          (user_id, module_id, last_module_version_id, last_lesson_part_id, started_at, last_activity_at)
          VALUES (?, ?, ?, ?, ?, ?)`).run(userId, moduleId, versionId, partId, timestamp, timestamp);
      }
      this.database.prepare(`INSERT INTO user_lesson_part_progress
        (user_id, module_id, module_version_id, lesson_part_id, completed_at) VALUES (?, ?, ?, ?, ?)`)
        .run(userId, moduleId, versionId, partId, timestamp);
      const readCount = Number(this.database.prepare(`SELECT count(*) AS count FROM user_lesson_part_progress
        WHERE user_id = ? AND module_version_id = ?`).get(userId, versionId)!.count);
      const completedAt = existing?.completedAt ?? (readCount === detail.parts.length ? timestamp : null);
      const completedVersionId = existing?.completedVersionId ?? (completedAt ? versionId : null);
      this.database.prepare(`UPDATE user_module_progress SET last_module_version_id = ?, last_lesson_part_id = ?,
        status = ?, completed_at = ?, completed_module_version_id = ?, last_activity_at = ?, revision = revision + 1
        WHERE user_id = ? AND module_id = ?`).run(versionId, partId, completedAt ? 'completed' : 'in_progress',
          completedAt, completedVersionId, timestamp, userId, moduleId);
      return this.read(userId, timeZone);
    });
  }

  updateGoal(userId: string, weeklyGoal: number, requestedTimeZone?: string): LearningProgress {
    const timeZone = progressTimeZone(requestedTimeZone);
    if (!Number.isInteger(weeklyGoal) || weeklyGoal < 1 || weeklyGoal > 14) {
      throw new AppError(400, 'INVALID_GOAL', 'Choose a weekly goal from 1 to 14 modules.');
    }
    return transaction(this.database, () => {
      this.database.prepare(`INSERT INTO user_learning_goals (user_id, weekly_goal, updated_at) VALUES (?, ?, ?)
        ON CONFLICT (user_id) DO UPDATE SET weekly_goal = excluded.weekly_goal, updated_at = excluded.updated_at`)
        .run(userId, weeklyGoal, this.clock().toISOString());
      return this.read(userId, timeZone);
    });
  }
}
