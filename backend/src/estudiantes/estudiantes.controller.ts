import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';
import { EstudiantesService } from './estudiantes.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { EstudianteQueryDto } from './dto/estudiante-query.dto';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('Estudiantes')
@ApiBearerAuth()
@Controller('estudiantes')
export class EstudiantesController {
  constructor(private readonly estudiantesService: EstudiantesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCENTE)
  @RequirePermissions('AUTH_LOGIN')
  @ApiOperation({ summary: 'Listar estudiantes autorizados' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Página de estudiantes permitidos para el usuario actual' })
  findAll(@CurrentUser() user: any, @Query() query: EstudianteQueryDto) {
    return this.estudiantesService.findAll(user, query.page, query.limit);
  }
}
