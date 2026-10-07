import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { RoleCode } from '../../common/enums/role.enum';
import { Permiso } from '../../permisos/entities/permiso.entity';
import { Rol } from '../../roles/entities/rol.entity';
import { RolPermiso } from '../../roles/entities/rol-permiso.entity';
import {
  ROLE_METADATA,
  ROLE_PERMISSION_POLICY,
  SECURITY_PERMISSION_DEFINITIONS,
} from '../policies/security-policy';

@Injectable()
export class SecurityPolicyService implements OnModuleInit {
  private readonly logger = new Logger(SecurityPolicyService.name);

  constructor(
    @InjectRepository(Rol) private readonly roleRepo: Repository<Rol>,
    @InjectRepository(Permiso) private readonly permissionRepo: Repository<Permiso>,
    @InjectRepository(RolPermiso) private readonly rolePermissionRepo: Repository<RolPermiso>,
    private readonly dataSource: DataSource,
  ) { }

  async onModuleInit(): Promise<void> {
    if (process.env.SECURITY_SYNC_ROLES_PERMISSIONS === 'false') {
      this.logger.warn('Sincronización de roles/permisos deshabilitada por configuración.');
      return;
    }

    await this.synchronizePolicy();
  }

  async synchronizePolicy(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const definition of SECURITY_PERMISSION_DEFINITIONS) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(Permiso)
          .values({
            codigo: definition[0],
            nombre: definition[1],
            modulo: definition[2],
            descripcion: definition[3],
            estado: 'ACTIVO',
          })
          .orUpdate(
            ['nombre', 'modulo', 'descripcion', 'estado'],
            ['codigo'],
          )
          .updateEntity(false)
          .execute();
      }

      const permissionRows = await manager.find(Permiso, {
        where: { codigo: In(SECURITY_PERMISSION_DEFINITIONS.map((entry) => entry[0])) },
      });
      const permissionIds = new Map(permissionRows.map((row) => [row.codigo, row.id]));

      for (const code of Object.values(RoleCode)) {
        const metadata = ROLE_METADATA[code];
        await manager
          .createQueryBuilder()
          .insert()
          .into(Rol)
          .values({
            codigo: code,
            nombre: metadata.nombre,
            descripcion: metadata.descripcion,
            estado: 'ACTIVO',
          })
          .orUpdate(['nombre', 'descripcion', 'estado'], ['codigo'])
          .updateEntity(false)
          .execute();
      }

      const roleRows = await manager.find(Rol, {
        where: { codigo: In(Object.values(RoleCode)) },
      });

      for (const role of roleRows) {
        const desiredPermissions = ROLE_PERMISSION_POLICY[role.codigo as RoleCode] ?? [];
        const desiredIds = desiredPermissions
          .map((code) => permissionIds.get(code))
          .filter((id): id is number => Number.isInteger(id));

        await manager.delete(RolPermiso, { rolId: role.id });
        if (desiredIds.length > 0) {
          await manager
            .createQueryBuilder()
            .insert()
            .into(RolPermiso)
            .values(desiredIds.map((permisoId) => ({ rolId: role.id, permisoId })))
            .orIgnore()
            .execute();
        }
      }
    });

    this.logger.log('Matriz de roles y permisos alineada con la política del sistema.');
  }
}
