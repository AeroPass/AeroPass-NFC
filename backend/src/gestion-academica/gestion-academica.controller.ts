import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RoleCode } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { ResultadoSincronizacionDto } from './dto/resultado-sincronizacion.dto';
import { SincronizarDatosMaestrosDto } from './dto/sincronizar-datos-maestros.dto';
import { GestionAcademicaService } from './gestion-academica.service';
import { SincronizacionAcademicaService } from './sincronizacion-academica.service';

@ApiTags('Gestión académica')
@ApiBearerAuth()
@Roles(RoleCode.ADMIN, RoleCode.ADMINISTRATIVO)
@RequirePermissions('ACADEMICO_GESTIONAR')
@Controller('gestion-academica')
export class GestionAcademicaController {
  constructor(
    private readonly gestionAcademicaService: GestionAcademicaService,
    private readonly sincronizacionAcademicaService: SincronizacionAcademicaService,
  ) {}

  @Get()
  getHello() {
    return this.gestionAcademicaService.getHello();
  }

  @Post('sincronizacion/datos-maestros')
  sincronizarDatosMaestros(@Body() dto: SincronizarDatosMaestrosDto): Promise<ResultadoSincronizacionDto> {
    if (dto.ejecutar === false) {
      return Promise.resolve({
        iniciadoEn: new Date().toISOString(),
        finalizadoEn: new Date().toISOString(),
        registrosProcesados: {},
      });
    }
    return this.sincronizacionAcademicaService.sincronizarDatosMaestros();
  }
}
