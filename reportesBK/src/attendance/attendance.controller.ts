import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CreateAttendanceRecordDto } from './dto/create-attendance-record.dto';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { UpdateAttendanceRecordDto } from './dto/update-attendance-record.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEACHER)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post('sessions')
  createSession(@Body() dto: CreateAttendanceSessionDto, @Req() request: AuthenticatedRequest) {
    return this.attendance.createSession(dto, request.user.id, request.user.role);
  }

  @Get('sessions')
  listSessions(@Query() query: AttendanceQueryDto, @Req() request: AuthenticatedRequest) {
    return this.attendance.listSessions(query, request.user.id, request.user.role);
  }

  @Get('sessions/:id')
  getSession(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.attendance.getSession(id, request.user.id, request.user.role);
  }

  @Patch('sessions/:id/close')
  closeSession(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.attendance.closeSession(id, request.user.id, request.user.role);
  }

  @Get('sessions/:id/records')
  listRecords(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.attendance.listRecords(id, request.user.id, request.user.role);
  }

  @Post('sessions/:id/records')
  addRecord(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateAttendanceRecordDto, @Req() request: AuthenticatedRequest) {
    return this.attendance.addRecord(id, dto, request.user.id, request.user.role);
  }

  @Patch('records/:id')
  updateRecord(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAttendanceRecordDto, @Req() request: AuthenticatedRequest) {
    return this.attendance.updateRecord(id, dto, request.user.id, request.user.role);
  }
}
