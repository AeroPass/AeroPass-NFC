import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min, IsString } from 'class-validator';

export class AuditoriaQueryDto {
  @ApiPropertyOptional({ enum: ['LOGIN','LOGOUT','ACCESS_DENIED','NFC_SCAN','CREATE','READ','UPDATE','DELETE','CONFIG_CHANGE'] })
  @IsOptional() @IsEnum(['LOGIN','LOGOUT','ACCESS_DENIED','NFC_SCAN','CREATE','READ','UPDATE','DELETE','CONFIG_CHANGE']) accion?: string;
  @ApiPropertyOptional({ description: 'Filtrar por nombre de entidad' })
  @IsOptional() @IsString() entidad?: string;
  @ApiPropertyOptional({ description: 'Filtrar por ID del usuario', minimum: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) usuarioId?: number;
  @ApiPropertyOptional({ description: 'Fecha inicial del rango', format: 'date' })
  @IsOptional() @IsDateString() desde?: string;
  @ApiPropertyOptional({ description: 'Fecha final del rango', format: 'date' })
  @IsOptional() @IsDateString() hasta?: string;
  @ApiPropertyOptional({ description: 'Número de página', default: 1, minimum: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina = 1;
  @ApiPropertyOptional({ description: 'Cantidad de registros por página', default: 50, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limite = 50;
}
