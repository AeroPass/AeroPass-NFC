import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service.js';
import { UsuariosController } from './usuarios.controller.js';
import { Usuario } from '../entities/usuario.entity.js';
import { Persona } from '../entities/persona.entity.js';
import { Rol } from '../entities/rol.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Persona, Rol])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
