import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateAttendanceSessionDto {
  @IsInt()
  @Min(1)
  courseSubjectId: number;

  @IsDateString()
  sessionDate: string;
}
