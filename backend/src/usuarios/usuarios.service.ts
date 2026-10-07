import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { RoleCode } from '../common/enums/role.enum';
import { Docente } from '../gestion-academica/entities/docente.entity';
import { Estudiante } from '../estudiantes/entities/estudiante.entity';
import { Persona } from './entities/persona.entity';
import { TipoDocumento } from './entities/tipos-documento.entity';
import { Usuario } from './entities/usuario.entity';
import { Rol } from '../roles/entities/rol.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuariosQueryDto } from './dto/usuarios-query.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Persona) private readonly personaRepo: Repository<Persona>,
    @InjectRepository(TipoDocumento) private readonly tipoDocumentoRepo: Repository<TipoDocumento>,
    @InjectRepository(Rol) private readonly rolRepo: Repository<Rol>,
  ) {}

  async findAll(queryDto: UsuariosQueryDto) {
    const query = this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.persona', 'persona')
      .leftJoinAndSelect('u.rol', 'rol');

    if (queryDto.estado) query.andWhere('u.estado = :estado', { estado: queryDto.estado });
    if (queryDto.rol) query.andWhere('rol.codigo = :rol', { rol: queryDto.rol });
    if (queryDto.q) {
      query.andWhere(
        '(u.username LIKE :q OR persona.nombres LIKE :q OR persona.apellidos LIKE :q OR persona.documento LIKE :q)',
        { q: `%${queryDto.q}%` },
      );
    }

    const total = await query.clone().getCount();
    const usuarios = await query
      .orderBy('u.createdAt', 'DESC')
      .skip((queryDto.pagina - 1) * queryDto.limite)
      .take(queryDto.limite)
      .getMany();

    return {
      usuarios: usuarios.map((u) => this.toResponse(u)),
      total,
      pagina: queryDto.pagina,
      limite: queryDto.limite,
      totalPaginas: Math.ceil(total / queryDto.limite),
    };
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: id as any },
      relations: { persona: true, rol: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    return this.toResponse(usuario, true);
  }

  async create(dto: CreateUsuarioDto) {
    const rol = await this.getActiveRole(dto.rolId);
    this.assertAccountRoleAllowed(rol.codigo as RoleCode);

    const tipoDocumento = await this.tipoDocumentoRepo.findOne({ where: { id: dto.tipoDocumentoId } });
    if (!tipoDocumento || !tipoDocumento.activo) {
      throw new BadRequestException('El tipo de documento no existe o está inactivo.');
    }

    const existingUser = await this.usuarioRepo.findOne({ where: { username: dto.username } });
    if (existingUser) throw new ConflictException('Ya existe un usuario con ese username.');

    if (dto.email) {
      const existingEmail = await this.personaRepo.findOne({ where: { email: dto.email } });
      if (existingEmail) throw new ConflictException('Ya existe una persona con ese email.');
    }

    const existingDoc = await this.personaRepo.findOne({
      where: { tipoDocumentoId: dto.tipoDocumentoId, documento: dto.documento },
    });
    if (existingDoc) {
      throw new ConflictException('Ya existe una persona con ese tipo y número de documento.');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    try {
      return await this.usuarioRepo.manager.transaction(async (manager) => {
        const persona = manager.create(Persona, {
          tipoDocumentoId: dto.tipoDocumentoId,
          documento: dto.documento,
          nombres: dto.nombres,
          apellidos: dto.apellidos,
          email: dto.email ?? null,
          telefono: dto.telefono ?? null,
          fechaNacimiento: null,
          estado: 'ACTIVA',
        });
        const savedPersona = await manager.save(Persona, persona);

        const usuario = manager.create(Usuario, {
          personaId: savedPersona.id,
          rolId: rol.id,
          username: dto.username,
          passwordHash,
          estado: dto.estado ?? 'ACTIVO',
          ultimoAccesoAt: null,
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
          rol: { id: rol.id, codigo: rol.codigo, nombre: rol.nombre },
        };
      });
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('El username, documento o email ya existe.');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateUsuarioDto, currentUserId: number) {
    if (id === currentUserId && dto.estado && dto.estado !== 'ACTIVO') {
      throw new BadRequestException('No puede desactivar o bloquear su propia cuenta.');
    }

    const usuario = await this.usuarioRepo.findOne({
      where: { id: id as any },
      relations: { persona: true, rol: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');

    let newRole: Rol | undefined;
    if (dto.rolId !== undefined && Number(dto.rolId) !== Number(usuario.rolId)) {
      newRole = await this.getActiveRole(dto.rolId);
      this.assertAccountRoleAllowed(newRole.codigo as RoleCode);
    }

    if (dto.email !== undefined && dto.email !== usuario.persona.email) {
      const duplicate = await this.personaRepo.findOne({ where: { email: dto.email } });
      if (duplicate && Number(duplicate.id) !== Number(usuario.personaId)) {
        throw new ConflictException('Ya existe una persona con ese email.');
      }
    }

    return this.usuarioRepo.manager.transaction(async (manager) => {
      const personaUpdate: Partial<Persona> = {};
      if (dto.nombres !== undefined) personaUpdate.nombres = dto.nombres;
      if (dto.apellidos !== undefined) personaUpdate.apellidos = dto.apellidos;
      if (dto.email !== undefined) personaUpdate.email = dto.email || null;
      if (dto.telefono !== undefined) personaUpdate.telefono = dto.telefono || null;
      if (Object.keys(personaUpdate).length) {
        await manager.update(Persona, usuario.personaId as any, personaUpdate);
      }

      const usuarioUpdate: Partial<Usuario> = {};
      if (dto.password) usuarioUpdate.passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
      if (newRole) usuarioUpdate.rolId = newRole.id;
      if (dto.estado) usuarioUpdate.estado = dto.estado;
      if (Object.keys(usuarioUpdate).length) {
        await manager.update(Usuario, usuario.id as any, usuarioUpdate);
      }

      return this.findOne(id);
    });
  }

  async remove(id: number, currentUserId: number) {
    if (id === currentUserId) throw new BadRequestException('No puede eliminar su propia cuenta.');

    const usuario = await this.usuarioRepo.findOne({ where: { id: id as any } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');

    const personaId = usuario.personaId;

    await this.usuarioRepo.manager.transaction(async (manager) => {
      await manager.delete(Usuario, usuario.id as any);
      const docente = await manager.findOne(Docente, { where: { personaId: personaId as any } });
      const estudiante = await manager.findOne(Estudiante, { where: { personaId: personaId as any } });
      if (!docente && !estudiante) {
        await manager.delete(Persona, personaId as any);
      }
    });

    return { ok: true, message: 'Usuario eliminado permanentemente.' };
  }

  async activate(id: number) {
    const user = await this.usuarioRepo.findOne({ where: { id: id as any } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    await this.usuarioRepo.update(user.id as any, { estado: 'ACTIVO' });
    return this.findOne(id);
  }

  async deactivate(id: number, currentUserId: number) {
    if (id === currentUserId) throw new BadRequestException('No puede desactivar su propia cuenta.');
    const user = await this.usuarioRepo.findOne({ where: { id: id as any } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    await this.usuarioRepo.update(user.id as any, { estado: 'INACTIVO' });
    return this.findOne(id);
  }

  private async getActiveRole(id: number): Promise<Rol> {
    const role = await this.rolRepo.findOne({ where: { id } });
    if (!role) throw new BadRequestException('El rol especificado no existe.');
    if (role.estado !== 'ACTIVO') throw new BadRequestException('El rol está inactivo.');
    return role;
  }

  private assertAccountRoleAllowed(role: RoleCode) {
    if (role === RoleCode.ESTUDIANTE) {
      throw new BadRequestException(
        'Los estudiantes no pueden tener cuentas de usuario ni iniciar sesión.',
      );
    }
    if (![RoleCode.ADMIN, RoleCode.ADMINISTRATIVO, RoleCode.DOCENTE].includes(role)) {
      throw new BadRequestException('El rol no está habilitado para cuentas de usuario.');
    }
  }

  private toResponse(usuario: Usuario, includePhone = false) {
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
        ...(includePhone ? { telefono: usuario.persona.telefono } : {}),
        estado: usuario.persona.estado,
      },
      rol: {
        id: usuario.rol.id,
        codigo: usuario.rol.codigo,
        nombre: usuario.rol.nombre,
      },
    };
  }
}
