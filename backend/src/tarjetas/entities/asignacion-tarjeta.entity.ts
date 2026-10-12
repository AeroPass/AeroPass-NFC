import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tarjeta } from './tarjeta.entity';
import { Persona } from '../../usuarios/entities/persona.entity';

/**
 * Historial de asignación de tarjetas a personas.
 * En el modelo relacional del proyecto, estudiantes.persona_id referencia
 * personas.id; por eso personaId es la clave usada por esta tabla.
 */
@Entity('asignaciones_tarjeta')
@Index('idx_asig_persona_vigencia', ['personaId', 'fechaInicio', 'fechaFin'])
@Index('idx_asig_tarjeta_vigencia', ['tarjetaId', 'fechaInicio', 'fechaFin'])
export class AsignacionTarjeta {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'tarjeta_id', type: 'bigint', unsigned: true })
  tarjetaId!: number;

  @ManyToOne('Tarjeta', 'asignaciones', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tarjeta_id' })
  tarjeta!: Tarjeta;

  @Column({ name: 'persona_id', type: 'bigint', unsigned: true })
  personaId!: number;

  @ManyToOne('Persona', 'asignacionesTarjeta', { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'persona_id' })
  persona!: Persona;

  @Column({ name: 'fecha_inicio', type: 'datetime' })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'datetime', nullable: true })
  fechaFin!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
