import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('asistencias')
export class Asistencia {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'estudiante_id', type: 'bigint', unsigned: true })
  estudianteId: number;

  @Column({ name: 'horario_id', type: 'bigint', unsigned: true })
  horarioId: number;

  @Column({ name: 'fecha_clase', type: 'date' })
  fechaClase: string;

  @Column({ name: 'hora_registro', type: 'datetime' })
  horaRegistro: Date;

  @Column({
    name: 'resultado',
    type: 'enum',
    enum: ['ASISTENCIA', 'TARDANZA', 'JUSTIFICADA', 'ANULADA'],
  })
  resultado: string;

  @Column({
    name: 'fuente',
    type: 'enum',
    enum: ['NFC', 'MANUAL', 'IMPORTACION'],
  })
  fuente: string;

  @Column({
    name: 'tarjeta_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  tarjetaId: number | null;

  @Column({
    name: 'dispositivo_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  dispositivoId: number | null;

  @Column({
    name: 'observaciones',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  observaciones: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
