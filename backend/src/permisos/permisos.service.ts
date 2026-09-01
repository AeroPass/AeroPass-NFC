import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permiso } from '../entities/permiso.entity.js';

@Injectable()
export class PermisosService {
  constructor(@InjectRepository(Permiso) private permisoRepo: Repository<Permiso>) {}

  /**
   * GET /permisos
   * Devuelve los permisos del usuario actual + todos los permisos del sistema
   * agrupados por módulo.
   */
  async findAll(user: any) {
    const todos = await this.permisoRepo.find({
      where: { estado: 'ACTIVO' },
      order: { modulo: 'ASC', codigo: 'ASC' },
    });

    const porModulo: Record<string, any[]> = {};
    for (const p of todos) {
      if (!porModulo[p.modulo]) porModulo[p.modulo] = [];
      porModulo[p.modulo].push(p);
    }

    return {
      usuario: {
        id: user.id,
        username: user.username,
        nombreCompleto: user.persona?.nombreCompleto,
        rol: user.rol,
      },
      permisosAsignados: user.permisos || [],
      totalAsignados: (user.permisos || []).length,
      todosLosPermisos: porModulo,
      totalEnSistema: todos.length,
    };
  }
}
