import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditoriaEvento } from '../entities/auditoria-evento.entity.js';

export interface AuditLogParams {
  accion:
    | 'CREATE'
    | 'READ'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'ACCESS_DENIED'
    | 'NFC_SCAN'
    | 'CONFIG_CHANGE';
  entidad: string;
  usuarioId?: number | null;
  entidadId?: string | null;
  resultado?: string | null;
  detalle?: string | null;
  direccionIp?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditoriaEvento)
    private readonly auditRepo: Repository<AuditoriaEvento>,
  ) {}

  /**
   * Registra un evento de auditoría.
   * NUNCA lanza errores: un fallo de auditoría no debe romper el flujo principal
   * (p. ej. un login correcto no puede fallar porque fallara la auditoría).
   */
  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.auditRepo.insert({
        accion: params.accion,
        entidad: params.entidad,
        usuarioId: params.usuarioId ?? null,
        entidadId: params.entidadId ?? null,
        resultado: params.resultado ?? null,
        detalle: params.detalle ? params.detalle.slice(0, 1000) : null,
        direccionIp: params.direccionIp ? params.direccionIp.slice(0, 45) : null,
        userAgent: params.userAgent ? params.userAgent.slice(0, 500) : null,
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo registrar el evento de auditoría (${params.accion} / ${params.entidad}): ${
          (error as Error)?.message ?? error
        }`,
      );
    }
  }
}
