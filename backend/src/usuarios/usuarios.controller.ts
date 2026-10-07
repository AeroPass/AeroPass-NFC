import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCode } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuariosQueryDto } from './dto/usuarios-query.dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Roles(RoleCode.ADMIN, RoleCode.ADMINISTRATIVO)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @RequirePermissions('USUARIOS_LEER')
  @ApiOperation({ summary: 'Listar usuarios' })
  findAll(@Query() query: UsuariosQueryDto) {
    return this.usuarios.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('USUARIOS_LEER')
  findOne(@Param('id') id: string) {
    return this.usuarios.findOne(Number(id));
  }

  @Post()
  @RequirePermissions('USUARIOS_CREAR')
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuarios.create(dto);
  }

  @Put(':id')
  @RequirePermissions('USUARIOS_EDITAR')
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usuarios.update(Number(id), dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('USUARIOS_EDITAR')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usuarios.remove(Number(id), user.id);
  }

  @Patch(':id/activate')
  @RequirePermissions('USUARIOS_ESTADO')
  activate(@Param('id') id: string) {
    return this.usuarios.activate(Number(id));
  }

  @Patch(':id/deactivate')
  @RequirePermissions('USUARIOS_ESTADO')
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usuarios.deactivate(Number(id), user.id);
  }
}
