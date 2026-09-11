export interface PracticeQuest {
  id: string;
  title: string;
  prompt: string;
  code: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  hint: string;
  boss: boolean;
}

/** Public self-check material, including explanations; never an authoritative grade. */
export interface ModulePractice {
  moduleId: string;
  versionId: string;
  quests: PracticeQuest[];
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown, max = 10_000): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const fields = (value: Record<string, unknown>, allowed: string[]) =>
  Object.keys(value).every((key) => allowed.includes(key));

function isPracticeQuest(value: unknown): value is PracticeQuest {
  return record(value) && fields(value, ['id', 'title', 'prompt', 'code', 'choices', 'answerIndex', 'explanation', 'hint', 'boss'])
    && text(value.id, 200) && [value.title, value.prompt, value.code, value.explanation, value.hint].every((item) => text(item))
    && typeof value.boss === 'boolean' && Array.isArray(value.choices) && value.choices.length >= 2 && value.choices.length <= 6
    && value.choices.every((choice) => text(choice))
    // Whitespace collapses in the rendered labels, so these choices would be indistinguishable.
    && new Set(value.choices.map((choice: string) => choice.trim().replace(/\s+/g, ' '))).size === value.choices.length
    && typeof value.answerIndex === 'number' && Number.isInteger(value.answerIndex)
    && value.answerIndex >= 0 && value.answerIndex < value.choices.length;
}

export function isModulePractice(value: unknown): value is ModulePractice {
  return record(value) && fields(value, ['moduleId', 'versionId', 'quests'])
    && text(value.moduleId, 200) && text(value.versionId, 200) && Array.isArray(value.quests) && value.quests.length <= 10
    && value.quests.every(isPracticeQuest)
    && new Set(value.quests.map((quest: PracticeQuest) => quest.id)).size === value.quests.length;
}
