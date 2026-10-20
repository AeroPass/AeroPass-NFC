import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { RolPermiso } from '../roles/entities/rol-permiso.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    AuditoriaModule,
    TypeOrmModule.forFeature([Usuario, RolPermiso]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.getOrThrow<string>('jwt.secreto'),
          signOptions: {
            expiresIn: config.getOrThrow<JwtSignOptions['expiresIn']>('jwt.expiracion'),
            algorithm: 'HS256' as const,
            issuer: config.getOrThrow<string>('jwt.emisor'),
            audience: config.getOrThrow<string>('jwt.audiencia'),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
