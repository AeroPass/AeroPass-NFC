import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsignacionDocente } from '../gestion-academica/entities/asignacion-docente.entity';
import { Docente } from '../gestion-academica/entities/docente.entity';
import { Grupo } from '../gestion-academica/entities/grupo.entity';
import { MatriculaGrupo } from '../gestion-academica/entities/matricula-grupo.entity';
import { Estudiante } from './entities/estudiante.entity';
import { EstudiantesController } from './estudiantes.controller';
import { EstudiantesService } from './estudiantes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Estudiante, Docente, AsignacionDocente, MatriculaGrupo, Grupo])],
  controllers: [EstudiantesController],
  providers: [EstudiantesService],
  exports: [EstudiantesService],
})
export class EstudiantesModule { }
