import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuracion from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';
import { RolesModule } from './roles/roles.module';
import { PermisosModule } from './permisos/permisos.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportesModule } from './reportes/reportes.module';
import { TarjetasModule } from './tarjetas/tarjetas.module';
import { GestionAcademicaModule } from './gestion-academica/gestion-academica.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './auth/permissions.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuracion] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.getOrThrow<string>('baseDatos.host'),
        port: config.getOrThrow<number>('baseDatos.puerto'),
        username: config.getOrThrow<string>('baseDatos.usuario'),
        password: config.getOrThrow<string>('baseDatos.contrasena'),
        database: config.getOrThrow<string>('baseDatos.nombre'),
        autoLoadEntities: true,
        synchronize: config.getOrThrow<boolean>('baseDatos.sincronizar'),
        logging: config.getOrThrow<boolean>('baseDatos.registrarConsultas'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      name: 'SIGEDIN',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.getOrThrow<string>('baseDatosAcademica.host'),
        port: config.getOrThrow<number>('baseDatosAcademica.puerto'),
        username: config.getOrThrow<string>('baseDatosAcademica.usuario'),
        password: config.getOrThrow<string>('baseDatosAcademica.contrasena'),
        database: config.getOrThrow<string>('baseDatosAcademica.nombre'),
        entities: [],
        synchronize: config.getOrThrow<boolean>('baseDatosAcademica.sincronizar'),
        logging: config.getOrThrow<boolean>('baseDatosAcademica.registrarConsultas'),
      }),
    }),
    EventEmitterModule.forRoot(),
    AuthModule, UsuariosModule, EstudiantesModule, RolesModule, PermisosModule,
    AttendanceModule, ReportesModule, TarjetasModule, GestionAcademicaModule, AuditoriaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
