import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permiso } from './entities/permiso.entity';
import { PermisosQueryDto } from './dto/permisos-query.dto';

@Injectable()
export class PermisosService {
  constructor(@InjectRepository(Permiso) private readonly permisoRepo: Repository<Permiso>) {}

  async findAll(user: any, query: PermisosQueryDto = {}) {
    const qb = this.permisoRepo.createQueryBuilder('p')
      .where('p.estado = :estado', { estado: 'ACTIVO' })
      .orderBy('p.modulo', 'ASC').addOrderBy('p.codigo', 'ASC');
    if (query.modulo) qb.andWhere('p.modulo = :modulo', { modulo: query.modulo });
    if (query.q) qb.andWhere('(p.codigo LIKE :q OR p.nombre LIKE :q)', { q: `%${query.q}%` });
    const todos = await qb.getMany();
    const porModulo: Record<string, any[]> = {};
    for (const permiso of todos) (porModulo[permiso.modulo] ??= []).push(permiso);
    return {
      usuario: { id: user.id, username: user.username, nombreCompleto: user.persona?.nombreCompleto, rol: user.rol },
      permisosAsignados: user.permisos || [],
      totalAsignados: (user.permisos || []).length,
      todosLosPermisos: porModulo,
      totalEnSistema: todos.length,
    };
  }
}
