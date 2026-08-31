// src/tarjetas/entities/tarjeta.entity.ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum EstadoTarjeta {
  ACTIVA = 'ACTIVA',
  BLOQUEADA = 'BLOQUEADA',
  INACTIVA = 'INACTIVA',
}

@Entity('tarjetas_nfc')
export class Tarjeta {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  uid!: string;

  @Column({ type: 'enum', enum: EstadoTarjeta, default: EstadoTarjeta.ACTIVA })
  estado!: EstadoTarjeta;

  @Column({ name: 'fecha_emision', type: 'date', nullable: true })
  fechaEmision!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observaciones!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  // Nuevo campo opcional: dispositivo_id para auditoría
  @Column({ name: 'dispositivo_id', type: 'varchar', length: 100, nullable: true })
  dispositivoId!: string | null;
}