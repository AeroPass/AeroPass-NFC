import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { PERMISSIONS_KEY } from './permissions.decorator.js';

/**
 * Guard que verifica autenticación JWT + permisos RBAC.
 *
 * 1. Verifica que el token JWT sea válido.
 * 2. Si el endpoint tiene @RequirePermissions(...), verifica que
 *    el usuario tenga al menos uno de los permisos requeridos.
 *
 * Lanza 401 si no está autenticado, 403 si no tiene permiso.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('No autorizado. Token inválido o ausente.');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions: string[] = user.permisos || [];
      const hasPermission = requiredPermissions.some((p) => userPermissions.includes(p));

      if (!hasPermission) {
        throw new UnauthorizedException({
          error: 'Prohibido. No tiene el permiso requerido.',
          requerido: requiredPermissions,
          tiene: userPermissions,
        });
      }
    }

    return user;
  }
}
