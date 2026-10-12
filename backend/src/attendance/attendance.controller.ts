import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { ConsultarAsistenciaDto } from './dto/consultar-asistencia.dto';
import { CrearAsistenciaDto } from './dto/crear-asistencia.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('Asistencia')
@ApiBearerAuth()
@Controller('asistencia')
export class AttendanceController {
  constructor(private readonly asistencia: AttendanceService) {}

  @Post()
  @Roles(Role.ADMIN, Role.DOCENTE, Role.ADMINISTRATIVO)
  @RequirePermissions('ASISTENCIAS_EDITAR')
  @ApiOperation({ summary: 'Registrar una asistencia' })
  @ApiBody({ type: CrearAsistenciaDto })
  @ApiCreatedResponse({ description: 'Asistencia registrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o referencias inexistentes' })
  @ApiResponse({ status: 409, description: 'La asistencia ya existe o está referenciada' })
  crear(@Body() dto: CrearAsistenciaDto) { return this.asistencia.crear(dto); }

  @Get()
  @Roles(Role.ADMIN, Role.DOCENTE, Role.ADMINISTRATIVO)
  @RequirePermissions('ASISTENCIAS_LEER')
  @ApiOperation({ summary: 'Consultar asistencias con filtros y paginación' })
  @ApiOkResponse({ description: 'Resultados de asistencia para los filtros indicados' })
  consultar(@Query() query: ConsultarAsistenciaDto) { return this.asistencia.consultar(query); }
}
