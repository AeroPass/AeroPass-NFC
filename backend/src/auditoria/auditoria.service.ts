import { Injectable } from '@nestjs/common';
import { CreateAuditoriaDto } from './dto/create-auditoria.dto';
import { UpdateAuditoriaDto } from './dto/update-auditoria.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Auditoria } from './entities/auditoria.entity';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly repository:
      Repository<Auditoria>,
  ) {}

  async registrar(data: {
    usuarioId?: string | null;
    dispositivoId?: string | null;
    accion: string;
    entidad: string;
    entidadId?: string | null;
    resultado?: string | null;
    datosAntes?: object | null;
    datosDespues?: object | null;
    detalle?: string | null;
  }) {
    const evento =
      this.repository.create({
        usuarioId: data.usuarioId ?? null,
        dispositivoId: data.dispositivoId ?? null,
        accion: data.accion,
        entidad: data.entidad,
        entidadId: data.entidadId ?? null,
        resultado: data.resultado ?? null,
        datosAntes: data.datosAntes ?? null,
        datosDespues: data.datosDespues ?? null,
        detalle: data.detalle ?? null,
      });

    return this.repository.save(evento);
  }
}