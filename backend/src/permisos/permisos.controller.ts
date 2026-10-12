import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { PermisosService } from './permisos.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PermisosQueryDto } from './dto/permisos-query.dto';

@ApiTags('Permisos')
@ApiBearerAuth()
@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Get()
  // Antes cualquier usuario autenticado (incluso ESTUDIANTE) podía listar TODOS
  // los permisos del sistema. Ahora se exige el permiso de gestión.
  // Si tu frontend de docente necesita este endpoint, cambia a 'AUTH_LOGIN'.
  @RequirePermissions('PERMISOS_GESTIONAR')
  @ApiOperation({ summary: 'Listar permisos (requiere PERMISOS_GESTIONAR)' })
  @ApiOkResponse({ description: 'Listado de permisos que coinciden con los filtros' })
  findAll(@CurrentUser() user: any, @Query() query: PermisosQueryDto) {
    return this.permisosService.findAll(user, query);
  }
}
