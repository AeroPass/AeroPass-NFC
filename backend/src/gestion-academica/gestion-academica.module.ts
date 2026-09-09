import { Module } from '@nestjs/common';
import { GestionAcademicaController } from './gestion-academica.controller';
import { GestionAcademicaService } from './gestion-academica.service';
import { SincronizacionAcademicaService } from './sincronizacion-academica.service';

@Module({
  controllers: [GestionAcademicaController],
  providers: [GestionAcademicaService, SincronizacionAcademicaService],
})
export class GestionAcademicaModule {}
