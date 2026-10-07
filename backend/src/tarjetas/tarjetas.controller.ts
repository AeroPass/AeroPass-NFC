import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RoleCode } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { ActualizarTarjetaDto } from './dto/actualizar-tarjeta.dto';
import { CambiarEstadoTarjetaDto } from './dto/cambiar-estado-tarjeta.dto';
import { CrearTarjetaDto } from './dto/crear-tarjeta.dto';
import { TarjetasService } from './tarjetas.service';

@ApiTags('Tarjetas NFC')
@ApiBearerAuth()
@Roles(RoleCode.ADMIN, RoleCode.ADMINISTRATIVO)
@Controller('tarjetas')
export class TarjetasController {
  constructor(private readonly tarjetas: TarjetasService) {}

  @Get()
  @RequirePermissions('TARJETAS_LEER')
  obtenerTodas() { return this.tarjetas.obtenerTodas(); }

  @Get('uid/:uid')
  @RequirePermissions('TARJETAS_LEER')
  obtenerPorUid(@Param('uid') uid: string) { return this.tarjetas.obtenerPorUid(uid); }

  @Get(':id')
  @RequirePermissions('TARJETAS_LEER')
  obtenerPorId(@Param('id') id: string) { return this.tarjetas.obtenerPorId(id); }

  @Post()
  @RequirePermissions('TARJETAS_GESTIONAR')
  crear(@Body() dto: CrearTarjetaDto) { return this.tarjetas.crear(dto); }

  @Patch(':id')
  @RequirePermissions('TARJETAS_GESTIONAR')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarTarjetaDto) { return this.tarjetas.actualizar(id, dto); }

  @Patch(':id/estado')
  @RequirePermissions('TARJETAS_GESTIONAR')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoTarjetaDto) { return this.tarjetas.cambiarEstado(id, dto); }

  @Patch(':id/desactivar')
  @RequirePermissions('TARJETAS_GESTIONAR')
  desactivar(@Param('id') id: string) { return this.tarjetas.desactivar(id); }

  @Patch(':id/reactivar')
  @RequirePermissions('TARJETAS_GESTIONAR')
  reactivar(@Param('id') id: string) { return this.tarjetas.reactivar(id); }

  @Patch(':id/bloquear')
  @RequirePermissions('TARJETAS_GESTIONAR')
  bloquear(@Param('id') id: string) { return this.tarjetas.bloquear(id); }

  @Delete(':id')
  @RequirePermissions('TARJETAS_GESTIONAR')
  eliminar(@Param('id') id: string) { return this.tarjetas.eliminar(id); }
}
