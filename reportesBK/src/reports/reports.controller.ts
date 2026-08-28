import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
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
  async export(@Query() query: AttendanceReportQueryDto & { format?: 'csv' | 'pdf' }, @Res() response: Response) {
    const result = await this.reports.detail(query);
    if (query.format === 'pdf') return this.writePdf(result.items, response);
    const csv = ['sessionId,studentId,status,method,sessionDate', ...result.items.map((record) => `${record.sessionId},${record.studentId},${record.status},${record.method},${record.session.sessionDate}`)].join('\n');
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
    return response.send(csv);
  }

  private writePdf(records: Array<{ sessionId: number; studentId: number; status: string; method: string; session: { sessionDate: string } }>, response: Response) {
    const document = new PDFDocument();
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'attachment; filename="attendance-report.pdf"');
    document.pipe(response);
    document.fontSize(16).text('Attendance report');
    document.moveDown();
    records.forEach((record) => document.fontSize(10).text(`${record.session.sessionDate} | session ${record.sessionId} | student ${record.studentId} | ${record.status} | ${record.method}`));
    document.end();
  }
}
