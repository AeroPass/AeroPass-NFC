import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class SincronizarDatosMaestrosDto {
  @ApiPropertyOptional({ default: true, description: 'Solicita sincronizar los datos maestros académicos.' })
  @IsOptional()
  @IsBoolean()
  ejecutar = true;
}
