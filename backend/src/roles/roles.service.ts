import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RoleCode } from '../common/enums/role.enum';
import { Permiso } from '../permisos/entities/permiso.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { Rol } from './entities/rol.entity';
import { RolPermiso } from './entities/rol-permiso.entity';
import { ROLE_METADATA, ROLE_PERMISSION_POLICY } from '../auth/policies/security-policy';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Rol) private readonly rolRepo: Repository<Rol>,
    @InjectRepository(RolPermiso) private readonly rolPermisoRepo: Repository<RolPermiso>,
    @InjectRepository(Permiso) private readonly permisoRepo: Repository<Permiso>,
  ) {}

  async findAll() {
    const roles = await this.rolRepo.find({
      where: { codigo: In(Object.values(RoleCode)) },
      relations: { rolPermisos: { permiso: true } },
      order: { id: 'ASC' },
    });

    return roles.map((role) => this.toResponse(role));
  }

  async findOne(id: number) {
    const role = await this.rolRepo.findOne({
      where: { id },
      relations: { rolPermisos: { permiso: true } },
    });
    if (!role || !Object.values(RoleCode).includes(role.codigo as RoleCode)) {
      throw new NotFoundException('Rol no encontrado.');
    }
    return this.toResponse(role);
  }

  async create(dto: CreateRolDto) {
    const existing = await this.rolRepo.findOne({ where: { codigo: dto.codigo } });
    if (existing) throw new ConflictException('El rol ya existe. Los roles del sistema están definidos por política.');

    const role = this.rolRepo.create({
      codigo: dto.codigo,
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      estado: dto.estado ?? 'ACTIVO',
    });
    const saved = await this.rolRepo.save(role);
    await this.applyPolicy(saved);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateRolDto) {
    const role = await this.rolRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado.');

    if (dto.nombre && dto.nombre !== role.nombre) {
      const duplicate = await this.rolRepo.findOne({ where: { nombre: dto.nombre } });
      if (duplicate && duplicate.id !== id) throw new ConflictException('Ya existe un rol con ese nombre.');
    }

    const canonical = ROLE_METADATA[role.codigo as RoleCode];
    if (!canonical) throw new ConflictException('El rol no pertenece a la política de seguridad vigente.');
    if (dto.nombre !== undefined && dto.nombre !== canonical.nombre) {
      throw new ConflictException('El nombre de los roles definidos por política no puede modificarse.');
    }
    if (dto.estado !== undefined && dto.estado !== 'ACTIVO') {
      throw new ConflictException('Los cuatro roles definidos por política deben permanecer activos.');
    }

    role.nombre = canonical.nombre;
    role.descripcion = dto.descripcion === undefined ? canonical.descripcion : dto.descripcion || null;
    role.estado = 'ACTIVO';
    await this.rolRepo.save(role);

    // La asignación de permisos no es arbitraria: se mantiene la matriz definida.
    await this.applyPolicy(role);
    return this.findOne(id);
  }

  async remove(id: number) {
    const role = await this.rolRepo.findOne({ where: { id }, relations: { usuarios: true } });
    if (!role) throw new NotFoundException('Rol no encontrado.');
    if ((role.usuarios || []).length) {
      throw new ConflictException(`No se puede eliminar el rol porque tiene ${(role.usuarios || []).length} usuario(s).`);
    }
    throw new ConflictException('Los roles de seguridad del sistema son fijos y no se eliminan.');
  }

  private async applyPolicy(role: Rol) {
    const policy = ROLE_PERMISSION_POLICY[role.codigo as RoleCode] ?? [];
    const permissions = await this.permisoRepo.find({ where: { codigo: In(policy) } });
    await this.rolPermisoRepo.manager.transaction(async (manager) => {
      await manager.delete(RolPermiso, { rolId: role.id });
      if (permissions.length) {
        await manager.insert(
          RolPermiso,
          permissions.map((permission) => ({ rolId: role.id, permisoId: permission.id })),
        );
      }
    });
  }

  private toResponse(role: Rol) {
    const permissions = (role.rolPermisos || [])
      .map((relation) => relation.permiso)
      .filter(Boolean)
      .map((permission) => ({
        id: permission.id,
        codigo: permission.codigo,
        nombre: permission.nombre,
        modulo: permission.modulo,
        descripcion: permission.descripcion,
      }));

    return {
      id: role.id,
      codigo: role.codigo,
      nombre: role.nombre,
      descripcion: role.descripcion,
      estado: role.estado,
      permisos: permissions,
      totalPermisos: permissions.length,
    };
  }
}
