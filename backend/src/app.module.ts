import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';
import { RolesModule } from './roles/roles.module';
import { PermisosModule } from './permisos/permisos.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';
import { TarjetasModule } from './tarjetas/tarjetas.module';
import { GestionAcademicaModule } from './gestion-academica/gestion-academica.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './auth/permissions.guard';
import { AuthTokenMiddleware } from './auth/middlewares/auth-token.middleware';
import { Auditoria } from './auditoria/entities/auditoria.entity';
import { Asistencia } from './attendance/entities/asistencia.entity';
import { Tarjeta } from './tarjetas/entities/tarjeta.entity';
import { Usuario } from './usuarios/entities/usuario.entity';
import { Persona } from './usuarios/entities/persona.entity';
import { TiposDocumento } from './usuarios/entities/tipos-documento.entity';
import { Rol } from './roles/entities/rol.entity';
import { RolPermiso } from './roles/entities/rol-permiso.entity';
import { Permiso } from './permisos/entities/permiso.entity';
import { Estudiante } from './estudiantes/entities/estudiante.entity';
import { Docente } from './gestion-academica/entities/docente.entity';
import { Carrera } from './gestion-academica/entities/carrera.entity';
import { Materia } from './gestion-academica/entities/materia.entity';
import { Periodo } from './gestion-academica/entities/periodo.entity';
import { Semestre } from './gestion-academica/entities/semestre.entity';
import { Grupo } from './gestion-academica/entities/grupo.entity';
import { AsignacionDocente } from './gestion-academica/entities/asignacion-docente.entity';
import { MatriculaGrupo } from './gestion-academica/entities/matricula-grupo.entity';
import { Salon } from './gestion-academica/entities/salon.entity';
import { Horario } from './gestion-academica/entities/horario.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'control_acceso_nfc'),
        entities: [Auditoria, Asistencia, Tarjeta, Usuario, Persona, TiposDocumento, Rol, RolPermiso, Permiso, Estudiante, Docente, Carrera, Materia, Periodo, Semestre, Grupo, AsignacionDocente, MatriculaGrupo, Salon, Horario],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forRootAsync({
      name: 'SIGEDIN',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('SIGEDIN_DB_HOST', '127.0.0.1'),
        port: Number(config.get<string>('SIGEDIN_DB_PORT', '3306')),
        username: config.get<string>('SIGEDIN_DB_USERNAME', 'root'),
        password: config.get<string>('SIGEDIN_DB_PASSWORD', ''),
        database: config.get<string>('SIGEDIN_DB_DATABASE', 'sigedin'),
        entities: [],
        synchronize: false,
      }),
    }),
    AuthModule, UsuariosModule, EstudiantesModule, RolesModule, PermisosModule,
    AttendanceModule, ReportsModule, TarjetasModule, GestionAcademicaModule, AuditoriaModule,
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
    consumer.apply(AuthTokenMiddleware).forRoutes('*');
  }
}
