import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 1, description: 'ID del tipo de documento' })
  @IsNumber()
  tipoDocumentoId: number;

  @ApiProperty({ example: '1000000002', description: 'Número de documento' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  documento: string;

  @ApiProperty({ example: 'Juan Carlos', description: 'Nombres' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellidos' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  apellidos: string;

  @ApiPropertyOptional({ example: 'juan@nfc.edu', description: 'Email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '3001234567', description: 'Teléfono' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ example: 'docente1', description: 'Nombre de usuario (único)' })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  username: string;

  @ApiProperty({ example: 'doc123', description: 'Contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 2, description: 'ID del rol a asignar' })
  @IsNumber()
  rolId: number;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO', 'BLOQUEADO'], default: 'ACTIVO' })
  @IsOptional()
  @IsEnum(['ACTIVO', 'INACTIVO', 'BLOQUEADO'])
  estado?: string;
}
