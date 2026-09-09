import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RolesService } from './roles.service.js';
import { CreateRolDto } from './dto/create-rol.dto.js';
import { UpdateRolDto } from './dto/update-rol.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RequirePermissions } from '../auth/permissions.decorator.js';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('AUTH_LOGIN')
  @ApiOperation({ summary: 'Listar roles' })
  @ApiQuery({ name: 'includePermisos', required: false, type: Boolean })
  findAll(@Query('includePermisos') includePermisos?: string) {
    return this.rolesService.findAll(includePermisos === 'true');
  }

  @Get(':id')
  @RequirePermissions('AUTH_LOGIN')
  @ApiOperation({ summary: 'Obtener rol por ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(Number(id));
  }

  @Post()
  @RequirePermissions('ROLES_GESTIONAR')
  @ApiOperation({ summary: 'Crear rol' })
  create(@Body() dto: CreateRolDto) {
    return this.rolesService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('ROLES_GESTIONAR')
  @ApiOperation({ summary: 'Editar rol' })
  update(@Param('id') id: string, @Body() dto: UpdateRolDto) {
    return this.rolesService.update(Number(id), dto);
  }

  @Delete(':id')
  @RequirePermissions('ROLES_GESTIONAR')
  @ApiOperation({ summary: 'Eliminar rol' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(Number(id));
  }
}
