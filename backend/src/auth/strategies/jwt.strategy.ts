import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { RolPermiso } from '../../roles/entities/rol-permiso.entity';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

interface JwtPayload {
  sub: string | number;
  username?: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(RolPermiso)
    private readonly rolPermisoRepo: Repository<RolPermiso>,
  ) {
    const secret = config.getOrThrow<string>('JWT_SECRET');
    const issuer = config.get<string>('JWT_ISSUER', 'AeroPass-NFC');
    const audience = config.get<string>('JWT_AUDIENCE', 'AeroPass-NFC-api');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer,
      audience,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser | null> {
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) return null;

    const usuario = await this.usuarioRepo.findOne({
      where: { id: userId as any },
      relations: { persona: true, rol: true },
    });

    if (!usuario || usuario.estado !== 'ACTIVO') return null;
    if (!usuario.persona || usuario.persona.estado !== 'ACTIVA') return null;
    if (!usuario.rol || usuario.rol.estado !== 'ACTIVO') return null;
    if (usuario.rol.codigo === 'ESTUDIANTE') return null;

    const rolePermissions = await this.rolPermisoRepo.find({
      where: { rolId: usuario.rol.id },
      relations: { permiso: true },
    });

    const permisos = rolePermissions
      .map((item) => item.permiso)
      .filter((item) => item && item.estado === 'ACTIVO')
      .map((item) => item.codigo);

    return {
      id: Number(usuario.id),
      username: usuario.username,
      estado: usuario.estado,
      persona: {
        id: Number(usuario.persona.id),
        nombres: usuario.persona.nombres,
        apellidos: usuario.persona.apellidos,
        nombreCompleto: `${usuario.persona.nombres} ${usuario.persona.apellidos}`,
        email: usuario.persona.email,
        documento: usuario.persona.documento,
        estado: usuario.persona.estado,
      },
      rol: {
        id: usuario.rol.id,
        codigo: usuario.rol.codigo,
        nombre: usuario.rol.nombre,
      },
      permisos,
    };
  }
}
