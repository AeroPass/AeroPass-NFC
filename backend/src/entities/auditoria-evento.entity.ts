import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Entidad de la tabla `auditoria_eventos` (ya existe en el esquema SQL).
 * Registra trazabilidad de acciones sensibles: LOGIN, ACCESS_DENIED, etc.
 */
@Entity('auditoria_eventos')
export class AuditoriaEvento {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'usuario_id', type: 'bigint', unsigned: true, nullable: true })
  usuarioId: number | null;

  @Column({ name: 'dispositivo_id', type: 'bigint', unsigned: true, nullable: true })
  dispositivoId: number | null;

  @Column({
    type: 'enum',
    enum: [
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'ACCESS_DENIED',
      'NFC_SCAN',
      'CONFIG_CHANGE',
    ],
  })
  accion: string;

  @Column({ type: 'varchar', length: 80 })
  entidad: string;

  @Column({ name: 'entidad_id', type: 'varchar', length: 80, nullable: true })
  entidadId: string | null;

  @Column({ name: 'fecha_hora', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechaHora: Date;

  @Column({ name: 'direccion_ip', type: 'varchar', length: 45, nullable: true })
  direccionIp: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  resultado: string | null;

  @Column({ name: 'datos_antes', type: 'json', nullable: true })
  datosAntes: Record<string, any> | null;

  @Column({ name: 'datos_despues', type: 'json', nullable: true })
  datosDespues: Record<string, any> | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  detalle: string | null;
}
