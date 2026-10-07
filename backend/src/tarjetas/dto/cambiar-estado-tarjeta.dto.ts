import { IsEnum } from 'class-validator';
import { EstadoTarjeta } from '../entities/tarjeta.entity';

export class CambiarEstadoTarjetaDto {
  @IsEnum(EstadoTarjeta)
  estado: EstadoTarjeta;
}
