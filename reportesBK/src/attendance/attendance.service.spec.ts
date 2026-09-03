import { ConflictException, NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

describe('AttendanceService', () => {
  const asistencias = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const dataSource = { query: jest.fn() };
  let service: AttendanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AttendanceService(asistencias as never, dataSource as never);
  });

  it('crea una asistencia manual para un estudiante matriculado', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ id: 4, grupo_id: 8 }])
      .mockResolvedValueOnce([{ id: 20 }]);
    asistencias.findOne.mockResolvedValue(null);
    asistencias.create.mockReturnValue({ estudianteId: 1 });
    asistencias.save.mockResolvedValue({ id: 10, fuente: 'MANUAL' });

    const result = await service.crear({
      estudianteId: 1,
      horarioId: 4,
      fechaClase: '2026-09-02',
    });

    expect(result).toEqual({ id: 10, fuente: 'MANUAL' });
    expect(asistencias.create).toHaveBeenCalledWith(
      expect.objectContaining({ fuente: 'MANUAL', resultado: 'ASISTENCIA' }),
    );
  });

  it('rechaza un horario inexistente o inactivo', async () => {
    dataSource.query.mockResolvedValueOnce([]);
    await expect(
      service.crear({
        estudianteId: 1,
        horarioId: 4,
        fechaClase: '2026-09-02',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza duplicados', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ id: 4, grupo_id: 8 }])
      .mockResolvedValueOnce([{ id: 20 }]);
    asistencias.findOne.mockResolvedValue({ id: 10 });
    await expect(
      service.crear({
        estudianteId: 1,
        horarioId: 4,
        fechaClase: '2026-09-02',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
