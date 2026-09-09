import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermisosService } from './permisos.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RequirePermissions } from '../auth/permissions.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('Permisos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Get()
  // Antes cualquier usuario autenticado (incluso ESTUDIANTE) podía listar TODOS
  // los permisos del sistema. Ahora se exige el permiso de gestión.
  // Si tu frontend de docente necesita este endpoint, cambia a 'AUTH_LOGIN'.
  @RequirePermissions('PERMISOS_GESTIONAR')
  @ApiOperation({ summary: 'Listar permisos (requiere PERMISOS_GESTIONAR)' })
  findAll(@CurrentUser() user: any) {
    return this.permisosService.findAll(user);
  }
}
