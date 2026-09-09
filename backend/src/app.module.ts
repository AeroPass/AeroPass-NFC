import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';
import { TarjetasModule } from './tarjetas/tarjetas.module';
import { AuthModule } from './auth/auth.module';
//import { AuditoriaModule } from './auditoria/auditoria.module';

import { Asistencia } from './attendance/entities/asistencia.entity';
import { AttendanceRecord } from './attendance/entities/attendance-record.entity';
import { AttendanceSession } from './attendance/entities/attendance-session.entity';

import { Tarjeta } from './tarjetas/entities/tarjeta.entity';

//import { Auditoria } from './auditoria/entities/auditoria.entity';

import { User } from './users/entities/user.entity';

import { Student } from './academic/entities/student.entity';
import { Enrollment } from './academic/entities/enrollment.entity';
import { CourseSubject } from './academic/entities/course-subject.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'aeropass'),
        entities: [Asistencia, AttendanceRecord, AttendanceSession, Tarjeta, User, Student, Enrollment, CourseSubject],
        synchronize: config.get('DB_SYNCHRONIZE', 'false') === 'true',
      }),
    }),
    AttendanceModule,
    ReportsModule,
    TarjetasModule,
    AuthModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }


