import { Injectable } from '@nestjs/common';

@Injectable()
export class GestionAcademicaService {
  getHello(): string {
    return 'Hello Gestion Academica!';
  }
}
