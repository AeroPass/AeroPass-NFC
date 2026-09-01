import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermisosService } from './permisos.service.js';
import { PermisosController } from './permisos.controller.js';
import { Permiso } from '../entities/permiso.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Permiso])],
  controllers: [PermisosController],
  providers: [PermisosService],
})
export class PermisosModule {}
