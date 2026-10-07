import { ViewColumn, ViewEntity } from 'typeorm';

/**
 * Proyección de lectura sobre la vista que ya existe en la base de datos.
 * No crea una tabla nueva y no participa en escrituras.
 */
@ViewEntity({ name: 'vista_asistencias' })
export class AttendanceReportEntity {
  @ViewColumn()
  asistencia_id: number;

  @ViewColumn()
  fecha_clase: string;

  @ViewColumn()
  hora_registro: string;

  @ViewColumn()
  resultado: string;

  @ViewColumn()
  fuente: string;

  @ViewColumn()
  estudiante_id: number;

  @ViewColumn()
  codigo_estudiante: string;

  @ViewColumn()
  estudiante: string;

  @ViewColumn()
  carrera_codigo: string;

  @ViewColumn()
  carrera: string;

  @ViewColumn()
  grupo_codigo: string;

  @ViewColumn()
  semestre: number;

  @ViewColumn()
  materia_codigo: string;

  @ViewColumn()
  materia: string;

  @ViewColumn()
  docente: string;

  @ViewColumn()
  salon_codigo: string;
}
