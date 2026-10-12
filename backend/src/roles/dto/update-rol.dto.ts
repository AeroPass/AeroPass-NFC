import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRolDto {
  @ApiPropertyOptional({ description: 'Descripción administrativa del rol' })
  @IsOptional() @IsString() @MaxLength(255) descripcion?: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'] })
  @IsOptional() @IsEnum(['ACTIVO', 'INACTIVO']) estado?: string;
}
