import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';
import { ReportsService, ReporteAsistencia } from './reports.service';

@Controller(['reports/attendance', 'reportes/asistencia'])
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  detail(@Query() query: AttendanceReportQueryDto) {
    return this.reports.detail(query);
  }

  @Get('summary')
  summary(@Query() query: AttendanceReportQueryDto) {
    return this.reports.summary(query);
  }

  @Get('export')
  async export(
    @Query() query: AttendanceReportQueryDto,
    @Res() response: Response,
  ) {
    const result = await this.reports.detail(query);
    if (query.formato === 'pdf')
      return this.writePdf(result.registros, response);
    const csv = [
      'asistencia_id,estudiante_id,estudiante,docente,materia,grupo,fecha_clase,hora_registro,resultado,fuente',
      ...result.registros.map(
        (record) =>
          `${record.asistencia_id},${record.estudiante_id},"${record.estudiante}","${record.docente}","${record.materia}","${record.grupo_codigo}",${record.fecha_clase},${record.hora_registro},${record.resultado},${record.fuente}`,
      ),
    ].join('\n');
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="reporte-asistencia.csv"',
    );
    return response.send(csv);
  }

  private writePdf(records: ReporteAsistencia[], response: Response) {
    const document = new PDFDocument();
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="reporte-asistencia.pdf"',
    );
    document.pipe(response);
    document.fontSize(16).text('Reporte de asistencia');
    document.moveDown();
    records.forEach((record) =>
      document
        .fontSize(10)
        .text(
          `${record.fecha_clase} | ${record.estudiante} | ${record.docente} | ${record.materia} | ${record.grupo_codigo} | ${record.resultado} | ${record.fuente}`,
        ),
    );
    document.end();
  }
}
