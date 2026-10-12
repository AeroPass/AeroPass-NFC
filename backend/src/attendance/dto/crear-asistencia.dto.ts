import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const resultados = [
  'ASISTENCIA',
  'TARDANZA',
  'JUSTIFICADA',
  'ANULADA',
] as const;
const fuentes = ['NFC', 'MANUAL', 'IMPORTACION'] as const;

export class CrearAsistenciaDto {
  @ApiProperty({ description: 'ID del estudiante', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estudianteId!: number;

  @ApiProperty({ description: 'ID del horario académico', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  horarioId!: number;

  @ApiProperty({ description: 'Fecha de la clase', example: '2026-10-12', format: 'date' })
  @IsDateString()
  fechaClase!: string;

  @ApiPropertyOptional({ description: 'Fecha y hora en que se registró la asistencia', example: '2026-10-12T08:05:00Z' })
  @IsOptional()
  @IsDateString()
  horaRegistro?: string;

  @ApiPropertyOptional({ enum: resultados, example: 'ASISTENCIA' })
  @IsOptional()
  @IsEnum(resultados)
  resultado?: (typeof resultados)[number];

  @ApiPropertyOptional({ enum: fuentes, example: 'NFC' })
  @IsOptional()
  @IsEnum(fuentes)
  fuente?: (typeof fuentes)[number];

  @ApiPropertyOptional({ description: 'Observaciones', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}
