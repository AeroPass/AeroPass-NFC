import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, QueryRunner } from 'typeorm';
import { ResultadoSincronizacionDto } from './dto/resultado-sincronizacion.dto';

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

type TipoDocumento = { codigo: string; nombre: string; activo: number };
type Carrera = {
  codigo: string;
  nombre: string;
  estado: 'ACTIVA' | 'INACTIVA';
};
type Semestre = {
  numero: number;
  nombre: string;
  estado: 'ACTIVO' | 'INACTIVO';
};
type PeriodoAcademico = {
  codigo: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'PLANIFICADO' | 'ACTIVO' | 'CERRADO' | 'CANCELADO';
};
type Materia = {
  codigo: string;
  nombre: string;
  creditos: number | null;
  horas_semanales: string | null;
  estado: 'ACTIVA' | 'INACTIVA';
};
type Salon = {
  codigo: string;
  nombre: string;
  edificio: string | null;
  piso: string | null;
  capacidad: number | null;
  estado: 'DISPONIBLE' | 'INACTIVO' | 'MANTENIMIENTO';
};

@Injectable()
export class SincronizacionAcademicaService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SincronizacionAcademicaService.name);
  private readonly origenDataSource: DataSource;
  private temporizador?: NodeJS.Timeout;
  private sincronizacionEnCurso = false;

  constructor(
    private readonly config: ConfigService,
    private readonly destinoDataSource: DataSource,
  ) {
    this.origenDataSource = new DataSource({
      type: 'mysql',
      host: this.config.get<string>('SIGEDIN_DB_HOST') ?? '127.0.0.1',
      port: Number(this.config.get<string>('SIGEDIN_DB_PORT') ?? 3306),
      username: this.config.get<string>('SIGEDIN_DB_USERNAME') ?? 'root',
      password: this.config.get<string>('SIGEDIN_DB_PASSWORD') ?? '',
      database: this.config.get<string>('SIGEDIN_DB_DATABASE') ?? 'sigedin',
      synchronize: false,
    });
  }

  onModuleInit(): void {
    this.temporizador = setInterval(() => {
      void this.ejecutarSincronizacionProgramada();
    }, SIX_HOURS_IN_MS);
    this.logger.log('ETL académico programado para ejecutarse cada 6 horas.');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.temporizador) clearInterval(this.temporizador);
    if (this.origenDataSource.isInitialized)
      await this.origenDataSource.destroy();
  }

  async sincronizarDatosMaestros(): Promise<ResultadoSincronizacionDto> {
    if (this.sincronizacionEnCurso) {
      throw new Error('Ya existe una sincronización académica en ejecución.');
    }

    this.sincronizacionEnCurso = true;
    const iniciadoEn = new Date().toISOString();
    const destino = this.destinoDataSource.createQueryRunner();

    try {
      await this.obtenerOrigen();
      await destino.connect();
      await destino.startTransaction();

      const registrosProcesados = {
        tiposDocumento: await this.sincronizarTiposDocumento(destino),
        carreras: await this.sincronizarCarreras(destino),
        semestres: await this.sincronizarSemestres(destino),
        periodosAcademicos: await this.sincronizarPeriodos(destino),
        materias: await this.sincronizarMaterias(destino),
        salones: await this.sincronizarSalones(destino),
      };

      await destino.commitTransaction();
      const resultado = {
        iniciadoEn,
        finalizadoEn: new Date().toISOString(),
        registrosProcesados,
      };
      this.logger.log(`ETL académico completado: ${JSON.stringify(resultado)}`);
      return resultado;
    } catch (error) {
      if (destino.isTransactionActive) await destino.rollbackTransaction();
      throw error;
    } finally {
      await destino.release();
      this.sincronizacionEnCurso = false;
    }
  }

  private async ejecutarSincronizacionProgramada(): Promise<void> {
    try {
      await this.sincronizarDatosMaestros();
    } catch (error) {
      this.logger.error(
        'Falló la ejecución programada del ETL académico.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async sincronizarTiposDocumento(
    destino: QueryRunner,
  ): Promise<number> {
    const filas = await this.consultarOrigen<TipoDocumento>(
      'SELECT codigo, nombre, activo FROM tipos_documento',
    );
    for (const fila of filas) {
      await destino.query(
        `INSERT INTO tipos_documento (codigo, nombre, activo) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo)`,
        [fila.codigo, fila.nombre, fila.activo],
      );
    }
    return filas.length;
  }

  private async sincronizarCarreras(destino: QueryRunner): Promise<number> {
    const filas = await this.consultarOrigen<Carrera>(
      'SELECT codigo, nombre, estado FROM carreras',
    );
    for (const fila of filas) {
      await destino.query(
        `INSERT INTO carreras (codigo, nombre, estado) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), estado = VALUES(estado)`,
        [fila.codigo, fila.nombre, fila.estado],
      );
    }
    return filas.length;
  }

  private async sincronizarSemestres(destino: QueryRunner): Promise<number> {
    const filas = await this.consultarOrigen<Semestre>(
      'SELECT numero, nombre, estado FROM semestres',
    );
    for (const fila of filas) {
      await destino.query(
        `INSERT INTO semestres (numero, nombre, estado) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), estado = VALUES(estado)`,
        [fila.numero, fila.nombre, fila.estado],
      );
    }
    return filas.length;
  }

  private async sincronizarPeriodos(destino: QueryRunner): Promise<number> {
    const filas = await this.consultarOrigen<PeriodoAcademico>(
      'SELECT codigo, nombre, fecha_inicio, fecha_fin, estado FROM periodos_academicos',
    );
    for (const fila of filas) {
      await destino.query(
        `INSERT INTO periodos_academicos (codigo, nombre, fecha_inicio, fecha_fin, estado)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), fecha_inicio = VALUES(fecha_inicio),
           fecha_fin = VALUES(fecha_fin), estado = VALUES(estado)`,
        [
          fila.codigo,
          fila.nombre,
          fila.fecha_inicio,
          fila.fecha_fin,
          fila.estado,
        ],
      );
    }
    return filas.length;
  }

  private async sincronizarMaterias(destino: QueryRunner): Promise<number> {
    const filas = await this.consultarOrigen<Materia>(
      'SELECT codigo, nombre, creditos, horas_semanales, estado FROM materias',
    );
    for (const fila of filas) {
      await destino.query(
        `INSERT INTO materias (codigo, nombre, creditos, horas_semanales, estado)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), creditos = VALUES(creditos),
           horas_semanales = VALUES(horas_semanales), estado = VALUES(estado)`,
        [
          fila.codigo,
          fila.nombre,
          fila.creditos,
          fila.horas_semanales,
          fila.estado,
        ],
      );
    }
    return filas.length;
  }

  private async sincronizarSalones(destino: QueryRunner): Promise<number> {
    const filas = await this.consultarOrigen<Salon>(
      'SELECT codigo, nombre, edificio, piso, capacidad, estado FROM salones',
    );
    for (const fila of filas) {
      await destino.query(
        `INSERT INTO salones (codigo, nombre, edificio, piso, capacidad, estado)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), edificio = VALUES(edificio),
           piso = VALUES(piso), capacidad = VALUES(capacidad), estado = VALUES(estado)`,
        [
          fila.codigo,
          fila.nombre,
          fila.edificio,
          fila.piso,
          fila.capacidad,
          fila.estado,
        ],
      );
    }
    return filas.length;
  }

  private async obtenerOrigen(): Promise<void> {
    if (!this.origenDataSource.isInitialized)
      await this.origenDataSource.initialize();
  }

  private async consultarOrigen<T>(consulta: string): Promise<T[]> {
    const resultado: unknown = await this.origenDataSource.query(consulta);
    if (!Array.isArray(resultado)) {
      throw new Error(
        'La consulta al origen no devolvió una colección de filas.',
      );
    }
    return resultado as T[];
  }
}
