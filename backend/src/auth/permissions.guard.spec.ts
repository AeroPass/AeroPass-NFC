import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

/**
 * PU-3 | Capa: Seguridad / Guard
 * Sin el permiso requerido -> 403; con todos los permisos -> acceso permitido.
 */
describe('PermissionsGuard (unitaria)', () => {
  const crearContexto = (permisos?: string[]) =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user: { permisos } }) }),
    }) as unknown as ExecutionContext;

  it('lanza ForbiddenException cuando falta el permiso y permite cuando están todos', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['ROLES_GESTIONAR']),
    };
    const guard = new PermissionsGuard(reflector as unknown as Reflector);

    expect(() => guard.canActivate(crearContexto(['ASISTENCIAS_LEER']))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(crearContexto(undefined))).toThrow(ForbiddenException);
    expect(guard.canActivate(crearContexto(['ROLES_GESTIONAR', 'OTRO']))).toBe(true);
  });
});
