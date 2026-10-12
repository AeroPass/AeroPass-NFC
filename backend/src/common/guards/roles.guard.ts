import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: { rol?: { codigo?: string } } }>();
    const actualRole = request.user?.rol?.codigo as Role | undefined;
    if (!actualRole) throw new ForbiddenException('No fue posible determinar el rol del usuario.');
    if (!roles.includes(actualRole)) {
      throw new ForbiddenException('No tiene el rol requerido para esta operación.');
    }
    return true;
  }
}
