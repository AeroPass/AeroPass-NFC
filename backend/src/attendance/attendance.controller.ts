import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ConsultarAsistenciaDto } from './dto/consultar-asistencia.dto';
import { CrearAsistenciaDto } from './dto/crear-asistencia.dto';

@Controller('asistencia')
export class AttendanceController {
  constructor(private readonly asistencia: AttendanceService) {}

  @Post()
  crear(@Body() dto: CrearAsistenciaDto) {
    return this.asistencia.crear(dto);
  }

  @Get()
  consultar(@Query() query: ConsultarAsistenciaDto) {
    return this.asistencia.consultar(query);
  }
}
