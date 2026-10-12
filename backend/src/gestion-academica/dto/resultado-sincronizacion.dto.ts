import { ApiProperty } from '@nestjs/swagger';

export class ResultadoSincronizacionDto {
  @ApiProperty({ description: 'Fecha y hora de inicio de la sincronización', format: 'date-time' })
  iniciadoEn!: string;

  @ApiProperty({ description: 'Fecha y hora de finalización de la sincronización', format: 'date-time' })
  finalizadoEn!: string;

  @ApiProperty({
    description: 'Cantidad de registros procesados agrupados por entidad',
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { estudiantes: 25, docentes: 8 },
  })
  registrosProcesados!: Record<string, number>;
}
