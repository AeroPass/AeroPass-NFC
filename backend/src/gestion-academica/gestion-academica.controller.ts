import { Controller, Get } from '@nestjs/common';
import { GestionAcademicaService } from './gestion-academica.service';

@Controller('gestion-academica')
export class GestionAcademicaController {
  constructor(
    private readonly gestionAcademicaService: GestionAcademicaService,
  ) {}

  @Get()
  getHello(): string {
    return this.gestionAcademicaService.getHello();
  }
}
