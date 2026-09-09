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

export class AttendanceReportQueryDto {
  @IsOptional()
  @IsEnum(formatosReporte)
  formato?: (typeof formatosReporte)[number];

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  asignacionDocenteId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  docenteId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  materiaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  grupoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estudianteId?: number;

  @IsOptional()
  @IsEnum(resultadosAsistencia)
  resultado?: (typeof resultadosAsistencia)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite = 100;
}
