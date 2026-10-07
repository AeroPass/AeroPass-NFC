import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RoleCode } from '../common/enums/role.enum';
import { CrearAsistenciaDto } from './dto/crear-asistencia.dto';
import { ConsultarAsistenciaDto } from './dto/consultar-asistencia.dto';
import { Asistencia } from './entities/asistencia.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Asistencia) private readonly asistencias: Repository<Asistencia>,
    private readonly dataSource: DataSource,
  ) {}

  async crear(dto: CrearAsistenciaDto, user: AuthenticatedUser) {
    let sql = `SELECT h.id, ad.grupo_id, ad.docente_id
       FROM horarios h
       INNER JOIN asignaciones_docente ad ON ad.id = h.asignacion_docente_id
       WHERE h.id = ? AND h.estado = 'ACTIVO' AND ad.estado = 'ACTIVA'`;
    const params: unknown[] = [dto.horarioId];

    if (user.rol.codigo === RoleCode.DOCENTE) {
      const docente = await this.dataSource.query<any[]>(
        'SELECT id FROM docentes WHERE persona_id = ? AND estado = \'ACTIVO\'',
        [user.persona.id],
      );
      if (!docente.length) throw new ForbiddenException('La cuenta no tiene un registro de docente activo.');
      sql += ' AND ad.docente_id = ?';
      params.push(docente[0].id);
    }

    const horario = await this.dataSource.query<any[]>(sql, params);
    if (!horario.length) throw new NotFoundException('El horario no existe, no está activo o no pertenece al docente.');

    const estudiante = await this.dataSource.query<any[]>(
      "SELECT id FROM estudiantes WHERE id = ? AND estado = 'ACTIVO'",
      [dto.estudianteId],
    );
    if (!estudiante.length) throw new NotFoundException('El estudiante no existe o no está activo.');

    const matricula = await this.dataSource.query<any[]>(
      `SELECT id FROM matriculas_grupo
       WHERE estudiante_id = ? AND grupo_id = ? AND estado = 'ACTIVA'
         AND fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?)`,
      [dto.estudianteId, horario[0].grupo_id, dto.fechaClase, dto.fechaClase],
    );
    if (!matricula.length) throw new ConflictException('El estudiante no está matriculado en el grupo.');

    const existente = await this.asistencias.findOne({
      where: {
        estudianteId: dto.estudianteId,
        horarioId: dto.horarioId,
        fechaClase: dto.fechaClase,
      },
    });
    if (existente) throw new ConflictException('Ya existe asistencia para ese estudiante, horario y fecha.');

    const asistencia = this.asistencias.create({
      estudianteId: dto.estudianteId,
      horarioId: dto.horarioId,
      fechaClase: dto.fechaClase,
      horaRegistro: dto.horaRegistro ? new Date(dto.horaRegistro) : new Date(),
      resultado: dto.resultado ?? 'ASISTENCIA',
      fuente: dto.fuente ?? 'MANUAL',
      tarjetaId: null,
      dispositivoId: null,
      observaciones: dto.observaciones ?? null,
    });

    return this.asistencias.save(asistencia);
  }

  async consultar(queryDto: ConsultarAsistenciaDto, user: AuthenticatedUser) {
    const builder = this.baseQuery();
    await this.aplicarPermisosDeAlcance(builder, user);
    this.aplicarFiltros(builder, queryDto);

    const total = await builder.clone().select('COUNT(DISTINCT asistencia.id)', 'total').getRawOne<{ total: string }>();
    const registros = await builder
      .orderBy('asistencia.fecha_clase', 'DESC')
      .addOrderBy('asistencia.hora_registro', 'DESC')
      .offset((queryDto.pagina - 1) * queryDto.limite)
      .limit(queryDto.limite)
      .getRawMany();

    return {
      registros,
      total: Number(total?.total ?? 0),
      pagina: queryDto.pagina,
      limite: queryDto.limite,
    };
  }

  private baseQuery() {
    return this.asistencias
      .createQueryBuilder('asistencia')
      .innerJoin('horarios', 'horario', 'horario.id = asistencia.horario_id')
      .innerJoin('asignaciones_docente', 'asignacion', 'asignacion.id = horario.asignacion_docente_id')
      .innerJoin('estudiantes', 'estudiante', 'estudiante.id = asistencia.estudiante_id')
      .innerJoin('personas', 'persona_estudiante', 'persona_estudiante.id = estudiante.persona_id')
      .innerJoin('docentes', 'docente', 'docente.id = asignacion.docente_id')
      .innerJoin('personas', 'persona_docente', 'persona_docente.id = docente.persona_id')
      .innerJoin('materias', 'materia', 'materia.id = asignacion.materia_id')
      .innerJoin('grupos', 'grupo', 'grupo.id = asignacion.grupo_id')
      .select([
        'asistencia.id AS asistencia_id',
        'asistencia.estudiante_id AS estudiante_id',
        'asistencia.horario_id AS horario_id',
        'asistencia.fecha_clase AS fecha_clase',
        'asistencia.hora_registro AS hora_registro',
        'asistencia.resultado AS resultado',
        'asistencia.fuente AS fuente',
        'asistencia.observaciones AS observaciones',
        'docente.id AS docente_id',
        "CONCAT(persona_estudiante.nombres, ' ', persona_estudiante.apellidos) AS estudiante",
        'estudiante.codigo_estudiante AS codigo_estudiante',
        "CONCAT(persona_docente.nombres, ' ', persona_docente.apellidos) AS docente",
        'materia.nombre AS materia',
        'grupo.codigo AS grupo_codigo',
      ]);
  }

  private async aplicarPermisosDeAlcance(builder: any, user: AuthenticatedUser) {
    if (user.rol.codigo !== RoleCode.DOCENTE) return;

    const docente = await this.dataSource.query<any[]>(
      'SELECT id FROM docentes WHERE persona_id = ? AND estado = \'ACTIVO\'',
      [user.persona.id],
    );
    if (!docente.length) throw new ForbiddenException('La cuenta no tiene un registro de docente activo.');
    builder.andWhere('docente.id = :currentDocenteId', { currentDocenteId: docente[0].id });
  }

  private aplicarFiltros(builder: any, query: ConsultarAsistenciaDto) {
    if (query.desde) builder.andWhere('asistencia.fecha_clase >= :desde', { desde: query.desde });
    if (query.hasta) builder.andWhere('asistencia.fecha_clase <= :hasta', { hasta: query.hasta });
    if (query.estudianteId) builder.andWhere('asistencia.estudiante_id = :estudianteId', { estudianteId: query.estudianteId });
    if (query.horarioId) builder.andWhere('asistencia.horario_id = :horarioId', { horarioId: query.horarioId });
    if (query.docenteId) builder.andWhere('docente.id = :docenteId', { docenteId: query.docenteId });
    if (query.materiaId) builder.andWhere('materia.id = :materiaId', { materiaId: query.materiaId });
    if (query.grupoId) builder.andWhere('grupo.id = :grupoId', { grupoId: query.grupoId });
    if (query.resultado) builder.andWhere('asistencia.resultado = :resultado', { resultado: query.resultado });
  }
}
