import { Module } from '@nestjs/common';
import { GestionAcademicaController } from './gestion-academica.controller';
import { GestionAcademicaService } from './gestion-academica.service';
import { SincronizacionAcademicaService } from './sincronizacion-academica.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsignacionDocente } from './entities/asignacion-docente.entity';
import { Carrera } from './entities/carrera.entity';
import { Docente } from './entities/docente.entity';
import { Grupo } from './entities/grupo.entity';
import { Horario } from './entities/horario.entity';
import { Materia } from './entities/materia.entity';
import { MatriculaGrupo } from './entities/matricula-grupo.entity';
import { Periodo } from './entities/periodo.entity';
import { Salon } from './entities/salon.entity';
import { Semestre } from './entities/semestre.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    AsignacionDocente, Carrera, Docente, Grupo, Horario, Materia,
    MatriculaGrupo, Periodo, Salon, Semestre,
  ])],
  controllers: [GestionAcademicaController],
  providers: [GestionAcademicaService, SincronizacionAcademicaService],
  exports: [GestionAcademicaService, SincronizacionAcademicaService],
})
export class GestionAcademicaModule { }
