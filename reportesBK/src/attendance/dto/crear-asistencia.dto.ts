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
  @IsInt()
  @Min(1)
  estudianteId: number;

  @IsInt()
  @Min(1)
  horarioId: number;

  @IsDateString()
  fechaClase: string;

  @IsOptional()
  @IsDateString()
  horaRegistro?: string;

  @IsOptional()
  @IsEnum(resultados)
  resultado?: (typeof resultados)[number];

  @IsOptional()
  @IsEnum(fuentes)
  fuente?: (typeof fuentes)[number];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}
