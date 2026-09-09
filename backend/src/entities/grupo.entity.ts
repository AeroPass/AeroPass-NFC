import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  OneToMany,
} from 'typeorm';

@Entity('grupos')
@Unique('uq_grupo_periodo_codigo', ['periodoId', 'codigo'])
export class Grupo {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'carrera_id', type: 'bigint', unsigned: true })
  carreraId: number;

  @Column({ name: 'semestre_id', type: 'smallint', unsigned: true })
  semestreId: number;

  @Column({ name: 'periodo_id', type: 'bigint', unsigned: true })
  periodoId: number;

  @Column({ type: 'varchar', length: 30 })
  codigo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre: string | null;

  @Column({ type: 'enum', enum: ['DIURNA', 'NOCTURNA', 'MIXTA'], nullable: true })
  jornada: string | null;

  @Column({ type: 'enum', enum: ['PRESENCIAL', 'VIRTUAL', 'HIBRIDA'], default: 'PRESENCIAL' })
  modalidad: string;

  @Column({ type: 'enum', enum: ['ACTIVO', 'INACTIVO', 'CERRADO'], default: 'ACTIVO' })
  estado: string;

  @ManyToOne('Carrera', 'grupos', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'carrera_id' })
  carrera: any;

  @ManyToOne('Semestre', 'grupos', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'semestre_id' })
  semestre: any;

  @ManyToOne('Periodo', 'grupos', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'periodo_id' })
  periodo: any;

  @OneToMany('MatriculaGrupo', 'grupo')
  matriculas: any[];

  @OneToMany('AsignacionDocente', 'grupo')
  asignaciones: any[];
}
