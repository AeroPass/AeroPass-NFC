import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
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
  fechaNacimiento: string | null;

  @Column({ type: 'enum', enum: ['ACTIVA', 'INACTIVA'], default: 'ACTIVA' })
  estado: 'ACTIVA' | 'INACTIVA';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne('TipoDocumento', 'personas', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tipo_documento_id' })
  tipoDocumento: any;

  @OneToOne('Usuario', 'persona')
  usuario: any;

  @OneToOne('Docente', 'persona')
  docente: any;

  @OneToOne('Estudiante', 'persona')
  estudiante: any;
}
