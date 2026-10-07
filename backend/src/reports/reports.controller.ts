import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RoleCode } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';
import { ReporteAsistencia, ReportsService } from './reports.service';

@ApiTags('Reportes')
@ApiBearerAuth()
@Roles(RoleCode.ADMIN, RoleCode.ADMINISTRATIVO, RoleCode.DOCENTE)
@RequirePermissions('ASISTENCIAS_LEER')
@Controller(['reports/attendance', 'reportes/asistencia'])
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  detail(@Query() query: AttendanceReportQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reports.detail(query, user);
  }

  @Get('summary')
  summary(@Query() query: AttendanceReportQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reports.summary(query, user);
  }

  @Get('export')
  async export(
    @Query() query: AttendanceReportQueryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ) {
    const result = await this.reports.detail(query, user);
    if (query.formato === 'pdf') return this.writePdf(result.registros, response);

    const csv = [
      'asistencia_id,estudiante_id,estudiante,docente,materia,grupo,fecha_clase,hora_registro,resultado,fuente',
      ...result.registros.map((record) =>
        [
          record.asistencia_id,
          record.estudiante_id,
          record.estudiante,
          record.docente,
          record.materia,
          record.grupo_codigo,
          record.fecha_clase,
          record.hora_registro,
          record.resultado,
          record.fuente,
        ].map((value) => this.csvCell(value)).join(','),
      ),
    ].join('\n');

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="reporte-asistencia.csv"');
    return response.send(csv);
  }

  private csvCell(value: string | number | null | undefined) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  private writePdf(records: ReporteAsistencia[], response: Response) {
    const document = new PDFDocument({ margin: 36 });
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'attachment; filename="reporte-asistencia.pdf"');
    document.pipe(response);
    document.fontSize(16).text('Reporte de asistencia');
    document.moveDown();
    records.forEach((record) =>
      document.fontSize(9).text(
        `${record.fecha_clase} | ${record.estudiante} | ${record.docente} | ${record.materia} | ${record.grupo_codigo} | ${record.resultado} | ${record.fuente}`,
      ),
    );
    document.end();
  }
}
