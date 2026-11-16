import { DataSource } from 'typeorm';
import { GestionAcademicaService } from './gestion-academica.service';
import { SincronizacionAcademicaService } from './sincronizacion-academica.service';

describe('Gestión académica - pruebas unitarias', () => {
  function crearServicioSincronizacion(
    filasPorTabla: Record<string, unknown[]> = {},
  ) {
    const origen = {
      isInitialized: true,
      query: jest.fn(async (consulta: string) => {
        const tabla = consulta.split(' FROM ')[1];
        return filasPorTabla[tabla] ?? [];
      }),
    };
    const queryRunner = {
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

    return {
      servicio: new SincronizacionAcademicaService(
        destino as unknown as DataSource,
        origen as unknown as DataSource,
      ),
      origen,
      destino,
      queryRunner,
    };
  }

  it('devuelve el mensaje de disponibilidad del módulo', () => {
    const servicio = new GestionAcademicaService();

    expect(servicio.getHello()).toBe('Hello Gestion Academica!');
  });

  it('sincroniza los datos maestros y confirma la transacción', async () => {
    const { servicio, origen, queryRunner } = crearServicioSincronizacion({
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
    });

    await expect(servicio.sincronizarDatosMaestros()).resolves.toMatchObject({
      registrosProcesados: {
        tiposDocumento: 1,
        carreras: 1,
        semestres: 1,
        periodosAcademicos: 1,
        materias: 1,
        salones: 1,
      },
    });

    expect(origen.query).toHaveBeenCalledTimes(6);
    expect(queryRunner.connect).toHaveBeenCalledTimes(1);
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.query).toHaveBeenCalledTimes(6);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('revierte y libera la transacción si falla una escritura, y permite reintentar', async () => {
    const { servicio, queryRunner } = crearServicioSincronizacion({
      tipos_documento: [{ codigo: 'CC', nombre: 'Cédula', activo: 1 }],
    });
    queryRunner.query.mockRejectedValueOnce(new Error('fallo de escritura'));

    await expect(servicio.sincronizarDatosMaestros()).rejects.toThrow(
      'fallo de escritura',
    );

    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);

    await expect(servicio.sincronizarDatosMaestros()).resolves.toMatchObject({
      registrosProcesados: { tiposDocumento: 1 },
    });
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(2);
  });

  it('rechaza una segunda sincronización mientras la primera sigue en curso', async () => {
    let resolverConsulta!: (filas: unknown[]) => void;
    const consultaPendiente = new Promise<unknown[]>((resolve) => {
      resolverConsulta = resolve;
    });
    const { servicio, origen } = crearServicioSincronizacion();
    origen.query.mockReturnValue(consultaPendiente);

    const primeraSincronizacion = servicio.sincronizarDatosMaestros();
    await expect(servicio.sincronizarDatosMaestros()).rejects.toThrow(
      'Ya existe una sincronización académica en ejecución.',
    );

    resolverConsulta([]);
    await expect(primeraSincronizacion).resolves.toMatchObject({
      registrosProcesados: {
        tiposDocumento: 0,
        carreras: 0,
        semestres: 0,
        periodosAcademicos: 0,
        materias: 0,
        salones: 0,
      },
    });
  });
});
