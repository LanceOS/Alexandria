export interface UserSettings {
  theme: 'system' | 'light' | 'dark';
  textSize: 'small' | 'medium' | 'large';
  motionPreference: 'system' | 'reduced' | 'full';
  revision: number;
  updatedAt: string | null;
}

export type SettingsPatch = Partial<Pick<UserSettings, 'theme' | 'textSize' | 'motionPreference'>> & { revision: number };

export const settingsPatchSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['revision'],
  anyOf: [{ required: ['theme'] }, { required: ['textSize'] }, { required: ['motionPreference'] }],
  properties: {
    theme: { type: 'string', enum: ['system', 'light', 'dark'] },
    textSize: { type: 'string', enum: ['small', 'medium', 'large'] },
    motionPreference: { type: 'string', enum: ['system', 'reduced', 'full'] },
    revision: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER - 1 },
  },
} as const;
