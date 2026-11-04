import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { CrearTarjetaDto } from '../../src/tarjetas/dto/crear-tarjeta.dto';
import { CambiarEstadoTarjetaDto } from '../../src/tarjetas/dto/cambiar-estado-tarjeta.dto';
import { EstadoTarjeta, Tarjeta } from '../../src/tarjetas/entities/tarjeta.entity';
import { TarjetasService } from '../../src/tarjetas/tarjetas.service';
import { crearRepositorioMock, crearTarjetaMock } from './tarjetas.mocks';

describe('TarjetasService - pruebas unitarias', () => {
  let service: TarjetasService;
  let repositorio: ReturnType<typeof crearRepositorioMock>;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    repositorio = crearRepositorioMock();
    moduleFixture = await Test.createTestingModule({
      providers: [
        TarjetasService,
        {
          provide: getRepositoryToken(Tarjeta),
          useValue: repositorio,
        },
      ],
    }).compile();
    service = moduleFixture.get(TarjetasService);
  });

  afterEach(async () => {
    await moduleFixture.close();
  });

  it('registra una tarjeta válida normalizando el UID y las observaciones', async () => {
    const tarjeta = await service.crear({
      uid: ' 04a1b2c3 ',
      observaciones: '  tarjeta de prueba  ',
    });

    expect(tarjeta.uid).toBe('04A1B2C3');
    expect(tarjeta.estado).toBe(EstadoTarjeta.ACTIVA);
    expect(tarjeta.observaciones).toBe('tarjeta de prueba');
    expect(repositorio.save).toHaveBeenCalledWith(tarjeta);
  });

  it('rechaza una tarjeta cuyo UID ya está registrado', async () => {
    repositorio.findOne.mockResolvedValue(crearTarjetaMock());

    await expect(
      service.crear({ uid: '04A1B2C3' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repositorio.save).not.toHaveBeenCalled();
  });

  it('informa que no existe una tarjeta buscada por un UID no registrado', async () => {
    await expect(service.obtenerPorUid('FFFFFFFF')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('bloquea y luego reactiva una tarjeta existente', async () => {
    const tarjeta = crearTarjetaMock();
    repositorio.findOne.mockResolvedValue(tarjeta);

    const bloqueada = await service.bloquear(tarjeta.id);
    expect(bloqueada.estado).toBe(EstadoTarjeta.BLOQUEADA);

    const reactivada = await service.reactivar(tarjeta.id);
    expect(reactivada.estado).toBe(EstadoTarjeta.ACTIVA);
    expect(repositorio.save).toHaveBeenCalledTimes(2);
  });

  it('acepta datos válidos y rechaza UID y estado con formato no permitido', async () => {
    const tarjetaValida = Object.assign(new CrearTarjetaDto(), {
      uid: '04A1B2C3',
    });
    const tarjetaInvalida = Object.assign(new CrearTarjetaDto(), {
      uid: 'G123',
    });
    const estadoValido = Object.assign(new CambiarEstadoTarjetaDto(), {
      estado: EstadoTarjeta.INACTIVA,
    });
    const estadoInvalido = Object.assign(new CambiarEstadoTarjetaDto(), {
      estado: 'DESCONOCIDA',
    });

    expect(await validate(tarjetaValida)).toHaveLength(0);
    expect(await validate(estadoValido)).toHaveLength(0);
    expect(await validate(tarjetaInvalida)).not.toHaveLength(0);
    expect(await validate(estadoInvalido)).not.toHaveLength(0);
  });
});
