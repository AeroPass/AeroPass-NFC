import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service.js';
import { RolesController } from './roles.controller.js';
import { Rol } from '../entities/rol.entity.js';
import { Permiso } from '../entities/permiso.entity.js';
import { RolPermiso } from '../entities/rol-permiso.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Rol, Permiso, RolPermiso])],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
