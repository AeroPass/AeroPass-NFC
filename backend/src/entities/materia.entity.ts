import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('materias')
export class Materia {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 40, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  creditos: number | null;

  @Column({ name: 'horas_semanales', type: 'decimal', precision: 4, scale: 1, nullable: true })
  horasSemanales: number | null;

  @Column({ type: 'enum', enum: ['ACTIVA', 'INACTIVA'], default: 'ACTIVA' })
  estado: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('AsignacionDocente', 'materia')
  asignaciones: any[];
}
