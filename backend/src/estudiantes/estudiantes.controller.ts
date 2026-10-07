import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RoleCode } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { EstudianteQueryDto } from './dto/estudiante-query.dto';
import { EstudiantesService } from './estudiantes.service';

@ApiTags('Estudiantes')
@ApiBearerAuth()
@Roles(RoleCode.ADMIN, RoleCode.ADMINISTRATIVO, RoleCode.DOCENTE)
@RequirePermissions('ASISTENCIAS_LEER')
@Controller('estudiantes')
export class EstudiantesController {
  constructor(private readonly estudiantes: EstudiantesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: EstudianteQueryDto) {
    return this.estudiantes.findAll(user, query);
  }
}
