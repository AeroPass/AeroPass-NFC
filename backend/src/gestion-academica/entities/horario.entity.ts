import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('horarios')
export class Horario {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'asignacion_docente_id', type: 'bigint', unsigned: true })
  asignacionDocenteId: number;

  @Column({ name: 'salon_id', type: 'bigint', unsigned: true })
  salonId: number;

  @Column({ name: 'dia_semana', type: 'tinyint', unsigned: true })
  diaSemana: number;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin: string;

  @Column({ name: 'vigencia_inicio', type: 'date' })
  vigenciaInicio: string;

  @Column({ name: 'vigencia_fin', type: 'date', nullable: true })
  vigenciaFin: string | null;

  @Column({ type: 'enum', enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
  estado: 'ACTIVO' | 'INACTIVO';

  @ManyToOne('AsignacionDocente', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'asignacion_docente_id' })
  asignacionDocente: any;

  @ManyToOne('Salon', 'horarios', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'salon_id' })
  salon: any;
}
