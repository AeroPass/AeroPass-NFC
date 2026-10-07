import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RoleCode } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { PermisosQueryDto } from './dto/permisos-query.dto';
import { PermisosService } from './permisos.service';

@ApiTags('Permisos')
@ApiBearerAuth()
@Roles(RoleCode.ADMIN)
@RequirePermissions('PERMISOS_GESTIONAR')
@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisos: PermisosService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PermisosQueryDto) {
    return this.permisos.findAll(user, query);
  }
}
