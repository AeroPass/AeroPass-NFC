import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsOptional, MinLength, MaxLength, IsEnum } from 'class-validator';

export class CreateRolDto {
  @ApiProperty({ example: 'COORDINADOR' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  codigo: string;

  @ApiProperty({ example: 'Coordinador Académico' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
  @IsOptional()
  @IsEnum(['ACTIVO', 'INACTIVO'])
  estado?: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  permisosIds?: number[];
}
