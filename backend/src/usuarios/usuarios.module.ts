import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estudiante } from '../estudiantes/entities/estudiante.entity';
import { Docente } from '../gestion-academica/entities/docente.entity';
import { Rol } from '../roles/entities/rol.entity';
import { Persona } from './entities/persona.entity';
import { TipoDocumento } from './entities/tipos-documento.entity';
import { Usuario } from './entities/usuario.entity';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Persona, TipoDocumento, Rol, Docente, Estudiante])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
