import { Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ResultadoSincronizacionDto } from './dto/resultado-sincronizacion.dto';
import { GestionAcademicaService } from './gestion-academica.service';
import { SincronizacionAcademicaService } from './sincronizacion-academica.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('Gestión académica')
@ApiBearerAuth()
@Controller('gestion-academica')
@Roles(Role.ADMIN, Role.ADMINISTRATIVO)
@RequirePermissions('ACADEMICO_GESTIONAR')
export class GestionAcademicaController {
  constructor(private readonly gestionAcademicaService: GestionAcademicaService, private readonly sincronizacionAcademicaService: SincronizacionAcademicaService) {}
  @Get()
  @ApiOperation({ summary: 'Comprobar disponibilidad de la gestión académica' })
  @ApiOkResponse({ description: 'Mensaje de bienvenida del módulo académico' })
  getHello(): string { return this.gestionAcademicaService.getHello(); }

  @Post('sincronizacion/datos-maestros')
  @ApiOperation({ summary: 'Sincronizar datos maestros académicos' })
  @ApiCreatedResponse({ description: 'Resultado de la sincronización', type: ResultadoSincronizacionDto })
  sincronizarDatosMaestros(): Promise<ResultadoSincronizacionDto> { return this.sincronizacionAcademicaService.sincronizarDatosMaestros(); }
}
