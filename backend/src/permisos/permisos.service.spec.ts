import { PermisosService } from './permisos.service';

/**
 * PU-4 | Capa: Service / acceso a datos (QueryBuilder del repositorio mockeado)
 */
describe('PermisosService (unitaria)', () => {
  it('filtra por módulo y agrupa los permisos activos por módulo', async () => {
    const permisos = [
      { id: 1, codigo: 'ASISTENCIAS_LEER', nombre: 'Leer asistencias', modulo: 'ASISTENCIAS' },
      { id: 2, codigo: 'ASISTENCIAS_CREAR', nombre: 'Crear asistencias', modulo: 'ASISTENCIAS' },
      { id: 3, codigo: 'ROLES_GESTIONAR', nombre: 'Gestionar roles', modulo: 'ROLES' },
    ];
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(permisos),
    };
    const repo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
    const service = new PermisosService(repo as any);

    const user = {
      id: 1,
      username: 'admin',
      persona: { nombreCompleto: 'Admin Sistema' },
      rol: { codigo: 'ADMIN' },
      permisos: ['PERMISOS_GESTIONAR'],
    };

    const resultado = await service.findAll(user, { modulo: 'ASISTENCIAS' });

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('p');
    expect(qb.where).toHaveBeenCalledWith('p.estado = :estado', { estado: 'ACTIVO' });
    expect(qb.andWhere).toHaveBeenCalledTimes(1);
    expect(qb.andWhere).toHaveBeenCalledWith('p.modulo = :modulo', { modulo: 'ASISTENCIAS' });
    expect(resultado.totalEnSistema).toBe(3);
    expect(Object.keys(resultado.todosLosPermisos)).toEqual(['ASISTENCIAS', 'ROLES']);
    expect(resultado.todosLosPermisos['ASISTENCIAS']).toHaveLength(2);
    expect(resultado.totalAsignados).toBe(1);
    expect(resultado.usuario.nombreCompleto).toBe('Admin Sistema');
  });
});
