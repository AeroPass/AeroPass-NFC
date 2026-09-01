import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { Usuario } from '../entities/usuario.entity.js';
import { RolPermiso } from '../entities/rol-permiso.entity.js';
import { JwtPayload } from './jwt.strategy.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(RolPermiso)
    private rolPermisoRepo: Repository<RolPermiso>,
    private jwtService: JwtService,
  ) {}

  /**
   * CU-01 — Iniciar sesión
   *
   * 1. Buscar usuario por username
   * 2. Verificar estado del usuario (ACTIVO)
   * 3. Verificar estado de la persona (ACTIVA)
   * 4. Verificar estado del rol (ACTIVO)
   * 5. Verificar hash de la contraseña (argon2id)
   * 6. Cargar permisos del rol
   * 7. Firmar JWT con claims mínimos
   * 8. Actualizar ultimo_acceso_at
   */
  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 1. Buscar usuario con persona y rol
    const usuario = await this.usuarioRepo.findOne({
      where: { username },
      relations: ['persona', 'rol'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    // 2. Verificar estado del usuario
    if (usuario.estado === 'BLOQUEADO') {
      throw new ConflictException('Su cuenta está bloqueada. Contacte al administrador.');
    }
    if (usuario.estado === 'INACTIVO') {
      throw new ConflictException('Su cuenta está inactiva. Contacte al administrador.');
    }

    // 3. Verificar estado de la persona
    if (usuario.persona?.estado !== 'ACTIVA') {
      throw new ConflictException('La persona asociada está inactiva.');
    }

    // 4. Verificar estado del rol
    if (usuario.rol?.estado !== 'ACTIVO') {
      throw new ConflictException('El rol asignado está inactivo.');
    }

    // 5. Verificar contraseña con argon2id
    const valid = await argon2.verify(usuario.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    // 6. Cargar permisos del rol
    const rolPermisos = await this.rolPermisoRepo.find({
      where: { rolId: usuario.rolId },
      relations: ['permiso'],
    });

    const permisos = rolPermisos
      .map((rp) => rp.permiso)
      .filter((p) => p && p.estado === 'ACTIVO')
      .map((p) => p.codigo);

    // 7. Firmar JWT
    const payload: JwtPayload = {
      userId: usuario.id.toString(),
      username: usuario.username,
      rolCodigo: usuario.rol.codigo,
      rolNombre: usuario.rol.nombre,
      personaId: usuario.personaId.toString(),
      permisos,
    };

    const token = this.jwtService.sign(payload);

    // 8. Actualizar ultimo_acceso_at
    await this.usuarioRepo.update(usuario.id, { ultimoAccesoAt: new Date() } as any);

    return {
      message: 'Login exitoso',
      user: {
        id: Number(usuario.id),
        username: usuario.username,
        estado: usuario.estado,
        ultimoAccesoAt: new Date(),
        persona: {
          id: Number(usuario.persona.id),
          nombres: usuario.persona.nombres,
          apellidos: usuario.persona.apellidos,
          nombreCompleto: `${usuario.persona.nombres} ${usuario.persona.apellidos}`,
          email: usuario.persona.email,
          documento: usuario.persona.documento,
        },
        rol: {
          id: usuario.rol.id,
          codigo: usuario.rol.codigo,
          nombre: usuario.rol.nombre,
        },
        permisos,
      },
      token,
    };
  }

  /**
   * GET /auth/me — Devuelve el usuario autenticado.
   */
  async getProfile(user: any) {
    return { user };
  }
}
