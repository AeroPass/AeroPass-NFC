import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from '../attendance/entities/asistencia.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Asistencia])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
