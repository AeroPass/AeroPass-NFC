import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Permiso } from './entities/permiso.entity';
import { PermisosQueryDto } from './dto/permisos-query.dto';

@Injectable()
export class PermisosService {
  constructor(@InjectRepository(Permiso) private readonly permisoRepo: Repository<Permiso>) {}

  async findAll(user: AuthenticatedUser, query: PermisosQueryDto) {
    const where = query.modulo ? { estado: 'ACTIVO' as const, modulo: query.modulo } : { estado: 'ACTIVO' as const };
    const todos = await this.permisoRepo.find({ where, order: { modulo: 'ASC', codigo: 'ASC' } });
    const porModulo: Record<string, any[]> = {};

    for (const permiso of todos) {
      porModulo[permiso.modulo] ??= [];
      porModulo[permiso.modulo].push(permiso);
    }

    return {
      usuario: {
        id: user.id,
        username: user.username,
        nombreCompleto: user.persona.nombreCompleto,
        rol: user.rol,
      },
      permisosAsignados: user.permisos,
      totalAsignados: user.permisos.length,
      todosLosPermisos: porModulo,
      totalEnSistema: todos.length,
    };
  }
}
