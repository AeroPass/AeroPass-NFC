import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorador para marcar los permisos requeridos por un endpoint.
 * El JwtAuthGuard verificará que el usuario autenticado tenga
 * al menos uno de los permisos indicados.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
