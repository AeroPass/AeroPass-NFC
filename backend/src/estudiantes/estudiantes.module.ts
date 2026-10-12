import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstudiantesService } from './estudiantes.service';
import { EstudiantesController } from './estudiantes.controller';
import { Estudiante } from '../estudiantes/entities/estudiante.entity';
import { Docente } from '../gestion-academica/entities/docente.entity';
import { AsignacionDocente } from '../gestion-academica/entities/asignacion-docente.entity';
import { MatriculaGrupo } from '../gestion-academica/entities/matricula-grupo.entity';
import { Grupo } from '../gestion-academica/entities/grupo.entity';
import { Persona } from '../usuarios/entities/persona.entity';

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
