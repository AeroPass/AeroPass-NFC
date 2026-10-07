import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RoleCode } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { ConsultarAsistenciaDto } from './dto/consultar-asistencia.dto';
import { CrearAsistenciaDto } from './dto/crear-asistencia.dto';
import { AttendanceService } from './attendance.service';

@ApiTags('Asistencia')
@ApiBearerAuth()
@Roles(RoleCode.ADMIN, RoleCode.ADMINISTRATIVO, RoleCode.DOCENTE)
@Controller('asistencia')
export class AttendanceController {
  constructor(private readonly asistencia: AttendanceService) {}

  @Get()
  @RequirePermissions('ASISTENCIAS_LEER')
  consultar(@Query() query: ConsultarAsistenciaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.asistencia.consultar(query, user);
  }

  @Post()
  @RequirePermissions('ASISTENCIAS_EDITAR')
  crear(@Body() dto: CrearAsistenciaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.asistencia.crear(dto, user);
  }
}
