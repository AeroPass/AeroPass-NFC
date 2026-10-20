import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { RolPermiso } from '../roles/entities/rol-permiso.entity';
import { Role } from '../common/enums/role.enum';

export interface JwtPayload {
  sub: number;
  username: string;
  rol: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(RolPermiso) private readonly rolPermisoRepo: Repository<RolPermiso>,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: config.getOrThrow<string>('jwt.secreto'),
      issuer: config.getOrThrow<string>('jwt.emisor'),
      audience: config.getOrThrow<string>('jwt.audiencia'),
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: payload.sub },
      relations: { persona: true, rol: true },
    });

    if (!usuario || usuario.estado !== 'ACTIVO' || usuario.persona?.estado !== 'ACTIVA') return null;
    if (usuario.rol?.estado !== 'ACTIVO') return null;
    if (usuario.rol?.codigo === Role.ESTUDIANTE) return null;

    const rolPermisos = await this.rolPermisoRepo.find({
      where: { rolId: usuario.rolId },
      relations: { permiso: true },
    });
    const permisos = rolPermisos
      .map((rp) => rp.permiso)
      .filter((p) => p && p.estado === 'ACTIVO')
      .map((p) => p.codigo);

    return {
      id: Number(usuario.id),
      username: usuario.username,
      estado: usuario.estado,
      ultimoAccesoAt: usuario.ultimoAccesoAt,
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
        codigo: usuario.rol.codigo as Role,
        nombre: usuario.rol.nombre,
      },
      permisos,
    };
  }
}
