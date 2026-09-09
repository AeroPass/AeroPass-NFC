import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AttendanceMethod } from '../enums/attendance-method.enum';
import { AttendanceStatus } from '../enums/attendance-status.enum';

export class CreateAttendanceRecordDto {
  @IsInt()
  @Min(1)
  studentId: number;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsEnum(AttendanceMethod)
  method?: AttendanceMethod;

  @IsOptional()
  @IsString()
  note?: string;
}
