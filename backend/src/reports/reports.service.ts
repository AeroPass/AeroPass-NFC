import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RoleCode } from '../common/enums/role.enum';
import { Asistencia } from '../attendance/entities/asistencia.entity';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';

export interface ReporteAsistencia {
  asistencia_id: number;
  fecha_clase: string;
  hora_registro: string;
  resultado: string;
  fuente: string;
  observaciones: string | null;
  estudiante_id: number;
  codigo_estudiante: string;
  estudiante: string;
  docente_id: number;
  docente: string;
  materia_id: number;
  materia_codigo: string;
  materia: string;
  grupo_id: number;
  grupo_codigo: string;
  carrera: string;
  semestre: string;
  salon_codigo: string;
}

@Injectable()
export class ReportsService {
  constructor(@InjectRepository(Asistencia) private readonly asistencias: Repository<Asistencia>) {}

  async detail(query: AttendanceReportQueryDto, user: AuthenticatedUser) {
    const builder = this.baseQuery();
    this.applyScope(builder, user);
    this.applyFilters(builder, query);

    const total = await builder.clone().select('COUNT(DISTINCT asistencia.id)', 'total').getRawOne<{ total: string }>();
    const registros = await builder
      .orderBy('asistencia.fecha_clase', 'DESC')
      .addOrderBy('asistencia.hora_registro', 'DESC')
      .offset((query.pagina - 1) * query.limite)
      .limit(query.limite)
      .getRawMany<ReporteAsistencia>();

    return {
      registros,
      total: Number(total?.total ?? 0),
      pagina: query.pagina,
      limite: query.limite,
    };
  }

  async summary(query: AttendanceReportQueryDto, user: AuthenticatedUser) {
    const builder = this.baseQuery()
      .select('COUNT(DISTINCT asistencia.id)', 'total')
      .addSelect("SUM(asistencia.resultado = 'ASISTENCIA')", 'asistencias')
      .addSelect("SUM(asistencia.resultado = 'TARDANZA')", 'tardanzas')
      .addSelect("SUM(asistencia.resultado = 'JUSTIFICADA')", 'justificadas')
      .addSelect("SUM(asistencia.resultado = 'ANULADA')", 'anuladas');

    this.applyScope(builder, user);
    this.applyFilters(builder, query);

    const row = await builder.getRawOne<Record<string, string>>();
    const total = Number(row?.total ?? 0);
    const asistencias = Number(row?.asistencias ?? 0);

    return {
      total,
      asistencias,
      tardanzas: Number(row?.tardanzas ?? 0),
      justificadas: Number(row?.justificadas ?? 0),
      anuladas: Number(row?.anuladas ?? 0),
      porcentajeAsistencia: total ? Number(((asistencias / total) * 100).toFixed(2)) : 0,
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
      .innerJoin('carreras', 'carrera', 'carrera.id = grupo.carrera_id')
      .innerJoin('semestres', 'semestre', 'semestre.id = grupo.semestre_id')
      .innerJoin('salones', 'salon', 'salon.id = horario.salon_id')
      .select([
        'asistencia.id AS asistencia_id',
        'asistencia.fecha_clase AS fecha_clase',
        'asistencia.hora_registro AS hora_registro',
        'asistencia.resultado AS resultado',
        'asistencia.fuente AS fuente',
        'asistencia.observaciones AS observaciones',
        'estudiante.id AS estudiante_id',
        'estudiante.codigo_estudiante AS codigo_estudiante',
        "CONCAT(persona_estudiante.nombres, ' ', persona_estudiante.apellidos) AS estudiante",
        'docente.id AS docente_id',
        "CONCAT(persona_docente.nombres, ' ', persona_docente.apellidos) AS docente",
        'materia.id AS materia_id',
        'materia.codigo AS materia_codigo',
        'materia.nombre AS materia',
        'grupo.id AS grupo_id',
        'grupo.codigo AS grupo_codigo',
        'carrera.nombre AS carrera',
        'semestre.nombre AS semestre',
        'salon.codigo AS salon_codigo',
      ]);
  }

  private applyScope(builder: SelectQueryBuilder<Asistencia>, user: AuthenticatedUser) {
    if (user.rol.codigo !== RoleCode.DOCENTE) return;

    // Se obtiene el docente mediante persona.id usando una subconsulta para no abrir datos de otros docentes.
    builder.andWhere(
      'docente.id = (SELECT d.id FROM docentes d WHERE d.persona_id = :currentPersonaId AND d.estado = \'ACTIVO\')',
      { currentPersonaId: user.persona.id },
    );
  }

  private applyFilters(builder: SelectQueryBuilder<Asistencia>, query: AttendanceReportQueryDto) {
    if (query.desde) builder.andWhere('asistencia.fecha_clase >= :desde', { desde: query.desde });
    if (query.hasta) builder.andWhere('asistencia.fecha_clase <= :hasta', { hasta: query.hasta });
    if (query.asignacionDocenteId) builder.andWhere('asignacion.id = :asignacionDocenteId', { asignacionDocenteId: query.asignacionDocenteId });
    if (query.docenteId) builder.andWhere('docente.id = :docenteId', { docenteId: query.docenteId });
    if (query.materiaId) builder.andWhere('materia.id = :materiaId', { materiaId: query.materiaId });
    if (query.grupoId) builder.andWhere('grupo.id = :grupoId', { grupoId: query.grupoId });
    if (query.estudianteId) builder.andWhere('estudiante.id = :estudianteId', { estudianteId: query.estudianteId });
    if (query.resultado) builder.andWhere('asistencia.resultado = :resultado', { resultado: query.resultado });
  }
}
