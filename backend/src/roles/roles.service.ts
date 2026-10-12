import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../roles/entities/rol.entity';
import { UpdateRolDto } from './dto/update-rol.dto';
import { FIXED_ROLE_CODES } from '../common/enums/role.enum';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Rol) private rolRepo: Repository<Rol>,
  ) {}

  async findAll(includePermisos = false) {
    const roles = await this.rolRepo.find({
      relations: includePermisos ? { rolPermisos: { permiso: true } } : {},
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
      relations: { rolPermisos: { permiso: true } },
    });
    if (!rol) throw new NotFoundException('Rol no encontrado.');
    if (!FIXED_ROLE_CODES.includes(rol.codigo as any)) throw new BadRequestException('El registro de roles no puede salir del conjunto fijo del sistema.');
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

  async update(id: number, dto: UpdateRolDto) {
    const rol = await this.rolRepo.findOne({ where: { id } });
    if (!rol) throw new NotFoundException('Rol no encontrado.');
    if (!FIXED_ROLE_CODES.includes(rol.codigo as any)) {
      throw new BadRequestException('El registro de roles no puede salir del conjunto fijo del sistema.');
    }
    const data: Partial<typeof rol> = {};
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion || null;
    if (dto.estado) data.estado = dto.estado;
    if (Object.keys(data).length > 0) await this.rolRepo.update(id, data as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    throw new BadRequestException('Los roles del sistema son fijos y no pueden eliminarse.');
    /*
    const rol = await this.rolRepo.findOne({
      where: { id },
      relations: { usuarios: true },
    });
    if (!rol) throw new NotFoundException('Rol no encontrado.');

    if ((rol.usuarios || []).length > 0) {
      throw new BadRequestException(
        `No se puede eliminar: hay ${(rol.usuarios || []).length} usuario(s) con este rol.`,
      );
    }

    await this.rolRepo.delete(id);
    return { ok: true, message: 'Rol eliminado.' };
    */
  }
}
