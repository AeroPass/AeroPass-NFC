import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('auditoria_eventos')
export class Auditoria {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id!: string;

  @Column({
    name: 'usuario_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  usuarioId!: string | null;

  @Column({
    name: 'dispositivo_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  dispositivoId!: string | null;

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
  accion!: string;

  @Column({
    type: 'varchar',
    length: 80,
  })
  entidad!: string;

  @Column({
    name: 'entidad_id',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  entidadId!: string | null;

  @CreateDateColumn({
    name: 'fecha_hora',
    type: 'datetime',
  })
  fechaHora!: Date;

  @Column({
    name: 'direccion_ip',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  direccionIp!: string | null;

  @Column({
    name: 'user_agent',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  userAgent!: string | null;

  @Column({
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  resultado!: string | null;

  @Column({
    name: 'datos_antes',
    type: 'json',
    nullable: true,
  })
  datosAntes!: object | null;

  @Column({
    name: 'datos_despues',
    type: 'json',
    nullable: true,
  })
  datosDespues!: object | null;

  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  detalle!: string | null;
}