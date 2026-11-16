import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Asistencia } from '../src/attendance/entities/asistencia.entity';
import { ReportesController } from '../src/reportes/reportes.controller';
import {
  ReporteAsistencia,
  ReportesService,
} from '../src/reportes/reportes.service';

describe('Reportes de asistencia (integración)', () => {
  let app: INestApplication;

  const registros: ReporteAsistencia[] = [
    {
      asistencia_id: 17,
      fecha_clase: '2026-10-15',
      hora_registro: '08:05:00',
      resultado: 'ASISTENCIA',
      fuente: 'NFC',
      observaciones: null,
      estudiante_id: 7,
      codigo_estudiante: 'EST-007',
      estudiante: 'Ada Lovelace',
      docente_id: 4,
      docente: 'Grace Hopper',
      materia_id: 5,
      materia_codigo: 'MAT-005',
      materia: 'Matemáticas',
      grupo_id: 6,
      grupo_codigo: 'G-06',
      carrera: 'Ingeniería',
      semestre: '2026-2',
      salon_codigo: 'A-101',
    },
  ];

  const consulta = {
    clone: jest.fn(),
    select: jest.fn(),
    addSelect: jest.fn(),
    innerJoin: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    offset: jest.fn(),
    limit: jest.fn(),
    getRawOne: jest.fn().mockResolvedValue({ total: '1' }),
    getRawMany: jest.fn().mockResolvedValue(registros),
  };

  beforeAll(async () => {
    for (const metodo of [
      'select',
      'addSelect',
      'innerJoin',
      'andWhere',
      'orderBy',
      'addOrderBy',
      'offset',
      'limit',
    ] as const) {
      consulta[metodo].mockImplementation(() => consulta);
    }
    consulta.clone.mockReturnValue(consulta);

    const moduleFixture = await Test.createTestingModule({
      controllers: [ReportesController],
      providers: [
        ReportesService,
        {
          provide: getRepositoryToken(Asistencia),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(consulta),
          },
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

  it('sirve el detalle filtrado y paginado por HTTP', async () => {
    const url = new URL('/reportes/asistencia', await app.getUrl());
    url.search = new URLSearchParams({
      desde: '2026-10-01',
      docenteId: '4',
      resultado: 'ASISTENCIA',
      pagina: '2',
      limite: '10',
    }).toString();

    const response = await fetch(url);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      registros,
      total: 1,
      pagina: 2,
      limite: 10,
    });
    expect(consulta.andWhere).toHaveBeenCalledWith(
      'asistencia.fecha_clase >= :desde',
      { desde: '2026-10-01' },
    );
    expect(consulta.andWhere).toHaveBeenCalledWith('docente.id = :docenteId', {
      docenteId: 4,
    });
    expect(consulta.andWhere).toHaveBeenCalledWith(
      'asistencia.resultado = :resultado',
      { resultado: 'ASISTENCIA' },
    );
    expect(consulta.offset).toHaveBeenCalledWith(10);
    expect(consulta.limit).toHaveBeenCalledWith(10);
  });
});
