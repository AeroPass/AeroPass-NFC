import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  tipoDocumentoId: number;

  @ApiProperty({ example: '1000000002' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  documento: string;

  @ApiProperty({ example: 'Juan Carlos' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  apellidos: string;

  @ApiPropertyOptional({ example: 'juan@institucion.edu.co' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiProperty({ example: 'docente1' })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  username: string;

  @ApiProperty({ example: 'Docente123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 2, description: 'ID de ADMIN, ADMINISTRATIVO o DOCENTE. ESTUDIANTE no está permitido.' })
  @IsInt()
  @Min(1)
  rolId: number;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO', 'BLOQUEADO'], default: 'ACTIVO' })
  @IsOptional()
  @IsEnum(['ACTIVO', 'INACTIVO', 'BLOQUEADO'])
  estado?: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
}
