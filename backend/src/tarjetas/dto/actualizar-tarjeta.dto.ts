import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ActualizarTarjetaDto {
  @ApiPropertyOptional({ description: 'Nueva fecha de emisión', example: '2026-10-12' })
  @IsOptional()
  @IsDateString()
  fechaEmision?: string;

  @ApiPropertyOptional({ description: 'Observaciones de la tarjeta', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}
