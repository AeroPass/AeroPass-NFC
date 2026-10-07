import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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
  horasSemanales: string | null;

  @Column({ type: 'enum', enum: ['ACTIVA', 'INACTIVA'], default: 'ACTIVA' })
  estado: 'ACTIVA' | 'INACTIVA';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany('AsignacionDocente', 'materia')
  asignaciones: any[];
}
