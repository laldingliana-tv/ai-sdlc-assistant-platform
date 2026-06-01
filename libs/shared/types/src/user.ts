/**
 * User and authentication types.
 */

export type UserRole = 'admin' | 'developer' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
