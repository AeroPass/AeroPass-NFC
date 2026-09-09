import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EstudiantesService } from './estudiantes.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('Estudiantes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('estudiantes')
export class EstudiantesController {
  constructor(private readonly estudiantesService: EstudiantesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar estudiantes',
    description: 'Admin ve TODOS los estudiantes (paginado). Docente ve ÚNICAMENTE los estudiantes de sus grupos.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 200 })
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Paginación para la vista ADMIN (evita cargar toda la tabla con relaciones).
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 200), 500);
    return this.estudiantesService.findAll(user, pageNum, limitNum);
  }
}
