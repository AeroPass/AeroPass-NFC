import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseSubject } from '../academic/entities/course-subject.entity';
import { Enrollment } from '../academic/entities/enrollment.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { AttendanceSession } from './entities/attendance-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceSession, AttendanceRecord, CourseSubject, Enrollment])],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
