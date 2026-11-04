import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tarjeta } from '../../src/tarjetas/entities/tarjeta.entity';
import { TarjetasService } from '../../src/tarjetas/tarjetas.service';
import { crearTarjetaMock } from './tarjetas.mocks';

describe('Tarjetas - prueba de integración', () => {
  let service: TarjetasService;
  let moduleFixture: TestingModule;
  const tarjetas: Tarjeta[] = [];

  beforeEach(async () => {
    tarjetas.length = 0;
    const repositorioEnMemoria = {
      findOne: jest.fn(
        async ({ where }: { where: Partial<Tarjeta> }): Promise<Tarjeta | null> =>
          tarjetas.find(
            (tarjeta) =>
              (where.id === undefined || tarjeta.id === where.id) &&
              (where.uid === undefined || tarjeta.uid === where.uid),
          ) ?? null,
      ),
      create: jest.fn((data: Partial<Tarjeta>): Tarjeta =>
        Object.assign(crearTarjetaMock(), data),
      ),
      save: jest.fn(async (tarjeta: Tarjeta): Promise<Tarjeta> => {
        if (!tarjeta.id) {
          tarjeta.id = String(tarjetas.length + 1);
        }

        if (!tarjetas.some((existente) => existente.id === tarjeta.id)) {
          tarjetas.push(tarjeta);
        }

        return tarjeta;
      }),
      find: jest.fn(async (): Promise<Tarjeta[]> => [...tarjetas]),
      remove: jest.fn(async (tarjeta: Tarjeta): Promise<Tarjeta> => {
        const index = tarjetas.findIndex(
          (existente) => existente.id === tarjeta.id,
        );
        if (index >= 0) {
          tarjetas.splice(index, 1);
        }
        return tarjeta;
      }),
    };

    moduleFixture = await Test.createTestingModule({
      providers: [
        TarjetasService,
        {
          provide: getRepositoryToken(Tarjeta),
          useValue: repositorioEnMemoria,
        },
      ],
    }).compile();
    service = moduleFixture.get(TarjetasService);
  });

  afterEach(async () => {
    await moduleFixture.close();
  });

  it('registra, consulta y bloquea una tarjeta usando persistencia simulada', async () => {
    const registrada = await service.crear({
      uid: ' 04a1b2c3 ',
      observaciones: ' tarjeta simulada ',
    });
    expect(registrada.uid).toBe('04A1B2C3');
    expect(tarjetas).toHaveLength(1);

    const consultada = await service.obtenerPorUid('04a1b2c3');
    expect(consultada.id).toBe(registrada.id);

    const bloqueada = await service.bloquear(consultada.id);
    expect(bloqueada.estado).toBe('BLOQUEADA');
    expect((await service.obtenerPorUid('04A1B2C3')).estado).toBe('BLOQUEADA');
  });
});
