import { Controller, Get, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RequirePermissions } from '../auth/permissions.decorator';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';
import { ReportsService, ReporteAsistencia } from './reports.service';

@ApiTags('Reportes de asistencia')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.DOCENTE, Role.ADMINISTRATIVO)
@RequirePermissions('ASISTENCIAS_LEER')
@Controller(['reports/attendance', 'reportes/asistencia'])
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar el detalle de asistencias' })
  @ApiOkResponse({
    description: 'Registros de asistencia y metadatos de paginación',
    schema: {
      type: 'object',
      properties: {
        registros: { type: 'array', items: { type: 'object', properties: {
          asistencia_id: { type: 'integer' }, fecha_clase: { type: 'string', format: 'date' },
          hora_registro: { type: 'string' }, resultado: { type: 'string' }, fuente: { type: 'string' },
          observaciones: { type: 'string', nullable: true }, estudiante_id: { type: 'integer' },
          codigo_estudiante: { type: 'string' }, estudiante: { type: 'string' }, docente_id: { type: 'integer' },
          docente: { type: 'string' }, materia_id: { type: 'integer' }, materia_codigo: { type: 'string' },
          materia: { type: 'string' }, grupo_id: { type: 'integer' }, grupo_codigo: { type: 'string' },
          carrera: { type: 'string' }, semestre: { type: 'string' }, salon_codigo: { type: 'string' },
        } } },
        total: { type: 'integer' }, pagina: { type: 'integer' }, limite: { type: 'integer' },
      },
    },
  })
  detail(@Query() query: AttendanceReportQueryDto) {
    return this.reports.detail(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Obtener el resumen estadístico de asistencias' })
  @ApiOkResponse({
    description: 'Totales de asistencias por resultado y porcentaje de asistencia',
    schema: { type: 'object', properties: {
      total: { type: 'integer' }, asistencias: { type: 'integer' }, tardanzas: { type: 'integer' },
      justificadas: { type: 'integer' }, anuladas: { type: 'integer' },
      porcentajeAsistencia: { type: 'number' },
    } },
  })
  summary(@Query() query: AttendanceReportQueryDto) {
    return this.reports.summary(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar el reporte de asistencia' })
  @ApiProduces('text/csv', 'application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Archivo CSV o PDF según el parámetro formato (CSV por defecto)',
    content: {
      'text/csv': { schema: { type: 'string', format: 'binary' } },
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  async export(
    @Query() query: AttendanceReportQueryDto,
    @Res() response: Response,
  ) {
    const result = await this.reports.detail(query);
    if (query.formato === 'pdf')
      return this.writePdf(result.registros, response);
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
        ]
          .map((value) => this.csvCell(value))
          .join(','),
      ),
    ].join('\n');
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="reporte-asistencia.csv"',
    );
    return response.send(csv);
  }

  private csvCell(value: string | number | null | undefined) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
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
