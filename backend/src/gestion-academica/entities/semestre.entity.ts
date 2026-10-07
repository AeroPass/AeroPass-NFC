import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('semestres')
export class Semestre {
  @PrimaryGeneratedColumn({ type: 'smallint', unsigned: true })
  id: number;

  @Column({ type: 'tinyint', unsigned: true, unique: true })
  numero: number;

  @Column({ type: 'varchar', length: 60, unique: true })
  nombre: string;

  @Column({ type: 'enum', enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
  estado: 'ACTIVO' | 'INACTIVO';

  @OneToMany('Grupo', 'semestre')
  grupos: any[];
}
