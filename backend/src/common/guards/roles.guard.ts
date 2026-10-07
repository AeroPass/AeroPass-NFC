import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleCode } from '../enums/role.enum';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<RoleCode[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) return true;

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const currentRole = request.user?.rol?.codigo;

    if (!currentRole) {
      throw new ForbiddenException('No fue posible determinar el rol del usuario.');
    }

    if (!roles.includes(currentRole as RoleCode)) {
      throw new ForbiddenException('Su rol no tiene acceso a esta ruta.');
    }

    return true;
  }
}
