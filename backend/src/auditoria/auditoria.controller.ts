import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaQueryDto } from './dto/auditoria-query.dto';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('Auditoría')
@ApiBearerAuth()
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @RequirePermissions('AUDITORIA_LEER')
  @ApiOperation({ summary: 'Consultar eventos de auditoría' })
  @ApiOkResponse({ description: 'Eventos de auditoría filtrados y paginados' })
  findAll(@Query() query: AuditoriaQueryDto) { return this.auditoriaService.findAll(query); }
}
