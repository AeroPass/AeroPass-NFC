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
  @IsString()
  @IsNotEmpty()
  @Length(8, 64)
  @Matches(/^[0-9A-Fa-f]+$/, {
    message: 'El UID debe contener únicamente caracteres hexadecimales',
  })
  uid!: string;

  @IsOptional()
  @IsDateString()
  fechaEmision?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}


