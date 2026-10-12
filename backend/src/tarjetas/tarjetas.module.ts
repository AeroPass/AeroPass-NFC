import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estudiante } from '../estudiantes/entities/estudiante.entity';
import { Persona } from '../usuarios/entities/persona.entity';
import { AsignacionTarjetasController } from './asignacion-tarjetas.controller';
import { AsignacionTarjetasService } from './asignacion-tarjetas.service';
import { AsignacionTarjeta } from './entities/asignacion-tarjeta.entity';
import { Tarjeta } from './entities/tarjeta.entity';
import { TarjetasController } from './tarjetas.controller';
import { TarjetasService } from './tarjetas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tarjeta, AsignacionTarjeta, Estudiante, Persona])],
  controllers: [TarjetasController, AsignacionTarjetasController],
  providers: [TarjetasService, AsignacionTarjetasService],
  exports: [TarjetasService, AsignacionTarjetasService],
})
export class TarjetasModule {}
