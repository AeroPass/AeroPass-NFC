import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: { permisos?: string[] } }>();
    const permisos = request.user?.permisos ?? [];
    const hasAll = required.every((permission) => permisos.includes(permission));
    if (!hasAll) throw new ForbiddenException('No tiene el permiso requerido para esta operación.');
    return true;
  }
}
