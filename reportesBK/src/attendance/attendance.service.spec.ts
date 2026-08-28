import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceMethod } from './enums/attendance-method.enum';
import { AttendanceStatus } from './enums/attendance-status.enum';
import { SessionStatus } from './enums/session-status.enum';
import { Role } from '../common/enums/role.enum';

describe('AttendanceService', () => {
  const sessions = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const records = { create: jest.fn(), save: jest.fn(), findOne: jest.fn() };
  const assignments = { findOne: jest.fn() };
  const enrollments = { exists: jest.fn() };
  let service: AttendanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AttendanceService(sessions as never, records as never, assignments as never, enrollments as never);
  });

  it('creates a manual attendance record for an enrolled student', async () => {
    const session = { id: 10, courseSubjectId: 4, teacherId: 7, status: SessionStatus.OPEN };
    assignments.findOne.mockResolvedValue({ id: 4, teacherId: 7 });
    sessions.create.mockReturnValue(session);
    sessions.save.mockResolvedValue(session);
    sessions.findOne.mockResolvedValue(session);
    enrollments.exists.mockResolvedValue(true);
    records.findOne.mockResolvedValue(null);
    records.create.mockReturnValue({ sessionId: 10, studentId: 3 });
    records.save.mockResolvedValue({ id: 1 });
    await service.createSession({ courseSubjectId: 4, sessionDate: '2026-08-27' }, 7, Role.TEACHER);
    const result = await service.addRecord(10, { studentId: 3, status: AttendanceStatus.PRESENT }, 7, Role.TEACHER);
    expect(result).toEqual({ id: 1 });
    expect(records.create).toHaveBeenCalledWith(expect.objectContaining({ method: AttendanceMethod.MANUAL }));
  });

  it('rejects a teacher accessing another teacher assignment', async () => {
    assignments.findOne.mockResolvedValue(null);
    await expect(service.createSession({ courseSubjectId: 4, sessionDate: '2026-08-27' }, 9, Role.TEACHER))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicate attendance and records in a closed session', async () => {
    sessions.findOne.mockResolvedValue({ id: 10, courseSubjectId: 4, teacherId: 7, status: SessionStatus.CLOSED });
    await expect(service.addRecord(10, { studentId: 3, status: AttendanceStatus.PRESENT }, 7, Role.TEACHER))
      .rejects.toBeInstanceOf(ConflictException);
  });
});
