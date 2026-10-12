import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Persona } from '../usuarios/entities/persona.entity';
import { Rol } from '../roles/entities/rol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Persona, Rol])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
