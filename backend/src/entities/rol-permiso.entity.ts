import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('rol_permiso')
export class RolPermiso {
  @PrimaryColumn({ name: 'rol_id', type: 'smallint', unsigned: true })
  rolId: number;

  @PrimaryColumn({ name: 'permiso_id', type: 'smallint', unsigned: true })
  permisoId: number;

  @ManyToOne('Rol', 'rolPermisos', { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol: any;

  @ManyToOne('Permiso', 'rolPermisos', { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'permiso_id' })
  permiso: any;
}
