import type { DatabaseSync } from 'node:sqlite';
import type { SettingsPatch, UserSettings } from '../../shared/settings.js';
import { transaction } from '../db/transaction.js';
import { AppError } from '../http/errors.js';

export class SettingsService {
  constructor(private readonly database: DatabaseSync) {}

  read(userId: string): UserSettings {
    return this.database.prepare(`SELECT theme, text_size AS textSize, motion_preference AS motionPreference,
      revision, updated_at AS updatedAt FROM user_settings WHERE user_id = ?`).get(userId) as UserSettings | undefined
      ?? { theme: 'system', textSize: 'medium', motionPreference: 'system', revision: 0, updatedAt: null };
  }

  update(userId: string, input: SettingsPatch): UserSettings {
    return transaction(this.database, () => {
      const current = this.read(userId);
      if (current.revision !== input.revision) throw new AppError(409, 'REVISION_CONFLICT', 'Settings changed in another session. Reload before saving.');
      const next: UserSettings = {
        theme: input.theme ?? current.theme,
        textSize: input.textSize ?? current.textSize,
        motionPreference: input.motionPreference ?? current.motionPreference,
        revision: current.revision + 1,
        updatedAt: new Date().toISOString(),
      };
      if (current.revision === 0) {
        this.database.prepare(`INSERT INTO user_settings (user_id, theme, text_size, motion_preference, revision, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`).run(userId, next.theme, next.textSize, next.motionPreference, next.revision, next.updatedAt);
      } else {
        const result = this.database.prepare(`UPDATE user_settings SET theme = ?, text_size = ?, motion_preference = ?, revision = ?, updated_at = ?
          WHERE user_id = ? AND revision = ?`).run(next.theme, next.textSize, next.motionPreference, next.revision, next.updatedAt, userId, input.revision);
        if (result.changes !== 1) throw new AppError(409, 'REVISION_CONFLICT', 'Settings changed in another session. Reload before saving.');
      }
      return next;
    });
  }
}
