import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Entity('asignaciones_docente')
@Unique('uq_asig_docente_materia_grupo', ['docenteId', 'materiaId', 'grupoId'])
export class AsignacionDocente {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'docente_id', type: 'bigint', unsigned: true })
  docenteId: number;

  @Column({ name: 'materia_id', type: 'bigint', unsigned: true })
  materiaId: number;

  @Column({ name: 'grupo_id', type: 'bigint', unsigned: true })
  grupoId: number;

  @Column({ type: 'enum', enum: ['ACTIVA', 'INACTIVA', 'FINALIZADA'], default: 'ACTIVA' })
  estado: string;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio: Date | null;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observaciones: string | null;

  @ManyToOne('Docente', 'asignaciones', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'docente_id' })
  docente: any;

  @ManyToOne('Materia', 'asignaciones', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'materia_id' })
  materia: any;

  @ManyToOne('Grupo', 'asignaciones', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'grupo_id' })
  grupo: any;
}
