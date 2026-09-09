import { Controller, Get, Post } from '@nestjs/common';
import { ResultadoSincronizacionDto } from './dto/resultado-sincronizacion.dto';
import { GestionAcademicaService } from './gestion-academica.service';
import { SincronizacionAcademicaService } from './sincronizacion-academica.service';

@Controller('gestion-academica')
export class GestionAcademicaController {
  constructor(
    private readonly gestionAcademicaService: GestionAcademicaService,
    private readonly sincronizacionAcademicaService: SincronizacionAcademicaService,
  ) {}

  @Get()
  getHello(): string {
    return this.gestionAcademicaService.getHello();
  }

  @Post('sincronizacion/datos-maestros')
  sincronizarDatosMaestros(): Promise<ResultadoSincronizacionDto> {
    return this.sincronizacionAcademicaService.sincronizarDatosMaestros();
  }
}
