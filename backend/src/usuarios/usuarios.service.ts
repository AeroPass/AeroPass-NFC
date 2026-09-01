import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { Usuario } from '../entities/usuario.entity.js';
import { Persona } from '../entities/persona.entity.js';
import { Rol } from '../entities/rol.entity.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Persona)
    private personaRepo: Repository<Persona>,
    @InjectRepository(Rol)
    private rolRepo: Repository<Rol>,
  ) {}

  /**
   * Lista todos los usuarios con filtros opcionales.
   */
  async findAll(rol?: string, estado?: string, q?: string) {
    const query = this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.persona', 'persona')
      .leftJoinAndSelect('u.rol', 'rol');

    if (estado) query.andWhere('u.estado = :estado', { estado });
    if (rol) query.andWhere('rol.codigo = :rol', { rol });
    if (q) {
      query.andWhere(
        '(u.username LIKE :q OR persona.nombres LIKE :q OR persona.apellidos LIKE :q)',
        { q: `%${q}%` },
      );
    }

    query.orderBy('u.createdAt', 'DESC');
    const usuarios = await query.getMany();

    return usuarios.map((u) => ({
      id: Number(u.id),
      username: u.username,
      estado: u.estado,
      ultimoAccesoAt: u.ultimoAccesoAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      persona: {
        id: Number(u.persona.id),
        nombres: u.persona.nombres,
        apellidos: u.persona.apellidos,
        nombreCompleto: `${u.persona.nombres} ${u.persona.apellidos}`,
        email: u.persona.email,
        documento: u.persona.documento,
        estado: u.persona.estado,
      },
      rol: {
        id: u.rol.id,
        codigo: u.rol.codigo,
        nombre: u.rol.nombre,
      },
    }));
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: BigInt(id) as any },
      relations: ['persona', 'rol'],
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    return {
      id: Number(usuario.id),
      username: usuario.username,
      estado: usuario.estado,
      ultimoAccesoAt: usuario.ultimoAccesoAt,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
      persona: {
        id: Number(usuario.persona.id),
        nombres: usuario.persona.nombres,
        apellidos: usuario.persona.apellidos,
        nombreCompleto: `${usuario.persona.nombres} ${usuario.persona.apellidos}`,
        email: usuario.persona.email,
        documento: usuario.persona.documento,
        telefono: usuario.persona.telefono,
        estado: usuario.persona.estado,
      },
      rol: {
        id: usuario.rol.id,
        codigo: usuario.rol.codigo,
        nombre: usuario.rol.nombre,
      },
    };
  }

  /**
   * CU-03 — Crear usuario (admin o docente).
   */
  async create(dto: CreateUsuarioDto) {
    const existingUser = await this.usuarioRepo.findOne({ where: { username: dto.username } });
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese username.');
    }
    if (dto.email) {
      const existingEmail = await this.personaRepo.findOne({ where: { email: dto.email } });
      if (existingEmail) {
        throw new ConflictException('Ya existe una persona con ese email.');
      }
    }
    const existingDoc = await this.personaRepo.findOne({
      where: { tipoDocumentoId: dto.tipoDocumentoId, documento: dto.documento } as any,
    });
    if (existingDoc) {
      throw new ConflictException('Ya existe una persona con ese tipo y número de documento.');
    }

    const rol = await this.rolRepo.findOne({ where: { id: dto.rolId } });
    if (!rol) throw new BadRequestException('El rol especificado no existe.');
    if (rol.estado !== 'ACTIVO') throw new BadRequestException('El rol está inactivo.');

    const passwordHash = await argon2.hash(dto.password);

    return this.usuarioRepo.manager.transaction(async (manager) => {
      const persona = manager.create(Persona, {
        tipoDocumentoId: dto.tipoDocumentoId,
        documento: dto.documento,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        email: dto.email || null,
        telefono: dto.telefono || null,
        estado: 'ACTIVA',
      });
      const savedPersona = await manager.save(Persona, persona);

      const usuario = manager.create(Usuario, {
        personaId: savedPersona.id,
        rolId: dto.rolId,
        username: dto.username,
        passwordHash,
        estado: dto.estado || 'ACTIVO',
      });
      const savedUsuario = await manager.save(Usuario, usuario);

      return {
        id: Number(savedUsuario.id),
        username: savedUsuario.username,
        estado: savedUsuario.estado,
        createdAt: savedUsuario.createdAt,
        persona: {
          id: Number(savedPersona.id),
          nombres: savedPersona.nombres,
          apellidos: savedPersona.apellidos,
          nombreCompleto: `${savedPersona.nombres} ${savedPersona.apellidos}`,
          email: savedPersona.email,
          documento: savedPersona.documento,
        },
        rol: {
          id: rol.id,
          codigo: rol.codigo,
          nombre: rol.nombre,
        },
      };
    });
  }

  /**
   * CU-03 — Editar usuario (admin o docente).
   */
  async update(id: number, dto: UpdateUsuarioDto, currentUserId: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: BigInt(id) as any },
      relations: ['persona'],
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');

    if (dto.email && dto.email !== usuario.persona.email) {
      const dup = await this.personaRepo.findOne({ where: { email: dto.email } });
      if (dup && Number(dup.id) !== Number(usuario.personaId)) {
        throw new ConflictException('Ya existe una persona con ese email.');
      }
    }

    if (dto.rolId && dto.rolId !== usuario.rolId) {
      const rol = await this.rolRepo.findOne({ where: { id: dto.rolId } });
      if (!rol) throw new BadRequestException('El rol especificado no existe.');
      if (rol.estado !== 'ACTIVO') throw new BadRequestException('El rol está inactivo.');
    }

    return this.usuarioRepo.manager.transaction(async (manager) => {
      const personaUpdate: any = {};
      if (dto.nombres) personaUpdate.nombres = dto.nombres;
      if (dto.apellidos) personaUpdate.apellidos = dto.apellidos;
      if (dto.email !== undefined) personaUpdate.email = dto.email || null;
      if (dto.telefono !== undefined) personaUpdate.telefono = dto.telefono || null;

      if (Object.keys(personaUpdate).length > 0) {
        await manager.update(Persona, usuario.personaId as any, personaUpdate);
      }

      const usuarioUpdate: any = {};
      if (dto.password) usuarioUpdate.passwordHash = await argon2.hash(dto.password);
      if (dto.rolId) usuarioUpdate.rolId = dto.rolId;
      if (dto.estado) usuarioUpdate.estado = dto.estado;

      if (Object.keys(usuarioUpdate).length > 0) {
        await manager.update(Usuario, usuario.id as any, usuarioUpdate);
      }

      const updated = await manager.findOne(Usuario, {
        where: { id: usuario.id } as any,
        relations: ['persona', 'rol'],
      });

      return {
        id: Number(updated.id),
        username: updated.username,
        estado: updated.estado,
        updatedAt: updated.updatedAt,
        persona: {
          id: Number(updated.persona.id),
          nombres: updated.persona.nombres,
          apellidos: updated.persona.apellidos,
          nombreCompleto: `${updated.persona.nombres} ${updated.persona.apellidos}`,
          email: updated.persona.email,
          documento: updated.persona.documento,
        },
        rol: {
          id: updated.rol.id,
          codigo: updated.rol.codigo,
          nombre: updated.rol.nombre,
        },
      };
    });
  }

  /**
   * Elimina un usuario permanentemente.
   */
  async remove(id: number, currentUserId: number) {
    if (Number(id) === Number(currentUserId)) {
      throw new BadRequestException('No puede eliminar su propia cuenta.');
    }

    const usuario = await this.usuarioRepo.findOne({ where: { id: BigInt(id) as any } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');

    const personaId = usuario.personaId;

    await this.usuarioRepo.manager.transaction(async (manager) => {
      await manager.delete(Usuario, usuario.id as any);
      try {
        await manager.delete(Persona, personaId as any);
      } catch {
        // La persona tiene otras referencias, se mantiene
      }
    });

    return { ok: true, message: 'Usuario eliminado permanentemente.' };
  }

  /**
   * Activa un usuario (estado → ACTIVO).
   */
  async activate(id: number) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: BigInt(id) as any } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    await this.usuarioRepo.update(usuario.id as any, { estado: 'ACTIVO' } as any);
    return this.findOne(Number(id));
  }

  /**
   * Desactiva un usuario (estado → INACTIVO).
   */
  async deactivate(id: number, currentUserId: number) {
    if (Number(id) === Number(currentUserId)) {
      throw new BadRequestException('No puede desactivar su propia cuenta.');
    }

    const usuario = await this.usuarioRepo.findOne({ where: { id: BigInt(id) as any } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    await this.usuarioRepo.update(usuario.id as any, { estado: 'INACTIVO' } as any);
    return this.findOne(Number(id));
  }
}
