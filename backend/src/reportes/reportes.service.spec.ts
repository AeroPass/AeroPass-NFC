import 'reflect-metadata';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Asistencia } from '../attendance/entities/asistencia.entity';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

describe('Reportes de asistencia', () => {
  function crearServicio() {
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
      getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
      getRawMany: jest.fn().mockResolvedValue([]),
    } as unknown as SelectQueryBuilder<Asistencia>;

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
      jest
        .spyOn(consulta, metodo)
        .mockImplementation(() => consulta as never);
    }
    jest.spyOn(consulta, 'clone').mockReturnValue(consulta);

    const repositorio = {
      createQueryBuilder: jest.fn().mockReturnValue(consulta),
    } as unknown as Repository<Asistencia>;
    return { servicio: new ReportesService(repositorio), consulta };
  }

  it('registra únicamente las tres rutas definitivas en español', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ReportesController)).toBe(
      'reportes/asistencia',
    );
    for (const [metodo, ruta] of [
      ['detalle', '/'],
      ['resumen', 'resumen'],
      ['exportar', 'exportar'],
    ] as const) {
      const manejador = ReportesController.prototype[metodo];
      expect(Reflect.getMetadata(PATH_METADATA, manejador)).toBe(ruta);
      expect(Reflect.getMetadata(METHOD_METADATA, manejador)).toBe(
        RequestMethod.GET,
      );
    }
  });

  it('exporta los registros con una consulta, sin contar el total', async () => {
    const { servicio, consulta } = crearServicio();

    await servicio.obtenerRegistrosParaExportar({
      pagina: 1,
      limite: 100,
    });

    expect(consulta.getRawMany).toHaveBeenCalledTimes(1);
    expect(consulta.getRawOne).not.toHaveBeenCalled();
  });

  it('calcula el resumen con una sola consulta agregada', async () => {
    const { servicio, consulta } = crearServicio();

    await servicio.obtenerResumen({
      pagina: 1,
      limite: 100,
    });

    expect(consulta.getRawOne).toHaveBeenCalledTimes(1);
    expect(consulta.getRawMany).not.toHaveBeenCalled();
  });
});
