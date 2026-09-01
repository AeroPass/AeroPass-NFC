import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
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
  fechaIngreso: Date | null;

  @Column({ type: 'enum', enum: ['ACTIVO', 'INACTIVO', 'EGRESADO', 'RETIRADO'], default: 'ACTIVO' })
  estado: string;

  @OneToOne('Persona', 'estudiante', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'persona_id' })
  persona: any;
}
