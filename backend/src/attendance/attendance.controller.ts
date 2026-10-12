import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { ConsultarAsistenciaDto } from './dto/consultar-asistencia.dto';
import { CrearAsistenciaDto } from './dto/crear-asistencia.dto';
import { TapNfcDto } from './dto/tap-nfc.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('Asistencia')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token Bearer ausente, inválido o expirado' })
@ApiForbiddenResponse({ description: 'Rol o permisos insuficientes' })
@Controller('asistencia')
export class AttendanceController {
  constructor(private readonly asistencia: AttendanceService) {}

  @Post('tap')
  @Roles(Role.ADMIN)
  @RequirePermissions('ASISTENCIAS_NFC')
  @ApiOperation({ summary: 'Registrar un tap NFC en tiempo real' })
  @ApiBody({ type: TapNfcDto })
  @ApiCreatedResponse({ description: 'Tap validado contra tarjeta, matrícula, periodo, grupo y horario vigente' })
  @ApiResponse({ status: 400, description: 'Identificador de tarjeta o dispositivo inválido' })
  @ApiResponse({ status: 404, description: 'Tarjeta o dispositivo no registrado' })
  @ApiResponse({ status: 409, description: 'Tarjeta no asignada, horario no vigente o asistencia ya registrada' })
  @ApiTooManyRequestsResponse({ description: 'Tap repetido dentro del intervalo anti-duplicados' })
  registrarTapNfc(@Body() dto: TapNfcDto) {
    return this.asistencia.tapNfc(dto);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DOCENTE, Role.ADMINISTRATIVO)
  @RequirePermissions('ASISTENCIAS_EDITAR')
  @ApiOperation({ summary: 'Registrar una asistencia manual' })
  @ApiBody({ type: CrearAsistenciaDto })
  @ApiCreatedResponse({ description: 'Asistencia registrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o referencias inexistentes' })
  @ApiResponse({ status: 409, description: 'La asistencia ya existe o está referenciada' })
  crear(@Body() dto: CrearAsistenciaDto) {
    return this.asistencia.crear(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DOCENTE, Role.ADMINISTRATIVO)
  @RequirePermissions('ASISTENCIAS_LEER')
  @ApiOperation({ summary: 'Consultar asistencias con filtros y paginación' })
  @ApiOkResponse({ description: 'Resultados de asistencia para los filtros indicados' })
  consultar(@Query() query: ConsultarAsistenciaDto) {
    return this.asistencia.consultar(query);
  }
}
