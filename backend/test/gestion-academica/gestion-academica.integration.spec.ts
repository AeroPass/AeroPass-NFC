import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GestionAcademicaController } from '../../src/gestion-academica/gestion-academica.controller';
import { GestionAcademicaService } from '../../src/gestion-academica/gestion-academica.service';
import { SincronizacionAcademicaService } from '../../src/gestion-academica/sincronizacion-academica.service';

describe('Gestión académica - prueba de integración', () => {
  let app: INestApplication;
  let origen: {
    isInitialized: boolean;
    query: jest.Mock;
    destroy: jest.Mock;
  };
  let queryRunner: {
    isTransactionActive: boolean;
    connect: jest.Mock;
    startTransaction: jest.Mock;
    query: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
  };

  beforeAll(async () => {
    const filasPorTabla: Record<string, unknown[]> = {
      tipos_documento: [{ codigo: 'CC', nombre: 'Cédula', activo: 1 }],
      carreras: [{ codigo: 'ING', nombre: 'Ingeniería', estado: 'ACTIVA' }],
      semestres: [{ numero: 1, nombre: 'Primero', estado: 'ACTIVO' }],
      periodos_academicos: [
        {
          codigo: '2026-1',
          nombre: '2026-I',
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-06-30',
          estado: 'ACTIVO',
        },
      ],
      materias: [
        {
          codigo: 'MAT-1',
          nombre: 'Matemáticas',
          creditos: 4,
          horas_semanales: '4.0',
          estado: 'ACTIVA',
        },
      ],
      salones: [
        {
          codigo: 'A-101',
          nombre: 'Salón 101',
          edificio: null,
          piso: null,
          capacidad: 30,
          estado: 'DISPONIBLE',
        },
      ],
    };
    origen = {
      isInitialized: true,
      query: jest.fn(async (consulta: string) => {
        const tabla = consulta.split(' FROM ')[1];
        return filasPorTabla[tabla] ?? [];
      }),
      destroy: jest.fn().mockResolvedValue(undefined),
    };
    queryRunner = {
      isTransactionActive: true,
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };
    const destino = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    const moduleFixture = await Test.createTestingModule({
      controllers: [GestionAcademicaController],
      providers: [
        GestionAcademicaService,
        SincronizacionAcademicaService,
        {
          provide: getDataSourceToken(),
          useValue: destino as unknown as DataSource,
        },
        {
          provide: getDataSourceToken('SIGEDIN'),
          useValue: origen as unknown as DataSource,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
  });

  it('sirve la disponibilidad y sincroniza los datos maestros por HTTP', async () => {
    const baseUrl = await app.getUrl();
    const disponibilidad = await fetch(`${baseUrl}/gestion-academica`);

    expect(disponibilidad.status).toBe(200);
    await expect(disponibilidad.text()).resolves.toBe(
      'Hello Gestion Academica!',
    );

    const sincronizacion = await fetch(
      `${baseUrl}/gestion-academica/sincronizacion/datos-maestros`,
      { method: 'POST' },
    );
    const resultado = await sincronizacion.json();

    expect(sincronizacion.status).toBe(201);
    expect(resultado).toEqual({
      iniciadoEn: expect.any(String),
      finalizadoEn: expect.any(String),
      registrosProcesados: {
        tiposDocumento: 1,
        carreras: 1,
        semestres: 1,
        periodosAcademicos: 1,
        materias: 1,
        salones: 1,
      },
    });
    expect(Number.isNaN(Date.parse(resultado.iniciadoEn))).toBe(false);
    expect(Number.isNaN(Date.parse(resultado.finalizadoEn))).toBe(false);
    expect(origen.query).toHaveBeenCalledTimes(6);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});
