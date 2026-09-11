export interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'member';
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export type SessionResponse = { user: null } | { user: User; csrfToken: string };

export const loginSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['username', 'password'],
  properties: {
    username: { type: 'string', minLength: 3, maxLength: 40, pattern: '^[A-Za-z0-9][A-Za-z0-9_.-]*$' },
    password: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;
