import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UsuariosQueryDto {
  @IsOptional()
  @IsString()
  rol?: string;

  @IsOptional()
  @IsEnum(['ACTIVO', 'INACTIVO', 'BLOQUEADO'])
  estado?: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

  @IsOptional()
  @IsString()
  q?: string;

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
  limite = 50;
}
