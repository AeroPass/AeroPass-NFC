import { EstadoTarjeta, Tarjeta } from '../../src/tarjetas/entities/tarjeta.entity';

export function crearTarjetaMock(
  overrides: Partial<Tarjeta> = {},
): Tarjeta {
  return Object.assign(
    new Tarjeta(),
    {
      id: '1',
      uid: '04A1B2C3',
      estado: EstadoTarjeta.ACTIVA,
      fechaEmision: null,
      observaciones: null,
      createdAt: new Date('2026-01-15T00:00:00.000Z'),
      updatedAt: new Date('2026-01-15T00:00:00.000Z'),
      asignaciones: [],
    },
    overrides,
  );
}

export function crearRepositorioMock() {
  return {
    findOne: jest.fn(async (): Promise<Tarjeta | null> => null),
    create: jest.fn((data: Partial<Tarjeta>): Tarjeta =>
      Object.assign(new Tarjeta(), data),
    ),
    save: jest.fn(async (tarjeta: Tarjeta): Promise<Tarjeta> => tarjeta),
    find: jest.fn(async (): Promise<Tarjeta[]> => []),
    remove: jest.fn(async (tarjeta: Tarjeta): Promise<Tarjeta> => tarjeta),
  };
}
