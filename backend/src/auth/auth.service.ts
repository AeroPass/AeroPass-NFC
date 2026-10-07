import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { DUMMY_HASH } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { RoleCode } from '../common/enums/role.enum';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async login(dto: LoginDto, requestMeta?: { ip?: string; userAgent?: string }) {
    const usuario = await this.usuarioRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .leftJoinAndSelect('u.persona', 'persona')
      .leftJoinAndSelect('u.rol', 'rol')
      .where('(u.username = :identifier OR persona.email = :identifier)', {
        identifier: dto.identifier,
      })
      .getOne();

    const hash = usuario?.passwordHash ?? DUMMY_HASH;
    const validPassword = await this.verifyPassword(hash, dto.password);

    if (!usuario || !validPassword || usuario.estado !== 'ACTIVO' || usuario.persona?.estado !== 'ACTIVA') {
      await this.auditoria.registrar({
        usuarioId: usuario ? Number(usuario.id) : null,
        accion: usuario?.rol?.codigo === RoleCode.ESTUDIANTE ? 'LOGIN' : 'ACCESS_DENIED',
        entidad: 'usuarios',
        entidadId: usuario ? String(usuario.id) : null,
        resultado: 'FALLIDO',
        detalle: usuario?.rol?.codigo === RoleCode.ESTUDIANTE
          ? 'Intento de autenticación de un estudiante. Los estudiantes no tienen cuenta de acceso.'
          : 'Credenciales inválidas o cuenta inactiva.',
        direccionIp: requestMeta?.ip ?? null,
        userAgent: requestMeta?.userAgent ?? null,
      });
      throw new UnauthorizedException('Credenciales inválidas o cuenta sin permiso de acceso.');
    }

    if (!usuario.rol || usuario.rol.codigo === RoleCode.ESTUDIANTE || usuario.rol.estado !== 'ACTIVO') {
      await this.auditoria.registrar({
        usuarioId: Number(usuario.id),
        accion: 'ACCESS_DENIED',
        entidad: 'usuarios',
        entidadId: String(usuario.id),
        resultado: 'DENEGADO',
        detalle: 'El rol estudiante no puede autenticarse y los roles inactivos no pueden acceder.',
        direccionIp: requestMeta?.ip ?? null,
        userAgent: requestMeta?.userAgent ?? null,
      });
      throw new UnauthorizedException('El usuario no tiene permitido iniciar sesión.');
    }

    // Migración transparente de hashes SHA-256 heredados a Argon2id.
    if (/^[a-f0-9]{64}$/i.test(hash)) {
      const upgraded = await argon2.hash(dto.password, { type: argon2.argon2id });
      await this.usuarioRepo.update(usuario.id as any, { passwordHash: upgraded } as any);
    }

    const now = new Date();
    await this.usuarioRepo.update(usuario.id as any, { ultimoAccesoAt: now } as any);

    const payload = {
      sub: String(usuario.id),
      username: usuario.username,
      role: usuario.rol.codigo,
      jti: randomUUID(),
    };

    const accessToken = await this.jwt.signAsync(payload);
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '8h');

    const user = {
      id: Number(usuario.id),
      username: usuario.username,
      estado: usuario.estado,
      ultimoAccesoAt: now,
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
    };

    await this.auditoria.registrar({
      usuarioId: Number(usuario.id),
      accion: 'LOGIN',
      entidad: 'usuarios',
      entidadId: String(usuario.id),
      resultado: 'EXITOSO',
      detalle: 'Inicio de sesión exitoso.',
      direccionIp: requestMeta?.ip ?? null,
      userAgent: requestMeta?.userAgent ?? null,
    });

    return { accessToken, tokenType: 'Bearer' as const, expiresIn, user };
  }

  async me(user: AuthenticatedUser) {
    return user;
  }

  private async verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
    if (/^[a-f0-9]{64}$/i.test(hash)) {
      const candidate = createHash('sha256').update(plainPassword).digest('hex');
      const left = Buffer.from(candidate, 'hex');
      const right = Buffer.from(hash, 'hex');
      return left.length === right.length && timingSafeEqual(left, right);
    }

    try {
      return await argon2.verify(hash, plainPassword);
    } catch {
      return argon2.verify(DUMMY_HASH, plainPassword).catch(() => false);
    }
  }
}
