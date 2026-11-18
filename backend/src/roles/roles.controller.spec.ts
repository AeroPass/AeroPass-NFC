import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

/**
 * PU-1 | Capa: Controller
 * Verifica que RolesController.findAll traduzca el query param
 * `includePermisos` (string) a booleano y delegue en RolesService.
 */
describe('RolesController (unitaria)', () => {
  let controller: RolesController;
  let service: { findAll: jest.Mock };

  beforeEach(() => {
    service = { findAll: jest.fn().mockResolvedValue([]) };
    controller = new RolesController(service as unknown as RolesService);
  });

  it('delega en el servicio convirtiendo includePermisos a booleano', async () => {
    const roles = [
      { id: 1, codigo: 'ADMIN', nombre: 'Administrador', estado: 'ACTIVO' },
    ];
    service.findAll.mockResolvedValueOnce(roles);

    const conPermisos = await controller.findAll('true');
    await controller.findAll('false');
    await controller.findAll(undefined);

    expect(conPermisos).toEqual(roles);
    expect(service.findAll).toHaveBeenNthCalledWith(1, true);
    expect(service.findAll).toHaveBeenNthCalledWith(2, false);
    expect(service.findAll).toHaveBeenNthCalledWith(3, false);
    expect(service.findAll).toHaveBeenCalledTimes(3);
  });
});
