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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiOkResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @RequirePermissions('USUARIOS_LEER')
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiQuery({ name: 'rol', required: false })
  @ApiQuery({ name: 'estado', required: false, enum: ['ACTIVO', 'INACTIVO', 'BLOQUEADO'] })
  @ApiQuery({ name: 'q', required: false })
  @ApiOkResponse({ description: 'Listado de usuarios que coinciden con los filtros' })
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
  @ApiParam({ name: 'id', description: 'ID del usuario', type: Number })
  @ApiOkResponse({ description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(Number(id));
  }

  @Post()
  @RequirePermissions('USUARIOS_CREAR')
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiBody({ type: CreateUsuarioDto })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 409, description: 'Conflicto' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('USUARIOS_EDITAR')
  @ApiOperation({ summary: 'Editar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: Number })
  @ApiBody({ type: UpdateUsuarioDto })
  @ApiOkResponse({ description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() user: any,
  ) {
    return this.usuariosService.update(Number(id), dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('USUARIOS_EDITAR')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: Number })
  @ApiOkResponse({ description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usuariosService.remove(Number(id), user.id);
  }

  @Patch(':id/activate')
  @RequirePermissions('USUARIOS_ESTADO')
  @ApiOperation({ summary: 'Activar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: Number })
  @ApiOkResponse({ description: 'Usuario activado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  activate(@Param('id') id: string) {
    return this.usuariosService.activate(Number(id));
  }

  @Patch(':id/deactivate')
  @RequirePermissions('USUARIOS_ESTADO')
  @ApiOperation({ summary: 'Desactivar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: Number })
  @ApiOkResponse({ description: 'Usuario desactivado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  deactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usuariosService.deactivate(Number(id), user.id);
  }
}
