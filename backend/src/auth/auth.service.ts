import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { RolPermiso } from '../roles/entities/rol-permiso.entity';
import { AuditService } from '../auditoria/audit.service';
import { Role } from '../common/enums/role.enum';
import { DUMMY_HASH } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(RolPermiso) private readonly rolPermisoRepo: Repository<RolPermiso>,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, requestMeta?: { ip?: string; userAgent?: string }) {
    const usuario = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .addSelect('usuario.passwordHash')
      .leftJoinAndSelect('usuario.persona', 'persona')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('usuario.username = :username', { username: dto.username.trim() })
      .getOne();

    if (!usuario) {
      await argon2.verify(DUMMY_HASH, dto.password).catch(() => false);
      await this.audit.log({
        accion: 'LOGIN', entidad: 'usuarios', entidadId: dto.username,
        resultado: 'FALLIDO', detalle: 'Credenciales inválidas',
        direccionIp: requestMeta?.ip, userAgent: requestMeta?.userAgent,
      });
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    if (usuario.estado === 'BLOQUEADO') {
      await this.audit.log({
        accion: 'LOGIN', entidad: 'usuarios', entidadId: String(usuario.id),
        usuarioId: Number(usuario.id), resultado: 'FALLIDO', detalle: 'Cuenta bloqueada',
        direccionIp: requestMeta?.ip, userAgent: requestMeta?.userAgent,
      });
      throw new ConflictException('La cuenta está bloqueada.');
    }

    if (usuario.estado !== 'ACTIVO' || usuario.persona?.estado !== 'ACTIVA' || usuario.rol?.estado !== 'ACTIVO') {
      await this.audit.log({
        accion: 'LOGIN', entidad: 'usuarios', entidadId: String(usuario.id),
        usuarioId: Number(usuario.id), resultado: 'FALLIDO', detalle: 'Cuenta o persona inactiva',
        direccionIp: requestMeta?.ip, userAgent: requestMeta?.userAgent,
      });
      throw new UnauthorizedException('La cuenta no está habilitada para iniciar sesión.');
    }

    if (usuario.rol.codigo === Role.ESTUDIANTE) {
      await this.audit.log({
        accion: 'LOGIN', entidad: 'usuarios', entidadId: String(usuario.id),
        usuarioId: Number(usuario.id), resultado: 'FALLIDO', detalle: 'El rol ESTUDIANTE no puede iniciar sesión',
        direccionIp: requestMeta?.ip, userAgent: requestMeta?.userAgent,
      });
      throw new UnauthorizedException('El rol ESTUDIANTE no tiene acceso al login.');
    }

    const validPassword = await argon2.verify(usuario.passwordHash, dto.password).catch(() => false);
    if (!validPassword) {
      await this.audit.log({
        accion: 'LOGIN', entidad: 'usuarios', entidadId: String(usuario.id),
        usuarioId: Number(usuario.id), resultado: 'FALLIDO', detalle: 'Credenciales inválidas',
        direccionIp: requestMeta?.ip, userAgent: requestMeta?.userAgent,
      });
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const rolPermisos = await this.rolPermisoRepo.find({
      where: { rolId: usuario.rolId },
      relations: { permiso: true },
    });
    const permisos = rolPermisos
      .map((rp) => rp.permiso)
      .filter((p) => p && p.estado === 'ACTIVO')
      .map((p) => p.codigo);

    const ultimoAccesoAnterior = usuario.ultimoAccesoAt;
    const tokenPayload = {
      sub: Number(usuario.id),
      username: usuario.username,
      rol: usuario.rol.codigo as Role,
    };
    const accessToken = await this.jwt.signAsync(tokenPayload);

    await this.usuarioRepo.update(usuario.id, { ultimoAccesoAt: new Date() });
    await this.audit.log({
      accion: 'LOGIN', entidad: 'usuarios', entidadId: String(usuario.id),
      usuarioId: Number(usuario.id), resultado: 'EXITOSO', detalle: 'Login exitoso',
      direccionIp: requestMeta?.ip, userAgent: requestMeta?.userAgent,
    });

    return {
      accessToken,
      token: accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.getOrThrow<string>('jwt.expiracion'),
      user: {
        id: Number(usuario.id),
        username: usuario.username,
        rol: { id: usuario.rol.id, codigo: usuario.rol.codigo, nombre: usuario.rol.nombre },
        permisos,
        persona: {
          id: Number(usuario.persona.id),
          nombres: usuario.persona.nombres,
          apellidos: usuario.persona.apellidos,
          nombreCompleto: `${usuario.persona.nombres} ${usuario.persona.apellidos}`,
          email: usuario.persona.email,
          documento: usuario.persona.documento,
        },
        ultimoAccesoAt: ultimoAccesoAnterior,
      },
    };
  }
}
