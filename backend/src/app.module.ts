import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceModule } from './attendance/attendance.module';
import { AuditoriaController } from './auditoria/auditoria.controller';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { EstudiantesController } from './estudiantes/estudiantes.controller';
import { EstudiantesModule } from './estudiantes/estudiantes.module';
import { GestionAcademicaController } from './gestion-academica/gestion-academica.controller';
import { GestionAcademicaModule } from './gestion-academica/gestion-academica.module';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthHeaderMiddleware } from './common/middleware/auth-header.middleware';
import { PermisosController } from './permisos/permisos.controller';
import { PermisosModule } from './permisos/permisos.module';
import { ReportsController } from './reports/reports.controller';
import { ReportsModule } from './reports/reports.module';
import { RolesController } from './roles/roles.controller';
import { RolesModule } from './roles/roles.module';
import { TarjetasController } from './tarjetas/tarjetas.controller';
import { TarjetasModule } from './tarjetas/tarjetas.module';
import { UsuariosController } from './usuarios/usuarios.controller';
import { UsuariosModule } from './usuarios/usuarios.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], cache: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.getOrThrow<string>('database.host'),
        port: config.getOrThrow<number>('database.port'),
        username: config.getOrThrow<string>('database.username'),
        password: config.get<string>('database.password', ''),
        database: config.getOrThrow<string>('database.name'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    AuthModule,
    AuditoriaModule,
    UsuariosModule,
    RolesModule,
    PermisosModule,
    EstudiantesModule,
    GestionAcademicaModule,
    AttendanceModule,
    ReportsModule,
    TarjetasModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthHeaderMiddleware)
      .exclude({ path: 'auth/login', method: RequestMethod.POST })
      .forRoutes(
        AuthController,
        UsuariosController,
        RolesController,
        PermisosController,
        EstudiantesController,
        GestionAcademicaController,
        AttendanceController,
        ReportsController,
        TarjetasController,
        AuditoriaController,
      );
  }
}
