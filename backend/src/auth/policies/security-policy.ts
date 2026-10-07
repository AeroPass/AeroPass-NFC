import { RoleCode } from '../../common/enums/role.enum';

export type PermissionDefinition = readonly [codigo: string, nombre: string, modulo: string, descripcion: string];

export const SECURITY_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  ['AUTH_LOGIN', 'Iniciar sesión', 'AUTH', 'Autenticarse en el sistema.'],
  ['USUARIOS_LEER', 'Consultar usuarios', 'USUARIOS', 'Consultar personas y cuentas autorizadas.'],
  ['USUARIOS_CREAR', 'Crear usuarios', 'USUARIOS', 'Crear cuentas de usuario.'],
  ['USUARIOS_EDITAR', 'Editar usuarios', 'USUARIOS', 'Modificar usuarios.'],
  ['USUARIOS_ESTADO', 'Cambiar estado de usuarios', 'USUARIOS', 'Activar, inactivar o bloquear usuarios.'],
  ['ROLES_GESTIONAR', 'Gestionar roles', 'SEGURIDAD', 'Administrar los cuatro roles definidos por el sistema.'],
  ['PERMISOS_GESTIONAR', 'Gestionar permisos', 'SEGURIDAD', 'Administrar permisos.'],
  ['TARJETAS_LEER', 'Consultar tarjetas', 'NFC', 'Consultar tarjetas NFC.'],
  ['TARJETAS_GESTIONAR', 'Gestionar tarjetas', 'NFC', 'Registrar, bloquear y actualizar tarjetas.'],
  ['DISPOSITIVOS_GESTIONAR', 'Gestionar dispositivos', 'NFC', 'Administrar lectores y agentes.'],
  ['ACADEMICO_GESTIONAR', 'Gestionar académico', 'ACADEMICO', 'Gestionar los datos maestros académicos.'],
  ['ASISTENCIAS_NFC', 'Registrar asistencia NFC', 'ASISTENCIA', 'Registrar asistencia originada por lectores NFC.'],
  ['ASISTENCIAS_LEER', 'Consultar asistencia', 'ASISTENCIA', 'Consultar registros de asistencia.'],
  ['ASISTENCIAS_EDITAR', 'Corregir asistencia', 'ASISTENCIA', 'Registrar o modificar asistencia con autorización.'],
  ['AUDITORIA_LEER', 'Consultar auditoría', 'AUDITORIA', 'Consultar trazabilidad del sistema.'],
  ['CONFIG_EDITAR', 'Modificar configuración', 'CONFIGURACION', 'Modificar políticas autorizadas.'],
];

const permission = (code: string) => code;

/**
 * Matriz exacta de la imagen, adaptada a los códigos que existen en la BD.
 * ADMIN = Super Admin; ADMINISTRATIVO = Administrador; DOCENTE = Profesor.
 * ESTUDIANTE conserva ASISTENCIAS_LEER como capacidad conceptual, pero no
 * puede tener cuenta ni autenticarse; por eso AUTH_LOGIN no se otorga en backend.
 */
export const ROLE_PERMISSION_POLICY: Record<RoleCode, string[]> = {
  [RoleCode.ADMIN]: [
    permission('AUTH_LOGIN'),
    permission('USUARIOS_LEER'), permission('USUARIOS_CREAR'), permission('USUARIOS_EDITAR'), permission('USUARIOS_ESTADO'),
    permission('ROLES_GESTIONAR'), permission('PERMISOS_GESTIONAR'),
    permission('TARJETAS_LEER'), permission('TARJETAS_GESTIONAR'),
    permission('DISPOSITIVOS_GESTIONAR'), permission('ACADEMICO_GESTIONAR'),
    permission('ASISTENCIAS_NFC'), permission('ASISTENCIAS_LEER'), permission('ASISTENCIAS_EDITAR'),
    permission('AUDITORIA_LEER'), permission('CONFIG_EDITAR'),
  ],
  [RoleCode.ADMINISTRATIVO]: [
    permission('AUTH_LOGIN'),
    permission('USUARIOS_LEER'), permission('USUARIOS_CREAR'), permission('USUARIOS_EDITAR'), permission('USUARIOS_ESTADO'),
    permission('TARJETAS_LEER'), permission('TARJETAS_GESTIONAR'),
    permission('ACADEMICO_GESTIONAR'),
    permission('ASISTENCIAS_LEER'), permission('ASISTENCIAS_EDITAR'),
    permission('AUDITORIA_LEER'),
  ],
  [RoleCode.DOCENTE]: [
    permission('AUTH_LOGIN'),
    permission('ASISTENCIAS_LEER'), permission('ASISTENCIAS_EDITAR'),
  ],
  [RoleCode.ESTUDIANTE]: [
    permission('ASISTENCIAS_LEER'),
  ],
};

export const ROLE_METADATA: Record<RoleCode, { nombre: string; descripcion: string }> = {
  [RoleCode.ADMIN]: {
    nombre: 'Super Admin',
    descripcion: 'Administración completa del sistema.',
  },
  [RoleCode.ADMINISTRATIVO]: {
    nombre: 'Administrador',
    descripcion: 'Consulta y funciones administrativas autorizadas.',
  },
  [RoleCode.DOCENTE]: {
    nombre: 'Profesor',
    descripcion: 'Operación académica y consulta/corrección de asistencia de sus grupos.',
  },
  [RoleCode.ESTUDIANTE]: {
    nombre: 'Estudiante',
    descripcion: 'Identificación mediante tarjeta NFC y trazabilidad de asistencia; no posee cuenta.',
  },
};
