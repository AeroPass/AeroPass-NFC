import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@ApiTags('Sistema')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Public()
  @Get()
  @ApiOperation({ summary: 'Comprobar disponibilidad de la API' })
  @ApiOkResponse({ description: 'Mensaje de bienvenida' })
  getHello(): string { return this.appService.getHello(); }
}
