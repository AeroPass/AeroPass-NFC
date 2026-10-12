import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

const resultados = [
  'ASISTENCIA',
  'TARDANZA',
  'JUSTIFICADA',
  'ANULADA',
] as const;

export class ConsultarAsistenciaDto {
  @ApiPropertyOptional({ description: 'Fecha inicial del rango de consulta', example: '2026-10-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Fecha final del rango de consulta', example: '2026-10-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID del estudiante', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estudianteId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por ID del horario', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  horarioId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por ID del docente', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  docenteId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por ID de la materia', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  materiaId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por ID del grupo', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  grupoId?: number;

  @ApiPropertyOptional({ enum: resultados })
  @IsOptional()
  @IsEnum(resultados)
  resultado?: (typeof resultados)[number];

  @ApiPropertyOptional({ description: 'Número de página', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina = 1;

  @ApiPropertyOptional({ description: 'Cantidad de registros por página', default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite = 50;
}
