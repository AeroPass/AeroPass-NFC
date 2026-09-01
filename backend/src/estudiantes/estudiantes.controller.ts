import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
    description: 'Admin ve TODOS los estudiantes. Docente ve ÚNICAMENTE los estudiantes de sus grupos.',
  })
  findAll(@CurrentUser() user: any) {
    return this.estudiantesService.findAll(user);
  }
}
