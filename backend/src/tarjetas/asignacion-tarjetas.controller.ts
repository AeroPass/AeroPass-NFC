import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Role } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AsignarTarjetaDto } from './dto/asignar-tarjeta.dto';
import { DesvincularTarjetaDto } from './dto/desvincular-tarjeta.dto';
import { AsignacionTarjetasService } from './asignacion-tarjetas.service';

@ApiTags('Asignación NFC a estudiantes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token Bearer ausente, inválido o expirado' })
@ApiForbiddenResponse({ description: 'El rol o los permisos del usuario no permiten esta operación' })
@Roles(Role.ADMIN, Role.ADMINISTRATIVO)
@Controller('tarjetas/asignaciones')
export class AsignacionTarjetasController {
  constructor(private readonly asignaciones: AsignacionTarjetasService) {}

  @Post()
  @RequirePermissions('TARJETAS_GESTIONAR')
  @ApiOperation({ summary: 'Asignar una tarjeta existente a un estudiante' })
  @ApiBody({ type: AsignarTarjetaDto })
  @ApiCreatedResponse({ description: 'Asignación creada; una tarjeta y un estudiante solo pueden tener una asignación activa.' })
  @ApiBadRequestResponse({ description: 'El cuerpo incumple las validaciones de entrada' })
  @ApiNotFoundResponse({ description: 'No existe la tarjeta o el estudiante indicado' })
  @ApiConflictResponse({ description: 'Tarjeta inactiva, estudiante inactivo o ya existe una asignación activa' })
  asignar(@Body() dto: AsignarTarjetaDto) {
    return this.asignaciones.asignar(dto);
  }

  @Patch(':id/desvincular')
  @RequirePermissions('TARJETAS_GESTIONAR')
  @ApiOperation({ summary: 'Cerrar una asignación de tarjeta sin borrar su historial' })
  @ApiParam({ name: 'id', description: 'ID de la asignación', type: Number, example: 1 })
  @ApiBody({ type: DesvincularTarjetaDto })
  @ApiOkResponse({ description: 'Asignación cerrada con fecha de fin' })
  @ApiBadRequestResponse({ description: 'ID o cuerpo inválido' })
  @ApiNotFoundResponse({ description: 'Asignación no encontrada' })
  @ApiConflictResponse({ description: 'La asignación ya estaba cerrada' })
  desvincular(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DesvincularTarjetaDto,
  ) {
    return this.asignaciones.desvincular(id, dto);
  }

  @Get('estudiante/:estudianteId')
  @RequirePermissions('TARJETAS_LEER')
  @ApiOperation({ summary: 'Consultar si un estudiante tiene una tarjeta activa' })
  @ApiParam({ name: 'estudianteId', description: 'ID interno del estudiante', type: Number, example: 4 })
  @ApiOkResponse({ description: 'Estado de asignación y datos no sensibles de la tarjeta' })
  @ApiBadRequestResponse({ description: 'ID de estudiante inválido' })
  @ApiNotFoundResponse({ description: 'Estudiante no encontrado' })
  estadoEstudiante(@Param('estudianteId', ParseIntPipe) estudianteId: number) {
    return this.asignaciones.estadoEstudiante(estudianteId);
  }
}
