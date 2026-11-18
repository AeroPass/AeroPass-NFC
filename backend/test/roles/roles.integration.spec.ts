import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesController } from '../../src/roles/roles.controller';
import { RolesService } from '../../src/roles/roles.service';
import { Rol } from '../../src/roles/entities/rol.entity';

/**
 * PI-1 | Integración: HTTP (RolesController) + ValidationPipe + RolesService
 * con un repositorio en memoria como base de datos de pruebas.
 */
describe('Roles - prueba de integración (Controller + Service + repositorio en memoria)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let roles: Array<Partial<Rol>>;

  beforeAll(async () => {
    roles = [
      { id: 1, codigo: 'ADMIN', nombre: 'Administrador', descripcion: null, estado: 'ACTIVO', rolPermisos: [] },
      { id: 2, codigo: 'DOCENTE', nombre: 'Docente', descripcion: null, estado: 'ACTIVO', rolPermisos: [] },
      { id: 9, codigo: 'INVENTADO', nombre: 'Fuera del conjunto fijo', descripcion: null, estado: 'ACTIVO', rolPermisos: [] },
    ];

    const repoEnMemoria = {
      find: jest.fn(async () => roles.map((r) => ({ ...r }))),
      findOne: jest.fn(async ({ where }: { where: { id: number } }) => {
        const encontrado = roles.find((r) => r.id === where.id);
        return encontrado ? { ...encontrado } : null;
      }),
      update: jest.fn(async (id: number, data: Partial<Rol>) => {
        Object.assign(roles.find((r) => r.id === id)!, data);
      }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [RolesService, { provide: getRepositoryToken(Rol), useValue: repoEnMemoria }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('actualiza un rol por HTTP, lo persiste y rechaza datos inválidos o roles inexistentes', async () => {
    const put = await fetch(`${baseUrl}/roles/2`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion: 'Docentes de la facultad', estado: 'INACTIVO' }),
    });
    expect(put.status).toBe(200);
    expect(await put.json()).toMatchObject({
      id: 2,
      codigo: 'DOCENTE',
      descripcion: 'Docentes de la facultad',
      estado: 'INACTIVO',
    });

    const get = await fetch(`${baseUrl}/roles/2`);
    expect(get.status).toBe(200);
    expect(await get.json()).toMatchObject({ estado: 'INACTIVO' });

    const invalido = await fetch(`${baseUrl}/roles/2`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'SUSPENDIDO' }),
    });
    expect(invalido.status).toBe(400);
    expect(roles.find((r) => r.id === 2)!.estado).toBe('INACTIVO');

    const noExiste = await fetch(`${baseUrl}/roles/999`);
    expect(noExiste.status).toBe(404);

    const fueraDeConjunto = await fetch(`${baseUrl}/roles/9`);
    expect(fueraDeConjunto.status).toBe(400);
  });
});
