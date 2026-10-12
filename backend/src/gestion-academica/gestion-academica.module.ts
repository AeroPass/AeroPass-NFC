import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GestionAcademicaController } from './gestion-academica.controller';
import { GestionAcademicaService } from './gestion-academica.service';
import { SincronizacionAcademicaService } from './sincronizacion-academica.service';
import { Carrera } from './entities/carrera.entity';
import { Materia } from './entities/materia.entity';
import { Periodo } from './entities/periodo.entity';
import { Semestre } from './entities/semestre.entity';
import { Grupo } from './entities/grupo.entity';
import { Docente } from './entities/docente.entity';
import { AsignacionDocente } from './entities/asignacion-docente.entity';
import { MatriculaGrupo } from './entities/matricula-grupo.entity';
import { Salon } from './entities/salon.entity';
import { Horario } from './entities/horario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Carrera, Materia, Periodo, Semestre, Grupo, Docente, AsignacionDocente, MatriculaGrupo, Salon, Horario])],
  controllers: [GestionAcademicaController],
  providers: [GestionAcademicaService, SincronizacionAcademicaService],
})
export class GestionAcademicaModule {}
