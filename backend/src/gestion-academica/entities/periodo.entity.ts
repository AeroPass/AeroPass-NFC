import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('periodos_academicos')
export class Periodo {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: string;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin: string;

  @Column({ type: 'enum', enum: ['PLANIFICADO', 'ACTIVO', 'CERRADO', 'CANCELADO'], default: 'PLANIFICADO' })
  estado: 'PLANIFICADO' | 'ACTIVO' | 'CERRADO' | 'CANCELADO';

  @OneToMany('Grupo', 'periodo')
  grupos: any[];
}
