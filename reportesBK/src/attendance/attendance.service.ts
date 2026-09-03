import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Asistencia } from './entities/asistencia.entity';
import { ConsultarAsistenciaDto } from './dto/consultar-asistencia.dto';
import { CrearAsistenciaDto } from './dto/crear-asistencia.dto';

interface HorarioActivo {
  id: number;
  grupo_id: number;
}

interface MatriculaActiva {
  id: number;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistencias: Repository<Asistencia>,
    private readonly dataSource: DataSource,
  ) {}

  async crear(dto: CrearAsistenciaDto) {
    const horario = await this.dataSource.query<HorarioActivo[]>(
      `SELECT h.id, ad.grupo_id
       FROM horarios h
       INNER JOIN asignaciones_docente ad ON ad.id = h.asignacion_docente_id
       WHERE h.id = ? AND h.estado = 'ACTIVO' AND ad.estado = 'ACTIVA'`,
      [dto.horarioId],
    );
    if (!horario.length)
      throw new NotFoundException('El horario no existe o no esta activo');

    const matricula = await this.dataSource.query<MatriculaActiva[]>(
      `SELECT id FROM matriculas_grupo
       WHERE estudiante_id = ? AND grupo_id = ? AND estado = 'ACTIVA'
         AND fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?)`,
      [dto.estudianteId, horario[0].grupo_id, dto.fechaClase, dto.fechaClase],
    );
    if (!matricula.length)
      throw new ConflictException(
        'El estudiante no esta matriculado en el grupo',
      );

    const existente = await this.asistencias.findOne({
      where: {
        estudianteId: dto.estudianteId,
        horarioId: dto.horarioId,
        fechaClase: dto.fechaClase,
      },
    });
    if (existente)
      throw new ConflictException(
        'Ya existe asistencia para ese estudiante, horario y fecha',
      );

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

  async consultar(query: ConsultarAsistenciaDto) {
    const builder = this.baseQuery();
    this.aplicarFiltros(builder, query);
    const total = await builder
      .clone()
      .select('COUNT(DISTINCT asistencia.id)', 'total')
      .getRawOne<{ total: string }>();
    const registros = await builder
      .orderBy('asistencia.fecha_clase', 'DESC')
      .addOrderBy('asistencia.hora_registro', 'DESC')
      .offset((query.pagina - 1) * query.limite)
      .limit(query.limite)
      .getRawMany();
    return {
      registros,
      total: Number(total?.total ?? 0),
      pagina: query.pagina,
      limite: query.limite,
    };
  }

  private baseQuery() {
    return this.asistencias
      .createQueryBuilder('asistencia')
      .innerJoin('horarios', 'horario', 'horario.id = asistencia.horario_id')
      .innerJoin(
        'asignaciones_docente',
        'asignacion',
        'asignacion.id = horario.asignacion_docente_id',
      )
      .innerJoin(
        'estudiantes',
        'estudiante',
        'estudiante.id = asistencia.estudiante_id',
      )
      .innerJoin(
        'personas',
        'persona_estudiante',
        'persona_estudiante.id = estudiante.persona_id',
      )
      .innerJoin('docentes', 'docente', 'docente.id = asignacion.docente_id')
      .innerJoin(
        'personas',
        'persona_docente',
        'persona_docente.id = docente.persona_id',
      )
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
        "CONCAT(persona_estudiante.nombres, ' ', persona_estudiante.apellidos) AS estudiante",
        'estudiante.codigo_estudiante AS codigo_estudiante',
        "CONCAT(persona_docente.nombres, ' ', persona_docente.apellidos) AS docente",
        'materia.nombre AS materia',
        'grupo.codigo AS grupo_codigo',
      ]);
  }

  private aplicarFiltros(
    builder: ReturnType<AttendanceService['baseQuery']>,
    query: ConsultarAsistenciaDto,
  ) {
    if (query.desde)
      builder.andWhere('asistencia.fecha_clase >= :desde', {
        desde: query.desde,
      });
    if (query.hasta)
      builder.andWhere('asistencia.fecha_clase <= :hasta', {
        hasta: query.hasta,
      });
    if (query.estudianteId)
      builder.andWhere('asistencia.estudiante_id = :estudianteId', {
        estudianteId: query.estudianteId,
      });
    if (query.horarioId)
      builder.andWhere('asistencia.horario_id = :horarioId', {
        horarioId: query.horarioId,
      });
    if (query.docenteId)
      builder.andWhere('docente.id = :docenteId', {
        docenteId: query.docenteId,
      });
    if (query.materiaId)
      builder.andWhere('materia.id = :materiaId', {
        materiaId: query.materiaId,
      });
    if (query.grupoId)
      builder.andWhere('grupo.id = :grupoId', { grupoId: query.grupoId });
    if (query.resultado)
      builder.andWhere('asistencia.resultado = :resultado', {
        resultado: query.resultado,
      });
  }
}
