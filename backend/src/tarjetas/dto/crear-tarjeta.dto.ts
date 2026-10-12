import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CrearTarjetaDto {
  @ApiProperty({ description: 'UID hexadecimal único de la tarjeta NFC', example: '04A1B2C3', minLength: 8, maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @Length(8, 64)
  @Matches(/^[0-9A-Fa-f]+$/, {
    message: 'El UID debe contener únicamente caracteres hexadecimales',
  })
  uid!: string;

  @ApiPropertyOptional({ description: 'Fecha de emisión de la tarjeta', example: '2026-10-12' })
  @IsOptional()
  @IsDateString()
  fechaEmision?: string;

  @ApiPropertyOptional({ description: 'Observaciones de la tarjeta', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}

