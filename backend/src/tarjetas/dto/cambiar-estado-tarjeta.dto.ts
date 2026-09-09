import { IsEnum } from 'class-validator';
import { EstadoTarjeta } from '../entities/tarjeta.entity';

export class CambiarEstadoTarjetaDto {
  @IsEnum(EstadoTarjeta, {
    message: 'El estado debe ser ACTIVA, BLOQUEADA o INACTIVA',
  })
  estado!: EstadoTarjeta;
}
