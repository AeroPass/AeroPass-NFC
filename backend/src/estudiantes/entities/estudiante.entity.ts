import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('estudiantes')
export class Estudiante {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'persona_id', type: 'bigint', unsigned: true, unique: true })
  personaId: number;

  @Column({ name: 'codigo_estudiante', type: 'varchar', length: 50, unique: true })
  codigoEstudiante: string;

  @Column({ name: 'fecha_ingreso', type: 'date', nullable: true })
  fechaIngreso: string | null;

  @Column({ type: 'enum', enum: ['ACTIVO', 'INACTIVO', 'EGRESADO', 'RETIRADO'], default: 'ACTIVO' })
  estado: 'ACTIVO' | 'INACTIVO' | 'EGRESADO' | 'RETIRADO';

  @OneToOne('Persona', 'estudiante', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'persona_id' })
  persona: any;

  @OneToMany('MatriculaGrupo', 'estudiante')
  matriculas: any[];
}
