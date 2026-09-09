import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstudiantesService } from './estudiantes.service.js';
import { EstudiantesController } from './estudiantes.controller.js';
import { Estudiante } from '../entities/estudiante.entity.js';
import { Docente } from '../entities/docente.entity.js';
import { AsignacionDocente } from '../entities/asignacion-docente.entity.js';
import { MatriculaGrupo } from '../entities/matricula-grupo.entity.js';
import { Grupo } from '../entities/grupo.entity.js';
import { Persona } from '../entities/persona.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Estudiante,
      Docente,
      AsignacionDocente,
      MatriculaGrupo,
      Grupo,
      Persona,
    ]),
  ],
  controllers: [EstudiantesController],
  providers: [EstudiantesService],
})
export class EstudiantesModule {}
