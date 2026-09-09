import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Entity('matriculas_grupo')
@Unique('uq_matricula_estudiante_grupo_inicio', ['estudianteId', 'grupoId', 'fechaInicio'])
export class MatriculaGrupo {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'estudiante_id', type: 'bigint', unsigned: true })
  estudianteId: number;

  @Column({ name: 'grupo_id', type: 'bigint', unsigned: true })
  grupoId: number;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: Date | null;

  @Column({ type: 'enum', enum: ['ACTIVA', 'INACTIVA', 'RETIRADA', 'FINALIZADA'], default: 'ACTIVA' })
  estado: string;

  @ManyToOne('Estudiante', 'matriculas', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'estudiante_id' })
  estudiante: any;

  @ManyToOne('Grupo', 'matriculas', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'grupo_id' })
  grupo: any;
}
