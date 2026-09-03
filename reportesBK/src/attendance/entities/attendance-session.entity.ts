import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AttendanceRecord } from './attendance-record.entity';
import { SessionStatus } from '../enums/session-status.enum';

@Entity('sesiones_asistencia')
export class AttendanceSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'curso_materia_id' })
  courseSubjectId: number;

  @Column({ name: 'docente_id' })
  teacherId: number;

  @Column({ name: 'fecha_sesion', type: 'date' })
  sessionDate: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.OPEN,
  })
  status: SessionStatus;

  @Column({ name: 'cerrada_en', type: 'datetime', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'creada_en' })
  createdAt: Date;

  @OneToMany(() => AttendanceRecord, (record) => record.session)
  records: AttendanceRecord[];
}
