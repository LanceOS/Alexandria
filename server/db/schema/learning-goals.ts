export const learningGoalsSql = `
  CREATE TABLE user_learning_goals (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
    weekly_goal INTEGER NOT NULL CHECK (weekly_goal BETWEEN 1 AND 14),
    updated_at TEXT NOT NULL CHECK (julianday(updated_at) IS NOT NULL)
  ) STRICT;
`;
