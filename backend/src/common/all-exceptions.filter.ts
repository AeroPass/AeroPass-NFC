import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Filtro global de excepciones:
 * - Deja pasar tal cual las HttpException controladas (401, 403, 404, 409...).
 * - Traduce errores comunes de MySQL a respuestas limpias (409 duplicados, etc.)
 *   en lugar de dejar escapar 500 crudos con detalles internos.
 * - Registra el stack de errores no controlados en el log del servidor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest() as { method?: string; url?: string };

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      return response.status(status).json(
        typeof body === 'string' ? { statusCode: status, message: body } : body,
      );
    }

    const dbError = exception as { code?: string; sqlMessage?: string };

    switch (dbError?.code) {
      case 'ER_DUP_ENTRY':
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'El registro ya existe (valor duplicado).',
        });

      case 'ER_NO_REFERENCED_ROW_2':
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'La operación hace referencia a un registro que no existe.',
        });

      case 'ER_ROW_IS_REFERENCED_2':
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'No se puede completar: el registro está referenciado por otros datos.',
        });

      case 'ECONNREFUSED':
        return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'No hay conexión con la base de datos.',
        });
    }

    this.logger.error(
      `Error no controlado en ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor.',
    });
  }
}
