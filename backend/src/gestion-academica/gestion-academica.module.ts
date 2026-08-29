import { Module } from '@nestjs/common';
import { GestionAcademicaController } from './gestion-academica.controller';
import { GestionAcademicaService } from './gestion-academica.service';

@Module({
  controllers: [GestionAcademicaController],
  providers: [GestionAcademicaService],
})
export class GestionAcademicaModule {}
