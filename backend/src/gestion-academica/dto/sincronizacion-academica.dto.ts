import { ApiPropertyOptional } from '@nestjs/swagger';
export class SincronizacionAcademicaDto { @ApiPropertyOptional({ description: 'Se reserva para compatibilidad de solicitudes futuras.' }) forzada?: boolean; }
