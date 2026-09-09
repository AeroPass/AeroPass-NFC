import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  it('calculates the attendance percentage from aggregated records', async () => {
    const builder = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        total: '4',
        asistencias: '3',
        tardanzas: '1',
        justificadas: '0',
        anuladas: '0',
      }),
    };
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(builder),
    };
    const service = new ReportsService(repository as never);
    const result = await service.summary({
      resultado: 'ASISTENCIA',
      pagina: 1,
      limite: 100,
    });
    expect(result.porcentajeAsistencia).toBe(75);
    expect(builder.andWhere).toHaveBeenCalledWith(
      'asistencia.resultado = :resultado',
      { resultado: 'ASISTENCIA' },
    );
  });
});
