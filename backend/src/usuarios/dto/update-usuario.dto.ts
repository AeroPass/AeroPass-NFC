import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ description: 'Nombres' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombres?: string;

  @ApiPropertyOptional({ description: 'Apellidos' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  apellidos?: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Teléfono' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ description: 'Nueva contraseña (mínimo 6 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'ID del nuevo rol' })
  @IsOptional()
  @IsNumber()
  rolId?: number;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO', 'BLOQUEADO'] })
  @IsOptional()
  @IsEnum(['ACTIVO', 'INACTIVO', 'BLOQUEADO'])
  estado?: string;
}
