import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'persona_id', type: 'bigint', unsigned: true, unique: true })
  personaId: number;

  @Column({ name: 'rol_id', type: 'smallint', unsigned: true })
  rolId: number;

  @Column({ type: 'varchar', length: 80, unique: true })
  username: string;

  // select: false => el hash NUNCA se carga en consultas normales.
  // En login() se recupera de forma explícita con .addSelect().
  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: ['ACTIVO', 'INACTIVO', 'BLOQUEADO'], default: 'ACTIVO' })
  estado: string;

  @Column({ name: 'ultimo_acceso_at', type: 'datetime', nullable: true })
  ultimoAccesoAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne('Persona', 'usuario', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'persona_id' })
  persona: any;

  @ManyToOne('Rol', 'usuarios', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol: any;
}
