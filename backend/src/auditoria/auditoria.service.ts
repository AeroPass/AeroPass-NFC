import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from './entities/auditoria.entity';
import { AuditoriaQueryDto } from './dto/auditoria-query.dto';
import { CreateAuditoriaDto } from './dto/create-auditoria.dto';

@Injectable()
export class AuditoriaService {
  constructor(@InjectRepository(Auditoria) private readonly repository: Repository<Auditoria>) {}

  async registrar(data: CreateAuditoriaDto & { direccionIp?: string; userAgent?: string }) {
    return this.repository.save(this.repository.create({
      ...data, direccionIp: data.direccionIp ?? null, userAgent: data.userAgent ?? null,
      entidadId: data.entidadId ?? null, resultado: data.resultado ?? null,
      datosAntes: data.datosAntes ?? null, datosDespues: data.datosDespues ?? null, detalle: data.detalle ?? null,
    }));
  }

  async findAll(query: AuditoriaQueryDto) {
    const qb = this.repository.createQueryBuilder('a');
    if (query.accion) qb.andWhere('a.accion = :accion', { accion: query.accion });
    if (query.entidad) qb.andWhere('a.entidad = :entidad', { entidad: query.entidad });
    if (query.usuarioId) qb.andWhere('a.usuarioId = :usuarioId', { usuarioId: query.usuarioId });
    if (query.desde) qb.andWhere('a.fechaHora >= :desde', { desde: query.desde });
    if (query.hasta) qb.andWhere('a.fechaHora <= :hasta', { hasta: query.hasta });
    const totalRow = await qb.clone().select('COUNT(a.id)', 'total').getRawOne<{ total: string }>();
    const eventos = await qb.orderBy('a.fechaHora', 'DESC').offset((query.pagina - 1) * query.limite).limit(query.limite).getMany();
    return { eventos, total: Number(totalRow?.total ?? 0), pagina: query.pagina, limite: query.limite };
  }
}
