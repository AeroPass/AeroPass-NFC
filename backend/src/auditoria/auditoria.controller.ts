import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RoleCode } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditoriaQueryDto } from './dto/auditoria-query.dto';
import { AuditoriaService } from './auditoria.service';

@ApiTags('Auditoría')
@ApiBearerAuth()
@Roles(RoleCode.ADMIN, RoleCode.ADMINISTRATIVO)
@RequirePermissions('AUDITORIA_LEER')
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  findAll(@Query() query: AuditoriaQueryDto) {
    return this.auditoriaService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditoriaService.findOne(Number(id));
  }
}
