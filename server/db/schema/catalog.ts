export const catalogRevisionsSql = `
  ALTER TABLE categories ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1);
  ALTER TABLE topics ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1);
`;
