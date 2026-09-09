import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity.js';
import { RolPermiso } from '../entities/rol-permiso.entity.js';

export interface JwtPayload {
  userId: string;
  username: string;
  rolCodigo: string;
  rolNombre: string;
  personaId: string;
  permisos: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(RolPermiso)
    private rolPermisoRepo: Repository<RolPermiso>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Misma fuente única de configuración que auth.module.ts (main.ts la valida al arrancar).
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: BigInt(payload.userId) as any },
      relations: { persona: true, rol: true },
    });

    if (!usuario) return null;
    if (usuario.estado !== 'ACTIVO') return null;
    if (usuario.persona?.estado !== 'ACTIVA') return null;

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
        codigo: usuario.rol.codigo,
        nombre: usuario.rol.nombre,
      },
      permisos,
    };
  }
}
