import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { ActualizarTarjetaDto } from './dto/actualizar-tarjeta.dto';
import { CambiarEstadoTarjetaDto } from './dto/cambiar-estado-tarjeta.dto';
import { CrearTarjetaDto } from './dto/crear-tarjeta.dto';
import { TarjetasService } from './tarjetas.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('Tarjetas NFC')
@ApiBearerAuth()
@Controller('tarjetas')
@Roles(Role.ADMIN, Role.ADMINISTRATIVO)
export class TarjetasController {
  constructor(private readonly tarjetasService: TarjetasService) { }

  @Post()
  @RequirePermissions('TARJETAS_GESTIONAR')
  @ApiOperation({ summary: 'Registrar una tarjeta NFC' })
  @ApiBody({ type: CrearTarjetaDto })
  @ApiCreatedResponse({ description: 'Tarjeta registrada' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'Ya existe una tarjeta con ese UID' })
  crear(@Body() dto: CrearTarjetaDto) { return this.tarjetasService.crear(dto); }

  @Get()
  @RequirePermissions('TARJETAS_LEER')
  @ApiOperation({ summary: 'Listar todas las tarjetas NFC' })
  @ApiOkResponse({ description: 'Listado de tarjetas' })
  obtenerTodas() { return this.tarjetasService.obtenerTodas(); }

  @Get('uid/:uid')
  @RequirePermissions('TARJETAS_LEER')
  @ApiOperation({ summary: 'Buscar una tarjeta por UID' })
  @ApiParam({ name: 'uid', description: 'UID hexadecimal de la tarjeta', example: '04A1B2C3' })
  @ApiOkResponse({ description: 'Tarjeta encontrada' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  obtenerPorUid(@Param('uid') uid: string) { return this.tarjetasService.obtenerPorUid(uid); }

  @Get(':id')
  @RequirePermissions('TARJETAS_LEER')
  @ApiOperation({ summary: 'Buscar una tarjeta por ID' })
  @ApiParam({ name: 'id', description: 'ID de la tarjeta' })
  @ApiOkResponse({ description: 'Tarjeta encontrada' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  obtenerPorId(@Param('id') id: string) { return this.tarjetasService.obtenerPorId(id); }

  @Patch(':id')
  @RequirePermissions('TARJETAS_GESTIONAR')
  @ApiOperation({ summary: 'Actualizar los datos de una tarjeta' })
  @ApiParam({ name: 'id', description: 'ID de la tarjeta' })
  @ApiBody({ type: ActualizarTarjetaDto })
  @ApiOkResponse({ description: 'Tarjeta actualizada' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  actualizar(@Param('id') id: string, @Body() dto: ActualizarTarjetaDto) { return this.tarjetasService.actualizar(id, dto); }

  @Patch(':id/estado')
  @RequirePermissions('TARJETAS_GESTIONAR')
  @ApiOperation({ summary: 'Cambiar el estado de una tarjeta' })
  @ApiParam({ name: 'id', description: 'ID de la tarjeta' })
  @ApiBody({ type: CambiarEstadoTarjetaDto })
  @ApiOkResponse({ description: 'Estado actualizado' })
  @ApiResponse({ status: 400, description: 'Estado no válido' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoTarjetaDto) { return this.tarjetasService.cambiarEstado(id, dto); }

  @Patch(':id/desactivar')
  @RequirePermissions('TARJETAS_GESTIONAR')
  @ApiOperation({ summary: 'Desactivar una tarjeta' })
  @ApiParam({ name: 'id', description: 'ID de la tarjeta' })
  @ApiOkResponse({ description: 'Tarjeta desactivada' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  desactivar(@Param('id') id: string) { return this.tarjetasService.desactivar(id); }

  @Patch(':id/reactivar')
  @RequirePermissions('TARJETAS_GESTIONAR')
  @ApiOperation({ summary: 'Reactivar una tarjeta' })
  @ApiParam({ name: 'id', description: 'ID de la tarjeta' })
  @ApiOkResponse({ description: 'Tarjeta reactivada' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  reactivar(@Param('id') id: string) { return this.tarjetasService.reactivar(id); }

  @Patch(':id/bloquear')
  @RequirePermissions('TARJETAS_GESTIONAR')
  @ApiOperation({ summary: 'Bloquear una tarjeta' })
  @ApiParam({ name: 'id', description: 'ID de la tarjeta' })
  @ApiOkResponse({ description: 'Tarjeta bloqueada' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  bloquear(@Param('id') id: string) { return this.tarjetasService.bloquear(id); }

  @Delete(':id')
  @RequirePermissions('TARJETAS_GESTIONAR')
  @ApiOperation({ summary: 'Eliminar una tarjeta' })
  @ApiParam({ name: 'id', description: 'ID de la tarjeta' })
  @ApiOkResponse({ description: 'Tarjeta eliminada' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  eliminar(@Param('id') id: string) { return this.tarjetasService.eliminar(id); }
}
