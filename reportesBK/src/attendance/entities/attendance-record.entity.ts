import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AttendanceMethod } from '../enums/attendance-method.enum';
import { AttendanceStatus } from '../enums/attendance-status.enum';
import { AttendanceSession } from './attendance-session.entity';

@Entity('attendance_records')
@Unique(['sessionId', 'studentId'])
export class AttendanceRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: number;

  @Column()
  studentId: number;

  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Column({ type: 'enum', enum: AttendanceMethod, default: AttendanceMethod.MANUAL })
  method: AttendanceMethod;

  @Column({ nullable: true, length: 500 })
  note: string | null;

  @CreateDateColumn()
  recordedAt: Date;

  @ManyToOne(() => AttendanceSession, (session) => session.records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: AttendanceSession;
}
