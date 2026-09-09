import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ActualizarTarjetaDto {
  @IsOptional()
  @IsDateString()
  fechaEmision?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}

