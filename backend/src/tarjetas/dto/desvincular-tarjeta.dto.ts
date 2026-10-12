import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DesvincularTarjetaDto {
  @ApiPropertyOptional({ description: 'Motivo de la desvinculación', maxLength: 255, example: 'Reposición por pérdida' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(255)
  motivo?: string;
}
