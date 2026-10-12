import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
export class PermisosQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por módulo', maxLength: 60 })
  @IsOptional() @IsString() @MaxLength(60) modulo?: string;

  @ApiPropertyOptional({ description: 'Buscar por texto', maxLength: 80 })
  @IsOptional() @IsString() @MaxLength(80) q?: string;
}
