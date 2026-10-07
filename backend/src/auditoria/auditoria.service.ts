import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditoriaQueryDto } from './dto/auditoria-query.dto';
import { Auditoria } from './entities/auditoria.entity';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(@InjectRepository(Auditoria) private readonly repo: Repository<Auditoria>) {}

  async registrar(data: {
    usuarioId?: number | null;
    dispositivoId?: number | null;
    accion: string;
    entidad: string;
    entidadId?: string | null;
    resultado?: string | null;
    datosAntes?: object | null;
    datosDespues?: object | null;
    detalle?: string | null;
    direccionIp?: string | null;
    userAgent?: string | null;
  }) {
    const evento = this.repo.create({
      usuarioId: data.usuarioId ?? null,
      dispositivoId: data.dispositivoId ?? null,
      accion: data.accion,
      entidad: data.entidad,
      entidadId: data.entidadId ?? null,
      resultado: data.resultado ?? null,
      datosAntes: data.datosAntes ?? null,
      datosDespues: data.datosDespues ?? null,
      detalle: data.detalle ?? null,
      direccionIp: data.direccionIp ?? null,
      userAgent: data.userAgent ?? null,
    });
    try {
      await this.repo.save(evento);
    } catch (error) {
      this.logger.warn(
        `No se pudo registrar el evento de auditoría: ${(error as Error)?.message ?? error}`,
      );
    }
  }

  async findAll(queryDto: AuditoriaQueryDto) {
    const query = this.repo.createQueryBuilder('a');
    if (queryDto.desde) query.andWhere('a.fecha_hora >= :desde', { desde: queryDto.desde });
    if (queryDto.hasta) query.andWhere('a.fecha_hora <= :hasta', { hasta: queryDto.hasta });
    if (queryDto.usuarioId) query.andWhere('a.usuario_id = :usuarioId', { usuarioId: queryDto.usuarioId });
    if (queryDto.accion) query.andWhere('a.accion = :accion', { accion: queryDto.accion });
    if (queryDto.entidad) query.andWhere('a.entidad = :entidad', { entidad: queryDto.entidad });

    const total = await query.clone().getCount();
    const registros = await query
      .orderBy('a.fecha_hora', 'DESC')
      .offset((queryDto.pagina - 1) * queryDto.limite)
      .limit(queryDto.limite)
      .getMany();

    return {
      registros,
      total,
      pagina: queryDto.pagina,
      limite: queryDto.limite,
      totalPaginas: Math.ceil(total / queryDto.limite),
    };
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }
}
