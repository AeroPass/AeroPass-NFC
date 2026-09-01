import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RequirePermissions } from '../auth/permissions.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @RequirePermissions('USUARIOS_LEER')
  @ApiOperation({ summary: 'Listar usuarios (CU-03)', description: 'Lista todos los usuarios. Filtros: rol, estado, q.' })
  @ApiQuery({ name: 'rol', required: false, description: 'Filtrar por código de rol (ej: ADMIN)' })
  @ApiQuery({ name: 'estado', required: false, enum: ['ACTIVO', 'INACTIVO', 'BLOQUEADO'] })
  @ApiQuery({ name: 'q', required: false, description: 'Búsqueda en username, nombres o apellidos' })
  findAll(
    @Query('rol') rol?: string,
    @Query('estado') estado?: string,
    @Query('q') q?: string,
  ) {
    return this.usuariosService.findAll(rol, estado, q);
  }

  @Get(':id')
  @RequirePermissions('USUARIOS_LEER')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(Number(id));
  }

  @Post()
  @RequirePermissions('USUARIOS_CREAR')
  @ApiOperation({ summary: 'Crear usuario (CU-03)', description: 'Crea una persona + usuario (admin o docente).' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 409, description: 'Conflicto (username/email duplicado)' })
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('USUARIOS_EDITAR')
  @ApiOperation({ summary: 'Editar usuario (CU-03)', description: 'Edita un usuario (admin o docente) y/o su persona.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() user: any,
  ) {
    return this.usuariosService.update(Number(id), dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('USUARIOS_EDITAR')
  @ApiOperation({ summary: 'Eliminar usuario', description: 'Elimina un usuario permanentemente. No puede eliminarse a sí mismo.' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usuariosService.remove(Number(id), user.id);
  }

  @Patch(':id/activate')
  @RequirePermissions('USUARIOS_ESTADO')
  @ApiOperation({ summary: 'Activar usuario', description: 'Reactiva un usuario (estado → ACTIVO).' })
  activate(@Param('id') id: string) {
    return this.usuariosService.activate(Number(id));
  }

  @Patch(':id/deactivate')
  @RequirePermissions('USUARIOS_ESTADO')
  @ApiOperation({ summary: 'Desactivar usuario', description: 'Desactiva un usuario (estado → INACTIVO). No puede desactivarse a sí mismo.' })
  deactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usuariosService.deactivate(Number(id), user.id);
  }
}
