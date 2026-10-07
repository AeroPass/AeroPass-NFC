import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('salones')
export class Salon {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 40, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  edificio: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  piso: string | null;

  @Column({ type: 'smallint', unsigned: true, nullable: true })
  capacidad: number | null;

  @Column({ type: 'enum', enum: ['DISPONIBLE', 'INACTIVO', 'MANTENIMIENTO'], default: 'DISPONIBLE' })
  estado: 'DISPONIBLE' | 'INACTIVO' | 'MANTENIMIENTO';

  @OneToMany('Horario', 'salon')
  horarios: any[];
}
