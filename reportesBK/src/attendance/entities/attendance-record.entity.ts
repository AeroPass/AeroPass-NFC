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

@Entity('registros_asistencia')
@Unique(['sessionId', 'studentId'])
export class AttendanceRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sesion_id' })
  sessionId: number;

  @Column({ name: 'estudiante_id' })
  studentId: number;

  @Column({ name: 'estado', type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Column({
    name: 'metodo',
    type: 'enum',
    enum: AttendanceMethod,
    default: AttendanceMethod.MANUAL,
  })
  method: AttendanceMethod;

  @Column({ name: 'observacion', type: 'varchar', length: 500, nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'registrada_en' })
  recordedAt: Date;

  @ManyToOne(() => AttendanceSession, (session) => session.records, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sesion_id' })
  session: AttendanceSession;
}
