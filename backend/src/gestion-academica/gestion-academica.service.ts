import { Injectable } from '@nestjs/common';

@Injectable()
export class GestionAcademicaService {
  getHello(): string {
    return 'Gestión académica disponible.';
  }
}
