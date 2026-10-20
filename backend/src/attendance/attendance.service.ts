import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Asistencia } from './entities/asistencia.entity';
import { ConsultarAsistenciaDto } from './dto/consultar-asistencia.dto';
import { CrearAsistenciaDto } from './dto/crear-asistencia.dto';
import { TapNfcDto } from './dto/tap-nfc.dto';

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
    private readonly events: EventEmitter2,
    private readonly configuracion: ConfigService,
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

  /**
   * Procesa un tap de tarjeta NFC. La hora y la fecha se calculan en el
   * servidor (zona horaria de Colombia), nunca desde datos enviados por el cliente.
   * Un bloqueo sobre la tarjeta serializa lecturas concurrentes del mismo medio;
   * el índice único de asistencias es la última barrera contra carreras.
   */
  async tapNfc(dto: TapNfcDto) {
    const ahora = new Date();
    const fechaHora = this.formatearFechaHoraColombia(ahora);
    const fecha = fechaHora.slice(0, 10);
    const hora = fechaHora.slice(11, 19);
    const weekday = this.diaSemanaIso(fecha);
    const cooldownSeconds = this.configuracion.getOrThrow<number>(
      'asistencia.intervaloTapSegundos',
    );
    const fechaLimiteReciente = this.formatearFechaHoraColombia(
      new Date(ahora.getTime() - cooldownSeconds * 1000),
    );

    let resultadoTap: {
      asistenciaId: number;
      estudianteId: number;
      codigoEstudiante: string;
      horarioId: number;
      grupoCodigo: string;
      materia: string;
      resultado: 'ASISTENCIA' | 'TARDANZA';
      fechaClase: string;
      horaRegistro: string;
      tarjetaId: number;
      dispositivoId: number;
    };

    try {
      resultadoTap = await this.dataSource.transaction(async (manager) => {
        const dispositivos = await manager.query(
          `SELECT id FROM dispositivos_nfc WHERE id = ? AND estado = 'ACTIVO' LIMIT 1`,
          [dto.dispositivoId],
        );
        if (!dispositivos.length) {
          throw new NotFoundException('El dispositivo NFC no existe o no está activo.');
        }

        const tarjetas = await manager.query(
          `SELECT id, estado FROM tarjetas_nfc WHERE uid = ? LIMIT 1 FOR UPDATE`,
          [dto.identificadorTarjeta],
        );
        if (!tarjetas.length) throw new NotFoundException('Tarjeta NFC no registrada.');
        const tarjeta = tarjetas[0] as { id: number; estado: string };
        if (tarjeta.estado !== 'ACTIVA') {
          throw new ConflictException('La tarjeta NFC no está activa.');
        }

        interface HorarioTap {
          estudianteId: number;
          codigoEstudiante: string;
          horarioId: number;
          grupoCodigo: string;
          materia: string;
          horaInicio: string;
        }

        const horarios = await manager.query(
          `SELECT e.id AS estudianteId,
                  e.codigo_estudiante AS codigoEstudiante,
                  h.id AS horarioId,
                  g.codigo AS grupoCodigo,
                  m.nombre AS materia,
                  h.hora_inicio AS horaInicio
           FROM asignaciones_tarjeta ta
           INNER JOIN estudiantes e ON e.persona_id = ta.persona_id
           INNER JOIN personas p ON p.id = e.persona_id
           INNER JOIN matriculas_grupo mg ON mg.estudiante_id = e.id
           INNER JOIN grupos g ON g.id = mg.grupo_id
           INNER JOIN periodos_academicos pa ON pa.id = g.periodo_id
           INNER JOIN asignaciones_docente ad ON ad.grupo_id = g.id
           INNER JOIN materias m ON m.id = ad.materia_id
           INNER JOIN horarios h ON h.asignacion_docente_id = ad.id
           WHERE ta.tarjeta_id = ?
             AND ta.fecha_fin IS NULL AND ta.fecha_inicio <= ?
             AND e.estado = 'ACTIVO' AND p.estado = 'ACTIVA'
             AND mg.estado = 'ACTIVA' AND mg.fecha_inicio <= ?
             AND (mg.fecha_fin IS NULL OR mg.fecha_fin >= ?)
             AND g.estado = 'ACTIVO'
             AND pa.estado = 'ACTIVO' AND pa.fecha_inicio <= ? AND pa.fecha_fin >= ?
             AND ad.estado = 'ACTIVA'
             AND (ad.fecha_inicio IS NULL OR ad.fecha_inicio <= ?)
             AND (ad.fecha_fin IS NULL OR ad.fecha_fin >= ?)
             AND h.estado = 'ACTIVO' AND h.dia_semana = ?
             AND h.hora_inicio <= ? AND h.hora_fin > ?
             AND h.vigencia_inicio <= ?
             AND (h.vigencia_fin IS NULL OR h.vigencia_fin >= ?)
           ORDER BY h.hora_inicio ASC`,
          [
            tarjeta.id,
            fechaHora,
            fecha,
            fecha,
            fecha,
            fecha,
            fecha,
            fecha,
            weekday,
            hora,
            hora,
            fecha,
            fecha,
          ],
        ) as HorarioTap[];

        if (!horarios.length) {
          throw new ConflictException(
            'La tarjeta no tiene una asignación vigente o el estudiante no está matriculado en un grupo con horario activo en este momento.',
          );
        }
        if (horarios.length > 1) {
          throw new ConflictException(
            'Hay más de un horario activo para este estudiante en este bloque. Corrija los horarios antes de registrar asistencia.',
          );
        }

        const horario = horarios[0];
        // Bloquea la fila del estudiante para evitar dos taps simultáneos
        // provenientes de dispositivos distintos.
        await manager.query('SELECT id FROM estudiantes WHERE id = ? FOR UPDATE', [horario.estudianteId]);

        const recientes = await manager.query(
          `SELECT id FROM asistencias
           WHERE estudiante_id = ? AND hora_registro >= ?
             AND resultado <> 'ANULADA'
           ORDER BY hora_registro DESC LIMIT 1`,
          [horario.estudianteId, fechaLimiteReciente],
        );
        if (recientes.length) {
          throw new HttpException(
            `Lectura duplicada. Espere al menos ${cooldownSeconds} segundos antes de volver a acercar la tarjeta.`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        const existente = await manager.query(
          `SELECT id FROM asistencias
           WHERE estudiante_id = ? AND horario_id = ? AND fecha_clase = ? LIMIT 1`,
          [horario.estudianteId, horario.horarioId, fecha],
        );
        if (existente.length) {
          throw new ConflictException('La asistencia de este estudiante para el horario de hoy ya fue registrada.');
        }

        const toleranciaMinutos = this.configuracion.getOrThrow<number>(
          'asistencia.toleranciaTardanzaMinutos',
        );
        const resultado: 'ASISTENCIA' | 'TARDANZA' =
          this.minutos(hora) > this.minutos(horario.horaInicio) + toleranciaMinutos
            ? 'TARDANZA'
            : 'ASISTENCIA';

        // Insertar el DATETIME como string mantiene la hora de pared de Colombia
        // y evita que la zona horaria del host convierta el valor inadvertidamente.
        const insertResult = await manager.query(
          `INSERT INTO asistencias
             (estudiante_id, horario_id, fecha_clase, hora_registro, resultado,
              fuente, tarjeta_id, dispositivo_id, observaciones)
           VALUES (?, ?, ?, ?, ?, 'NFC', ?, ?, NULL)`,
          [horario.estudianteId, horario.horarioId, fecha, fechaHora, resultado, tarjeta.id, dto.dispositivoId],
        );
        const insertPacket = Array.isArray(insertResult) ? insertResult[0] : insertResult;
        const asistenciaId = Number(
          insertPacket?.insertId ?? insertPacket?.raw?.insertId ?? insertPacket?.identifiers?.[0]?.id,
        );
        if (!Number.isSafeInteger(asistenciaId) || asistenciaId < 1) {
          throw new Error('No fue posible recuperar el ID de la asistencia recién insertada.');
        }

        return {
          asistenciaId,
          estudianteId: Number(horario.estudianteId),
          codigoEstudiante: horario.codigoEstudiante,
          horarioId: Number(horario.horarioId),
          grupoCodigo: horario.grupoCodigo,
          materia: horario.materia,
          resultado,
          fechaClase: fecha,
          horaRegistro: fechaHora,
          tarjetaId: Number(tarjeta.id),
          dispositivoId: dto.dispositivoId,
        };
      });
    } catch (error) {
      if (this.esDuplicadoMysql(error)) {
        throw new ConflictException('La asistencia ya fue registrada para el estudiante y el horario de hoy.');
      }
      throw error;
    }

    // Este evento deja desacoplada la futura proyección ETL hacia SIGEDIN/OLAP.
    // Se emite después del commit para que los listeners no lean una transacción abierta.
    this.events.emit('attendance.recorded', {
      ...resultadoTap,
      emittedAt: new Date().toISOString(),
    });

    return {
      mensaje: 'Asistencia registrada por NFC.',
      asistencia: resultadoTap,
    };
  }

  private formatearFechaHoraColombia(date: Date): string {
    const values = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.configuracion.getOrThrow<string>('asistencia.zonaHoraria'),
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const value = (type: string) => values.find((part) => part.type === type)?.value ?? '';
    return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}:${value('second')}`;
  }

  /** Convención de horarios: 1=lunes, ..., 7=domingo (ISO-8601). */
  private diaSemanaIso(fecha: string): number {
    const day = new Date(`${fecha}T12:00:00Z`).getUTCDay();
    return day === 0 ? 7 : day;
  }

  private minutos(hora: string): number {
    const [hours, minutes] = hora.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  }

  private esDuplicadoMysql(error: unknown): boolean {
    return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'ER_DUP_ENTRY');
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
