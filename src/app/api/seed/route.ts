import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

/**
 * POST /api/seed
 *
 * Crea los datos mínimos para que el sistema funcione (si tu MySQL está vacío):
 *   - Tipos de documento (CC, TI, CE, PAS)
 *   - 4 roles: ADMIN, DOCENTE, ADMINISTRATIVO, ESTUDIANTE
 *   - 25 permisos (en 8 módulos)
 *   - rol_permiso: ADMIN recibe TODOS los permisos, DOCENTE recibe AUTH_LOGIN + ASISTENCIAS_LEER
 *   - 1 carrera, 1 semestre, 1 periodo, 1 materia, 1 salon (para poder crear grupos)
 *   - 1 grupo
 *   - 1 usuario admin (admin / admin123) con todos los permisos
 *   - 1 usuario docente (docente / doc123) con permisos limitados
 *   - 2 estudiantes matriculados en el grupo del docente
 *
 * Si ya importaste control_acceso_nfc.sql en tu MySQL, NO necesitas
 * llamar a este endpoint. Tu MySQL ya tiene los datos.
 */
export async function POST() {
  const count = await db.usuario.count()
  if (count > 0) {
    return NextResponse.json(
      {
        error:
          'La base de datos ya tiene usuarios. Si quieres recrearlos, elimínalos primero o usa el script sql/crear_admin.sql.',
      },
      { status: 400 }
    )
  }

  // 1. Tipos de documento
  await db.tiposDocumento.createMany({
    data: [
      { codigo: 'CC',  nombre: 'Cédula de Ciudadanía' },
      { codigo: 'TI',  nombre: 'Tarjeta de Identidad' },
      { codigo: 'CE',  nombre: 'Cédula de Extranjería' },
      { codigo: 'PAS', nombre: 'Pasaporte' },
    ],
  })

  // 2. Roles (en orden secuencial para IDs predecibles)
  const admin = await db.rol.create({ data: { codigo: 'ADMIN',          nombre: 'Administrador',           descripcion: 'Administración completa del sistema' } })
  const docenteRol = await db.rol.create({ data: { codigo: 'DOCENTE',       nombre: 'Docente',                 descripcion: 'Operación académica' } })
  await db.rol.create({ data: { codigo: 'ADMINISTRATIVO', nombre: 'Personal Administrativo', descripcion: 'Funciones administrativas' } })
  await db.rol.create({ data: { codigo: 'ESTUDIANTE',     nombre: 'Estudiante',              descripcion: 'Identificación NFC' } })

  // 3. Permisos (25 en 8 módulos)
  const permisosData = [
    { codigo: 'AUTH_LOGIN',            nombre: 'Iniciar sesión',                  modulo: 'AUTH' },
    { codigo: 'USUARIOS_LEER',         nombre: 'Consultar usuarios',              modulo: 'USUARIOS' },
    { codigo: 'USUARIOS_CREAR',        nombre: 'Crear usuarios',                  modulo: 'USUARIOS' },
    { codigo: 'USUARIOS_EDITAR',       nombre: 'Editar usuarios',                 modulo: 'USUARIOS' },
    { codigo: 'USUARIOS_ESTADO',       nombre: 'Cambiar estado de usuarios',      modulo: 'USUARIOS' },
    { codigo: 'ROLES_GESTIONAR',       nombre: 'Gestionar roles',                 modulo: 'SEGURIDAD' },
    { codigo: 'PERMISOS_GESTIONAR',    nombre: 'Gestionar permisos',              modulo: 'SEGURIDAD' },
    { codigo: 'TARJETAS_LEER',         nombre: 'Consultar tarjetas',              modulo: 'NFC' },
    { codigo: 'TARJETAS_GESTIONAR',    nombre: 'Gestionar tarjetas',              modulo: 'NFC' },
    { codigo: 'DISPOSITIVOS_GESTIONAR',nombre: 'Gestionar dispositivos',          modulo: 'NFC' },
    { codigo: 'CARRERAS_GESTIONAR',    nombre: 'Gestionar carreras',              modulo: 'ACADEMICO' },
    { codigo: 'SEMESTRES_GESTIONAR',   nombre: 'Gestionar semestres',             modulo: 'ACADEMICO' },
    { codigo: 'PERIODOS_GESTIONAR',    nombre: 'Gestionar periodos',              modulo: 'ACADEMICO' },
    { codigo: 'MATERIAS_GESTIONAR',    nombre: 'Gestionar materias',              modulo: 'ACADEMICO' },
    { codigo: 'GRUPOS_GESTIONAR',      nombre: 'Gestionar grupos',                modulo: 'ACADEMICO' },
    { codigo: 'MATRICULAS_GESTIONAR',  nombre: 'Gestionar matrículas',            modulo: 'ACADEMICO' },
    { codigo: 'ASIGNACIONES_GESTIONAR',nombre: 'Gestionar asignaciones docentes', modulo: 'ACADEMICO' },
    { codigo: 'SALONES_GESTIONAR',     nombre: 'Gestionar salones',               modulo: 'ACADEMICO' },
    { codigo: 'HORARIOS_GESTIONAR',    nombre: 'Gestionar horarios',              modulo: 'ACADEMICO' },
    { codigo: 'ASISTENCIAS_NFC',       nombre: 'Registrar asistencia NFC',        modulo: 'ASISTENCIA' },
    { codigo: 'ASISTENCIAS_LEER',      nombre: 'Consultar asistencia',            modulo: 'ASISTENCIA' },
    { codigo: 'ASISTENCIAS_EDITAR',    nombre: 'Corregir asistencia',             modulo: 'ASISTENCIA' },
    { codigo: 'AUDITORIA_LEER',        nombre: 'Consultar auditoría',             modulo: 'AUDITORIA' },
    { codigo: 'CONFIG_LEER',           nombre: 'Consultar configuración',         modulo: 'CONFIGURACION' },
    { codigo: 'CONFIG_EDITAR',         nombre: 'Modificar configuración',         modulo: 'CONFIGURACION' },
  ]
  await db.permiso.createMany({ data: permisosData })

  // 4. ADMIN recibe TODOS los permisos
  const allPermisos = await db.permiso.findMany({ select: { id: true } })
  await db.rolPermiso.createMany({
    data: allPermisos.map((p) => ({ rolId: admin.id, permisoId: p.id })),
  })

  // 5. DOCENTE recibe AUTH_LOGIN + ASISTENCIAS_LEER
  const docentePermisos = await db.permiso.findMany({
    where: { codigo: { in: ['AUTH_LOGIN', 'ASISTENCIAS_LEER'] } },
    select: { id: true },
  })
  await db.rolPermiso.createMany({
    data: docentePermisos.map((p) => ({ rolId: docenteRol.id, permisoId: p.id })),
  })

  // 6. Datos académicos básicos (para poder crear grupos y matricular estudiantes)
  const tipoCC = await db.tiposDocumento.findUnique({ where: { codigo: 'CC' } })

  const carrera = await db.carrera.create({
    data: { codigo: 'ING-SIS', nombre: 'Ingeniería de Sistemas', estado: 'ACTIVA' },
  })

  const semestre = await db.semestre.create({
    data: { numero: 1, nombre: 'Primer Semestre', estado: 'ACTIVO' },
  })

  const periodo = await db.periodo.create({
    data: {
      codigo: '2025-1',
      nombre: 'Periodo 2025-1',
      fechaInicio: new Date('2025-02-01'),
      fechaFin: new Date('2025-06-30'),
      estado: 'ACTIVO',
    },
  })

  const materia = await db.materia.create({
    data: { codigo: 'PROG-101', nombre: 'Programación I', creditos: 3, horasSemanales: 4, estado: 'ACTIVA' },
  })

  const salon = await db.salon.create({
    data: { codigo: 'SAL-101', nombre: 'Salón 101', edificio: 'Edificio A', capacidad: 40, estado: 'DISPONIBLE' },
  })

  const grupo = await db.grupo.create({
    data: {
      carreraId: carrera.id,
      semestreId: semestre.id,
      periodoId: periodo.id,
      codigo: 'G1',
      nombre: 'Grupo Único',
      jornada: 'DIURNA',
      modalidad: 'PRESENCIAL',
      estado: 'ACTIVO',
    },
  })

  // 7. Personas + Usuarios
  const personaAdmin = await db.persona.create({
    data: { tipoDocumentoId: tipoCC!.id, documento: '1000000001', nombres: 'Admin', apellidos: 'Principal', email: 'admin@nfc.edu', estado: 'ACTIVA' },
  })
  const personaDocente = await db.persona.create({
    data: { tipoDocumentoId: tipoCC!.id, documento: '1000000002', nombres: 'Juan Carlos', apellidos: 'Pérez', email: 'juan@nfc.edu', estado: 'ACTIVA' },
  })

  await db.usuario.create({
    data: { personaId: personaAdmin.id, rolId: admin.id, username: 'admin', passwordHash: await hashPassword('admin123'), estado: 'ACTIVO' },
  })
  await db.usuario.create({
    data: { personaId: personaDocente.id, rolId: docenteRol.id, username: 'docente', passwordHash: await hashPassword('doc123'), estado: 'ACTIVO' },
  })

  // 8. Registrar al docente en la tabla `docentes`
  const docente = await db.docente.create({
    data: { personaId: personaDocente.id, codigoDocente: 'DOC-001', estado: 'ACTIVO' },
  })

  // 9. Asignar el docente a la materia y grupo
  const asignacion = await db.asignacionDocente.create({
    data: { docenteId: docente.id, materiaId: materia.id, grupoId: grupo.id, estado: 'ACTIVA' },
  })

  // 10. Crear 2 estudiantes y matricularlos en el grupo del docente
  const personaEst1 = await db.persona.create({
    data: { tipoDocumentoId: tipoCC!.id, documento: '1000000003', nombres: 'María', apellidos: 'González', email: 'maria@est.edu', estado: 'ACTIVA' },
  })
  const personaEst2 = await db.persona.create({
    data: { tipoDocumentoId: tipoCC!.id, documento: '1000000004', nombres: 'Pedro', apellidos: 'Martínez', email: 'pedro@est.edu', estado: 'ACTIVA' },
  })

  const estudiante1 = await db.estudiante.create({
    data: { personaId: personaEst1.id, codigoEstudiante: 'EST-001', estado: 'ACTIVO' },
  })
  const estudiante2 = await db.estudiante.create({
    data: { personaId: personaEst2.id, codigoEstudiante: 'EST-002', estado: 'ACTIVO' },
  })

  await db.matriculaGrupo.createMany({
    data: [
      { estudianteId: estudiante1.id, grupoId: grupo.id, fechaInicio: new Date('2025-02-01'), estado: 'ACTIVA' },
      { estudianteId: estudiante2.id, grupoId: grupo.id, fechaInicio: new Date('2025-02-01'), estado: 'ACTIVA' },
    ],
  })

  return NextResponse.json({
    ok: true,
    message: 'Datos iniciales creados correctamente.',
    credentials: [
      { username: 'admin', password: 'admin123', rol: 'ADMIN', note: 'Todos los permisos (25)' },
      { username: 'docente', password: 'doc123', rol: 'DOCENTE', note: '2 estudiantes asignados' },
    ],
    academicData: {
      carrera: carrera.nombre,
      semestre: semestre.nombre,
      periodo: periodo.nombre,
      materia: materia.nombre,
      grupo: grupo.codigo,
      estudiantes: 2,
    },
  })
}
