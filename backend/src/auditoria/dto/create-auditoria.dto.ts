import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAuditoriaDto {
  @IsString()
  @MaxLength(40)
  accion: string;

  @IsString()
  @MaxLength(80)
  entidad: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  entidadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  resultado?: string;

  @IsOptional()
  @IsObject()
  datosAntes?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  datosDespues?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  detalle?: string;
}
