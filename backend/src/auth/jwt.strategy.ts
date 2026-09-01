import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
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
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-dev-key-change-in-production',
    });
  }

  /**
   * Carga el usuario completo desde la BD cada vez que se valida un JWT.
   * Esto asegura que los permisos estén siempre actualizados.
   */
  async validate(payload: JwtPayload) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: BigInt(payload.userId) as any },
      relations: ['persona', 'rol'],
    });

    if (!usuario) return null;
    if (usuario.estado !== 'ACTIVO') return null;
    if (usuario.persona?.estado !== 'ACTIVA') return null;

    // Cargar permisos del rol desde la BD
    const rolPermisos = await this.rolPermisoRepo.find({
      where: { rolId: usuario.rolId },
      relations: ['permiso'],
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
