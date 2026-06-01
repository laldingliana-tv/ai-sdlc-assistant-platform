import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * RBAC decorator — restricts endpoint access to specific roles.
 * Used in conjunction with a RolesGuard (to be implemented with real auth).
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
