import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ActualizarTarjetaDto } from './dto/actualizar-tarjeta.dto';
import { CambiarEstadoTarjetaDto } from './dto/cambiar-estado-tarjeta.dto';
import { CrearTarjetaDto } from './dto/crear-tarjeta.dto';
import { TarjetasService } from './tarjetas.service';

@Controller('tarjetas')
export class TarjetasController {
  constructor(
    private readonly tarjetasService: TarjetasService,
  ) {}

  @Post()
  crear(@Body() dto: CrearTarjetaDto) {
    return this.tarjetasService.crear(dto);
  }

  @Get()
  obtenerTodas() {
    return this.tarjetasService.obtenerTodas();
  }

  @Get('uid/:uid')
  obtenerPorUid(@Param('uid') uid: string) {
    return this.tarjetasService.obtenerPorUid(uid);
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.tarjetasService.obtenerPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarTarjetaDto,
  ) {
    return this.tarjetasService.actualizar(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id') id: string,
    @Body() dto: CambiarEstadoTarjetaDto,
  ) {
    return this.tarjetasService.cambiarEstado(id, dto);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id') id: string) {
    return this.tarjetasService.desactivar(id);
  }

  @Patch(':id/reactivar')
  reactivar(@Param('id') id: string) {
    return this.tarjetasService.reactivar(id);
  }

  @Patch(':id/bloquear')
  bloquear(@Param('id') id: string) {
    return this.tarjetasService.bloquear(id);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.tarjetasService.eliminar(id);
  }
}
