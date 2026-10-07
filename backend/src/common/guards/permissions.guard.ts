import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../auth/decorators/permissions.decorator';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const userPermissions = new Set(request.user?.permisos ?? []);

    // Una ruta puede declarar varias capacidades alternativas.
    const granted = required.some((permission) => userPermissions.has(permission));
    if (!granted) {
      throw new ForbiddenException(
        'No tiene el permiso requerido para esta operación.',
      );
    }

    return true;
  }
}
