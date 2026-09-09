import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { PERMISSIONS_KEY } from './permissions.decorator.js';

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
        // 401 = "autentícate de nuevo"; permiso insuficiente es 403 Forbidden.
        // No se exponen los permisos requeridos ni los propios al cliente.
        throw new ForbiddenException('No tiene el permiso requerido para esta operación.');
      }
    }

    return user;
  }
}
