import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';

@Entity('periodos_academicos')
export class Periodo {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin: Date;

  @Column({ type: 'enum', enum: ['PLANIFICADO', 'ACTIVO', 'CERRADO', 'CANCELADO'], default: 'PLANIFICADO' })
  estado: string;

  @OneToMany('Grupo', 'periodo')
  grupos: any[];
}
