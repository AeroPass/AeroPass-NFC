import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AsignarTarjetaDto {
  @ApiProperty({ description: 'ID del estudiante existente', example: 4, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estudianteId!: number;

  @ApiProperty({ description: 'ID interno de la tarjeta ya registrada', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tarjetaId!: number;

  @ApiPropertyOptional({ description: 'Motivo o referencia de la asignación', maxLength: 255, example: 'Asignación inicial' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(255)
  motivo?: string;
}
