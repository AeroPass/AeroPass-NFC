import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('docentes')
export class Docente {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'persona_id', type: 'bigint', unsigned: true, unique: true })
  personaId: number;

  @Column({ name: 'codigo_docente', type: 'varchar', length: 50, unique: true })
  codigoDocente: string;

  @Column({ type: 'enum', enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
  estado: string;

  @OneToOne('Persona', 'docente', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'persona_id' })
  persona: any;

  @OneToMany('AsignacionDocente', 'docente')
  asignaciones: any[];
}
