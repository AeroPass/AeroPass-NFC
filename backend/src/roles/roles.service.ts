import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Rol } from '../entities/rol.entity.js';
import { Permiso } from '../entities/permiso.entity.js';
import { RolPermiso } from '../entities/rol-permiso.entity.js';
import { CreateRolDto } from './dto/create-rol.dto.js';
import { UpdateRolDto } from './dto/update-rol.dto.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Rol) private rolRepo: Repository<Rol>,
    @InjectRepository(Permiso) private permisoRepo: Repository<Permiso>,
    @InjectRepository(RolPermiso) private rolPermisoRepo: Repository<RolPermiso>,
  ) {}

  async findAll(includePermisos = false) {
    const roles = await this.rolRepo.find({
      relations: includePermisos ? ['rolPermisos', 'rolPermisos.permiso'] : [],
      order: { id: 'ASC' },
    });

    return roles.map((r) => ({
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      descripcion: r.descripcion,
      estado: r.estado,
      permisos: includePermisos ? (r.rolPermisos || []).map((rp) => rp.permiso) : undefined,
      totalPermisos: includePermisos ? (r.rolPermisos || []).length : undefined,
    }));
  }

  async findOne(id: number) {
    const rol = await this.rolRepo.findOne({
      where: { id },
      relations: ['rolPermisos', 'rolPermisos.permiso'],
    });
    if (!rol) throw new NotFoundException('Rol no encontrado.');
    return {
      id: rol.id,
      codigo: rol.codigo,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      estado: rol.estado,
      permisos: (rol.rolPermisos || []).map((rp) => rp.permiso),
      totalPermisos: (rol.rolPermisos || []).length,
    };
  }

  async create(dto: CreateRolDto) {
    const existingCodigo = await this.rolRepo.findOne({ where: { codigo: dto.codigo } });
    if (existingCodigo) throw new ConflictException('Ya existe un rol con ese código.');

    const existingNombre = await this.rolRepo.findOne({ where: { nombre: dto.nombre } });
    if (existingNombre) throw new ConflictException('Ya existe un rol con ese nombre.');

    if (dto.permisosIds && dto.permisosIds.length > 0) {
      const permisosExistentes = await this.permisoRepo.find({
        where: { id: In(dto.permisosIds) },
      });
      if (permisosExistentes.length !== dto.permisosIds.length) {
        throw new BadRequestException('Uno o más permisos especificados no existen.');
      }
    }

    return this.rolRepo.manager.transaction(async (manager) => {
      const nuevo = manager.create(Rol, {
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion || null,
        estado: dto.estado || 'ACTIVO',
      });
      const saved = await manager.save(Rol, nuevo);

      if (dto.permisosIds && dto.permisosIds.length > 0) {
        await manager.insert(
          RolPermiso,
          dto.permisosIds.map((permisoId) => ({ rolId: saved.id, permisoId })),
        );
      }

      return { rol: { id: saved.id, codigo: saved.codigo, nombre: saved.nombre } };
    });
  }

  async update(id: number, dto: UpdateRolDto) {
    const rol = await this.rolRepo.findOne({ where: { id } });
    if (!rol) throw new NotFoundException('Rol no encontrado.');

    if (dto.nombre && dto.nombre !== rol.nombre) {
      const dup = await this.rolRepo.findOne({ where: { nombre: dto.nombre } });
      if (dup && dup.id !== id) throw new ConflictException('Ya existe un rol con ese nombre.');
    }

    if (dto.permisosIds && dto.permisosIds.length > 0) {
      const permisosExistentes = await this.permisoRepo.find({
        where: { id: In(dto.permisosIds) },
      });
      if (permisosExistentes.length !== dto.permisosIds.length) {
        throw new BadRequestException('Uno o más permisos especificados no existen.');
      }
    }

    return this.rolRepo.manager.transaction(async (manager) => {
      const data: any = {};
      if (dto.nombre) data.nombre = dto.nombre;
      if (dto.descripcion !== undefined) data.descripcion = dto.descripcion || null;
      if (dto.estado) data.estado = dto.estado;
      if (Object.keys(data).length > 0) {
        await manager.update(Rol, id, data);
      }

      if (dto.permisosIds !== undefined) {
        await manager.delete(RolPermiso, { rolId: id });
        if (dto.permisosIds.length > 0) {
          await manager.insert(
            RolPermiso,
            dto.permisosIds.map((permisoId) => ({ rolId: id, permisoId })),
          );
        }
      }

      return this.findOne(id);
    });
  }

  async remove(id: number) {
    const rol = await this.rolRepo.findOne({
      where: { id },
      relations: ['usuarios'],
    });
    if (!rol) throw new NotFoundException('Rol no encontrado.');

    if ((rol.usuarios || []).length > 0) {
      throw new BadRequestException(
        `No se puede eliminar: hay ${(rol.usuarios || []).length} usuario(s) con este rol.`,
      );
    }

    await this.rolRepo.delete(id);
    return { ok: true, message: 'Rol eliminado.' };
  }
}
