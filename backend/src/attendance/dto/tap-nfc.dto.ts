import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Matches, Min } from 'class-validator';

export class TapNfcDto {
  @ApiProperty({
    description: 'Identificador/token de la tarjeta previamente registrada; no representa el campo de telemetría uid_leido.',
    example: '04A82391BC7280',
    minLength: 8,
    maxLength: 64,
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9A-F]{8,64}$/, { message: 'identificadorTarjeta debe contener entre 8 y 64 caracteres hexadecimales.' })
  identificadorTarjeta!: string;

  @ApiProperty({ description: 'ID de un dispositivo NFC registrado y activo', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dispositivoId!: number;
}
