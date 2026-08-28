import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { CourseSubject } from '../academic/entities/course-subject.entity';
import { Enrollment } from '../academic/entities/enrollment.entity';
import { AttendanceMethod } from './enums/attendance-method.enum';
import { SessionStatus } from './enums/session-status.enum';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { AttendanceSession } from './entities/attendance-session.entity';
import { CreateAttendanceRecordDto } from './dto/create-attendance-record.dto';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { UpdateAttendanceRecordDto } from './dto/update-attendance-record.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceSession) private readonly sessions: Repository<AttendanceSession>,
    @InjectRepository(AttendanceRecord) private readonly records: Repository<AttendanceRecord>,
    @InjectRepository(CourseSubject) private readonly assignments: Repository<CourseSubject>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
  ) {}

  async createSession(dto: CreateAttendanceSessionDto, userId: number, role: Role) {
    const assignment = await this.findAssignment(dto.courseSubjectId, userId, role);
    const session = this.sessions.create({
      courseSubjectId: assignment.id,
      teacherId: assignment.teacherId,
      sessionDate: dto.sessionDate,
      status: SessionStatus.OPEN,
      closedAt: null,
    });
    return this.sessions.save(session);
  }

  async listSessions(query: AttendanceQueryDto, userId: number, role: Role) {
    const builder = this.sessions.createQueryBuilder('session');
    if (role === Role.TEACHER) builder.andWhere('session.teacherId = :userId', { userId });
    if (query.courseSubjectId) builder.andWhere('session.courseSubjectId = :courseSubjectId', { courseSubjectId: query.courseSubjectId });
    if (query.from) builder.andWhere('session.sessionDate >= :from', { from: query.from });
    if (query.to) builder.andWhere('session.sessionDate <= :to', { to: query.to });
    const [items, total] = await builder
      .orderBy('session.sessionDate', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return { items, total, page: query.page, limit: query.limit };
  }

  async getSession(id: number, userId: number, role: Role) {
    const session = await this.sessions.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Attendance session not found');
    if (role === Role.TEACHER && session.teacherId !== userId) throw new ForbiddenException();
    return session;
  }

  async closeSession(id: number, userId: number, role: Role) {
    const session = await this.getSession(id, userId, role);
    if (session.status === SessionStatus.CLOSED) return session;
    session.status = SessionStatus.CLOSED;
    session.closedAt = new Date();
    return this.sessions.save(session);
  }

  async listRecords(sessionId: number, userId: number, role: Role) {
    await this.getSession(sessionId, userId, role);
    return this.records.find({
      where: { sessionId },
      order: { studentId: 'ASC' },
    });
  }

  async addRecord(sessionId: number, dto: CreateAttendanceRecordDto, userId: number, role: Role) {
    const session = await this.getSession(sessionId, userId, role);
    if (session.status === SessionStatus.CLOSED) throw new ConflictException('Attendance session is closed');
    const enrolled = await this.enrollments.exists({ where: { courseSubjectId: session.courseSubjectId, studentId: dto.studentId } });
    if (!enrolled) throw new ConflictException('Student is not enrolled in this course');
    const existing = await this.records.findOne({ where: { sessionId, studentId: dto.studentId } });
    if (existing) throw new ConflictException('Student already has attendance for this session');
    return this.records.save(this.records.create({
      sessionId,
      studentId: dto.studentId,
      status: dto.status,
      method: dto.method ?? AttendanceMethod.MANUAL,
      note: dto.note ?? null,
    }));
  }

  async updateRecord(id: number, dto: UpdateAttendanceRecordDto, userId: number, role: Role) {
    const record = await this.records.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');
    const session = await this.getSession(record.sessionId, userId, role);
    if (session.status === SessionStatus.CLOSED) throw new ConflictException('Attendance session is closed');
    Object.assign(record, dto);
    return this.records.save(record);
  }

  private async findAssignment(id: number, userId: number, role: Role) {
    const where = role === Role.ADMIN ? { id } : { id, teacherId: userId };
    const assignment = await this.assignments.findOne({ where });
    if (!assignment) throw new ForbiddenException('Course subject is not assigned to this teacher');
    return assignment;
  }
}
