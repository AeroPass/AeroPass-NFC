import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';

@Injectable()
export class ReportsService {
  constructor(@InjectRepository(AttendanceRecord) private readonly records: Repository<AttendanceRecord>) {}

  async detail(query: AttendanceReportQueryDto) {
    const builder = this.baseQuery(query);
    const [items, total] = await builder
      .orderBy('session.sessionDate', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return { items, total, page: query.page, limit: query.limit };
  }

  async summary(query: AttendanceReportQueryDto) {
    const builder = this.records.createQueryBuilder('record')
      .innerJoin('record.session', 'session')
      .select('COUNT(record.id)', 'total')
      .addSelect("SUM(record.status = 'PRESENT')", 'present')
      .addSelect("SUM(record.status = 'LATE')", 'late')
      .addSelect("SUM(record.status = 'ABSENT')", 'absent')
      .addSelect("SUM(record.status = 'JUSTIFIED')", 'justified');
    this.applyFilters(builder, query);
    const row = await builder.getRawOne<Record<string, string>>();
    const total = Number(row?.total ?? 0);
    const present = Number(row?.present ?? 0);
    return { ...row, attendancePercentage: total ? Number(((present / total) * 100).toFixed(2)) : 0 };
  }

  private baseQuery(query: AttendanceReportQueryDto) {
    const builder = this.records.createQueryBuilder('record').innerJoinAndSelect('record.session', 'session');
    this.applyFilters(builder, query);
    return builder;
  }

  private applyFilters(builder: SelectQueryBuilder<AttendanceRecord>, query: AttendanceReportQueryDto) {
    if (query.from) builder.andWhere('session.sessionDate >= :from', { from: query.from });
    if (query.to) builder.andWhere('session.sessionDate <= :to', { to: query.to });
    if (query.courseSubjectId) builder.andWhere('session.courseSubjectId = :courseSubjectId', { courseSubjectId: query.courseSubjectId });
    if (query.teacherId) builder.andWhere('session.teacherId = :teacherId', { teacherId: query.teacherId });
    if (query.studentId) builder.andWhere('record.studentId = :studentId', { studentId: query.studentId });
    if (query.status) builder.andWhere('record.status = :status', { status: query.status });
  }
}
