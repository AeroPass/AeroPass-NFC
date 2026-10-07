import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearAsistenciaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estudianteId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  horarioId: number;

  @IsDateString()
  fechaClase: string;

  @IsOptional()
  @IsDateString()
  horaRegistro?: string;

  @IsOptional()
  @IsEnum(['ASISTENCIA', 'TARDANZA', 'JUSTIFICADA', 'ANULADA'])
  resultado?: 'ASISTENCIA' | 'TARDANZA' | 'JUSTIFICADA' | 'ANULADA';

  @IsOptional()
  @IsEnum(['NFC', 'MANUAL', 'IMPORTACION'])
  fuente?: 'NFC' | 'MANUAL' | 'IMPORTACION';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}
