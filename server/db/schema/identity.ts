// Migration SQL is immutable once released; subsequent changes require a new migration.
export const identitySql = `
  CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 36),
    username TEXT NOT NULL COLLATE NOCASE UNIQUE
      CHECK (length(username) BETWEEN 3 AND 40 AND username = lower(username)
        AND username NOT GLOB '*[^a-z0-9_.-]*' AND substr(username, 1, 1) GLOB '[a-z0-9]'),
    display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 100 AND length(display_name) <= 100),
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
    created_at TEXT NOT NULL CHECK (length(created_at) = 24 AND julianday(created_at) IS NOT NULL),
    updated_at TEXT NOT NULL CHECK (length(updated_at) = 24 AND julianday(updated_at) IS NOT NULL AND updated_at >= created_at)
  ) STRICT;

  CREATE TABLE user_credentials (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    password_hash TEXT NOT NULL CHECK (length(password_hash) BETWEEN 100 AND 512),
    updated_at TEXT NOT NULL CHECK (length(updated_at) = 24 AND julianday(updated_at) IS NOT NULL)
  ) STRICT;

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY NOT NULL CHECK (length(token_hash) = 64 AND token_hash NOT GLOB '*[^0-9a-f]*'),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    csrf_token TEXT NOT NULL CHECK (length(csrf_token) = 64 AND csrf_token NOT GLOB '*[^0-9a-f]*'),
    created_at INTEGER NOT NULL CHECK (created_at >= 0),
    expires_at INTEGER NOT NULL CHECK (expires_at > created_at AND expires_at - created_at <= 604800000)
  ) STRICT;
  CREATE INDEX sessions_user_id ON sessions(user_id, created_at);
  CREATE INDEX sessions_expires_at ON sessions(expires_at);

  CREATE TABLE user_settings (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    theme TEXT NOT NULL CHECK (theme IN ('system', 'light', 'dark')),
    text_size TEXT NOT NULL CHECK (text_size IN ('small', 'medium', 'large')),
    motion_preference TEXT NOT NULL CHECK (motion_preference IN ('system', 'reduced', 'full')),
    revision INTEGER NOT NULL CHECK (revision > 0 AND revision <= 9007199254740991),
    updated_at TEXT NOT NULL CHECK (length(updated_at) = 24 AND julianday(updated_at) IS NOT NULL)
  ) STRICT;
`;
