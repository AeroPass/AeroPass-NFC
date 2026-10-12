import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EstadoTarjeta } from '../entities/tarjeta.entity';

export class CambiarEstadoTarjetaDto {
  @ApiProperty({ enum: EstadoTarjeta, example: EstadoTarjeta.ACTIVA })
  @IsEnum(EstadoTarjeta, {
    message: 'El estado debe ser ACTIVA, BLOQUEADA o INACTIVA',
  })
  estado!: EstadoTarjeta;
}
