import { ReportsService } from './reports.service';
import { AttendanceStatus } from '../attendance/enums/attendance-status.enum';

describe('ReportsService', () => {
  it('calculates the attendance percentage from aggregated records', async () => {
    const builder = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '4', present: '3', late: '1', absent: '0', justified: '0' }),
    };
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(builder) };
    const service = new ReportsService(repository as never);
    const result = await service.summary({ status: AttendanceStatus.PRESENT, page: 1, limit: 100 });
    expect(result.attendancePercentage).toBe(75);
    expect(builder.andWhere).toHaveBeenCalledWith('record.status = :status', { status: AttendanceStatus.PRESENT });
  });
});
