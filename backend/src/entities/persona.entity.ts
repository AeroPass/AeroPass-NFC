import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  Index,
  Unique,
} from 'typeorm';

@Entity('personas')
@Unique('uq_persona_documento', ['tipoDocumentoId', 'documento'])
@Index('idx_personas_apellidos_nombres', ['apellidos', 'nombres'])
export class Persona {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'tipo_documento_id', type: 'smallint', unsigned: true })
  tipoDocumentoId: number;

  @Column({ type: 'varchar', length: 30 })
  documento: string;

  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos: string;

  @Column({ type: 'varchar', length: 150, nullable: true, unique: true })
  email: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: Date | null;

  @Column({ type: 'enum', enum: ['ACTIVA', 'INACTIVA'], default: 'ACTIVA' })
  estado: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne('TiposDocumento', 'personas', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  tipoDocumento: any;

  @OneToOne('Usuario', 'persona', { onDelete: 'RESTRICT' })
  usuario: any;

  @OneToOne('Docente', 'persona', { onDelete: 'RESTRICT' })
  docente: any;

  @OneToOne('Estudiante', 'persona', { onDelete: 'RESTRICT' })
  estudiante: any;
}
