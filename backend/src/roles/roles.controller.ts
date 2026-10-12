import { Controller, Get, Put, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { UpdateRolDto } from './dto/update-rol.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Roles')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('ROLES_GESTIONAR')
  @ApiOperation({ summary: 'Listar roles' })
  @ApiQuery({ name: 'includePermisos', required: false, type: Boolean })
  @ApiOkResponse({ description: 'Listado de roles; opcionalmente incluye sus permisos' })
  findAll(@Query('includePermisos') includePermisos?: string) {
    return this.rolesService.findAll(includePermisos === 'true');
  }

  @Get(':id')
  @RequirePermissions('ROLES_GESTIONAR')
  @ApiOperation({ summary: 'Obtener rol por ID' })
  @ApiParam({ name: 'id', description: 'ID del rol', type: Number })
  @ApiOkResponse({ description: 'Rol encontrado' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(Number(id));
  }

  @Put(':id')
  @RequirePermissions('ROLES_GESTIONAR')
  @ApiOperation({ summary: 'Editar rol' })
  @ApiParam({ name: 'id', description: 'ID del rol', type: Number })
  @ApiBody({ type: UpdateRolDto })
  @ApiOkResponse({ description: 'Rol actualizado' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateRolDto) {
    return this.rolesService.update(Number(id), dto);
  }


}
