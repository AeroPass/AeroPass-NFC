import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { Permiso } from '../permisos/entities/permiso.entity';
import { Rol } from '../roles/entities/rol.entity';
import { RolPermiso } from '../roles/entities/rol-permiso.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SecurityPolicyService } from './services/security-policy.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    AuditoriaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '8h') as any,
          issuer: config.get<string>('JWT_ISSUER', 'AeroPass-NFC'),
          audience: config.get<string>('JWT_AUDIENCE', 'AeroPass-NFC-api'),
          algorithm: 'HS256',
        },
      }),
    }),
    TypeOrmModule.forFeature([Usuario, Rol, Permiso, RolPermiso]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SecurityPolicyService],
  exports: [AuthService, JwtStrategy, SecurityPolicyService, PassportModule],
})
export class AuthModule {}
