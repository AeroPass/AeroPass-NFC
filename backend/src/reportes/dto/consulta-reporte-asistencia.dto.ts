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

const resultadosAsistencia = [
  'ASISTENCIA',
  'TARDANZA',
  'JUSTIFICADA',
  'ANULADA',
] as const;
const formatosReporte = ['csv', 'pdf'] as const;

export class ConsultaReporteAsistenciaDto {
  @ApiPropertyOptional({ description: 'Formato de archivo para la exportación', enum: ['csv', 'pdf'], default: 'csv' })
  @IsOptional()
  @IsEnum(formatosReporte)
  formato?: (typeof formatosReporte)[number];

  @ApiPropertyOptional({ description: 'Fecha inicial del rango', example: '2026-10-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Fecha final del rango', example: '2026-10-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de asignación docente', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  asignacionDocenteId?: number;

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

  @ApiPropertyOptional({ description: 'Filtrar por ID del estudiante', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estudianteId?: number;

  @ApiPropertyOptional({ enum: resultadosAsistencia })
  @IsOptional()
  @IsEnum(resultadosAsistencia)
  resultado?: (typeof resultadosAsistencia)[number];

  @ApiPropertyOptional({ description: 'Número de página', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina = 1;

  @ApiPropertyOptional({ description: 'Cantidad de registros por página', default: 100, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite = 100;
}
