import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RoleCode } from '../common/enums/role.enum';
import { AsignacionDocente } from '../gestion-academica/entities/asignacion-docente.entity';
import { Docente } from '../gestion-academica/entities/docente.entity';
import { Grupo } from '../gestion-academica/entities/grupo.entity';
import { MatriculaGrupo } from '../gestion-academica/entities/matricula-grupo.entity';
import { Estudiante } from './entities/estudiante.entity';
import { EstudianteQueryDto } from './dto/estudiante-query.dto';

@Injectable()
export class EstudiantesService {
  constructor(
    @InjectRepository(Estudiante) private readonly estudianteRepo: Repository<Estudiante>,
    @InjectRepository(Docente) private readonly docenteRepo: Repository<Docente>,
    @InjectRepository(AsignacionDocente) private readonly asignacionRepo: Repository<AsignacionDocente>,
    @InjectRepository(MatriculaGrupo) private readonly matriculaRepo: Repository<MatriculaGrupo>,
    @InjectRepository(Grupo) private readonly grupoRepo: Repository<Grupo>,
  ) {}

  async findAll(user: AuthenticatedUser, query: EstudianteQueryDto) {
    if ([RoleCode.ADMIN, RoleCode.ADMINISTRATIVO].includes(user.rol.codigo)) {
      return this.findAllForAdmin(query);
    }

    if (user.rol.codigo === RoleCode.DOCENTE) {
      return this.findAllForDocente(user, query);
    }

    throw new ForbiddenException('Su rol no tiene permiso para consultar estudiantes.');
  }

  private async findAllForAdmin(queryDto: EstudianteQueryDto) {
    const query = this.estudianteRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.persona', 'persona')
      .leftJoinAndSelect('e.matriculas', 'matricula', 'matricula.estado = :estadoMatricula', { estadoMatricula: 'ACTIVA' })
      .leftJoinAndSelect('matricula.grupo', 'grupo')
      .orderBy('persona.apellidos', 'ASC')
      .addOrderBy('persona.nombres', 'ASC');

    if (queryDto.q) {
      query.andWhere(
        '(persona.nombres LIKE :q OR persona.apellidos LIKE :q OR e.codigo_estudiante LIKE :q OR persona.documento LIKE :q)',
        { q: `%${queryDto.q}%` },
      );
    }

    const total = await query.clone().getCount();
    const estudiantes = await query
      .skip((queryDto.pagina - 1) * queryDto.limite)
      .take(queryDto.limite)
      .getMany();

    return this.buildResponse(estudiantes, total, queryDto, 'ADMINISTRACIÓN - Todos los estudiantes');
  }

  private async findAllForDocente(user: AuthenticatedUser, queryDto: EstudianteQueryDto) {
    const docente = await this.docenteRepo.findOne({ where: { personaId: user.persona.id } });
    if (!docente) {
      return { estudiantes: [], total: 0, pagina: queryDto.pagina, limite: queryDto.limite, totalPaginas: 0, vista: 'DOCENTE - sin registro docente' };
    }

    const assignments = await this.asignacionRepo.find({
      where: { docenteId: docente.id, estado: 'ACTIVA' },
      select: { grupoId: true },
    });
    const grupoIds = [...new Set(assignments.map((assignment) => Number(assignment.grupoId)))];
    if (!grupoIds.length) {
      return { estudiantes: [], total: 0, pagina: queryDto.pagina, limite: queryDto.limite, totalPaginas: 0, vista: 'DOCENTE - sin grupos asignados' };
    }

    const query = this.estudianteRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.persona', 'persona')
      .innerJoin('e.matriculas', 'matricula', 'matricula.estudiante_id = e.id AND matricula.estado = :estadoMatricula AND matricula.grupo_id IN (:...grupoIds)', {
        estadoMatricula: 'ACTIVA', grupoIds,
      })
      .leftJoinAndSelect('matricula.grupo', 'grupo')
      .orderBy('persona.apellidos', 'ASC')
      .addOrderBy('persona.nombres', 'ASC');

    if (queryDto.q) {
      query.andWhere(
        '(persona.nombres LIKE :q OR persona.apellidos LIKE :q OR e.codigo_estudiante LIKE :q OR persona.documento LIKE :q)',
        { q: `%${queryDto.q}%` },
      );
    }

    const total = await query.clone().getCount();
    const estudiantes = await query
      .skip((queryDto.pagina - 1) * queryDto.limite)
      .take(queryDto.limite)
      .getMany();

    return this.buildResponse(estudiantes, total, queryDto, 'DOCENTE - estudiantes de sus grupos');
  }

  private buildResponse(estudiantes: Estudiante[], total: number, queryDto: EstudianteQueryDto, vista: string) {
    return {
      estudiantes: estudiantes.map((student) => ({
        id: Number(student.id),
        codigoEstudiante: student.codigoEstudiante,
        estado: student.estado,
        fechaIngreso: student.fechaIngreso,
        persona: {
          id: Number(student.persona.id),
          nombres: student.persona.nombres,
          apellidos: student.persona.apellidos,
          nombreCompleto: `${student.persona.nombres} ${student.persona.apellidos}`,
          email: student.persona.email,
          documento: student.persona.documento,
          estado: student.persona.estado,
        },
        grupos: (student.matriculas || []).map((matricula) => ({
          id: Number(matricula.grupo?.id),
          codigo: matricula.grupo?.codigo,
          nombre: matricula.grupo?.nombre,
        })),
      })),
      total,
      pagina: queryDto.pagina,
      limite: queryDto.limite,
      totalPaginas: Math.ceil(total / queryDto.limite),
      vista,
    };
  }
}
