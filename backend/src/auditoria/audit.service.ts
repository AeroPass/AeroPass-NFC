import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from './entities/auditoria.entity';

export interface AuditLogParams {
  accion: 'CREATE'|'READ'|'UPDATE'|'DELETE'|'LOGIN'|'LOGOUT'|'ACCESS_DENIED'|'NFC_SCAN'|'CONFIG_CHANGE';
  entidad: string;
  usuarioId?: number | null;
  dispositivoId?: number | null;
  entidadId?: string | null;
  resultado?: string | null;
  detalle?: string | null;
  direccionIp?: string | null;
  userAgent?: string | null;
  datosAntes?: object | null;
  datosDespues?: object | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(@InjectRepository(Auditoria) private readonly auditRepo: Repository<Auditoria>) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.auditRepo.insert({
        accion: params.accion, entidad: params.entidad, usuarioId: params.usuarioId ?? null,
        dispositivoId: params.dispositivoId ?? null, entidadId: params.entidadId ?? null,
        resultado: params.resultado ?? null, detalle: params.detalle?.slice(0, 1000) ?? null,
        direccionIp: params.direccionIp?.slice(0, 45) ?? null, userAgent: params.userAgent?.slice(0, 500) ?? null,
        datosAntes: params.datosAntes ?? null, datosDespues: params.datosDespues ?? null,
      });
    } catch (error) {
      this.logger.warn(`No se pudo registrar auditoría: ${(error as Error)?.message ?? error}`);
    }
  }
}
