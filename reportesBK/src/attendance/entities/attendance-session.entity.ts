import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AttendanceRecord } from './attendance-record.entity';
import { SessionStatus } from '../enums/session-status.enum';

@Entity('attendance_sessions')
export class AttendanceSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  courseSubjectId: number;

  @Column()
  teacherId: number;

  @Column({ type: 'date' })
  sessionDate: string;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.OPEN })
  status: SessionStatus;

  @Column({ type: 'datetime', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => AttendanceRecord, (record) => record.session)
  records: AttendanceRecord[];
}
