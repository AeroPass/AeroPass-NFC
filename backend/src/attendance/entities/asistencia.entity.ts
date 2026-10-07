import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('asistencias')
@Unique('uq_asistencia_estudiante_horario_fecha', ['estudianteId', 'horarioId', 'fechaClase'])
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

  @Column({ name: 'resultado', type: 'enum', enum: ['ASISTENCIA', 'TARDANZA', 'JUSTIFICADA', 'ANULADA'], default: 'ASISTENCIA' })
  resultado: 'ASISTENCIA' | 'TARDANZA' | 'JUSTIFICADA' | 'ANULADA';

  @Column({ name: 'fuente', type: 'enum', enum: ['NFC', 'MANUAL', 'IMPORTACION'], default: 'NFC' })
  fuente: 'NFC' | 'MANUAL' | 'IMPORTACION';

  @Column({ name: 'tarjeta_id', type: 'bigint', unsigned: true, nullable: true })
  tarjetaId: number | null;

  @Column({ name: 'dispositivo_id', type: 'bigint', unsigned: true, nullable: true })
  dispositivoId: number | null;

  @Column({ name: 'observaciones', type: 'varchar', length: 255, nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
