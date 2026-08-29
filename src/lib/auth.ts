import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface JwtPayload {
  userId: string
  username: string
  rolCodigo: string
  rolNombre: string
  personaId: string
  permisos: string[]
}

/**
 * Hashea una contraseña en texto plano (bcrypt, compatible con password_hash).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Compara una contraseña con su hash.
 */
export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed)
}

/**
 * Firma un JWT.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Verifica un JWT.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

/**
 * Carga un usuario completo desde la BD (con persona, rol y permisos).
 */
export async function loadUsuarioCompleto(userId: number | string) {
  const usuario = await db.usuario.findUnique({
    where: { id: typeof userId === 'string' ? Number(userId) : userId },
    include: {
      persona: {
        select: { id: true, nombres: true, apellidos: true, email: true, documento: true, estado: true },
      },
      rol: {
        include: {
          rolPermisos: {
            include: { permiso: { select: { codigo: true, nombre: true, modulo: true } } },
          },
        },
      },
    },
  })

  if (!usuario) return null
  if (usuario.estado !== 'ACTIVO') return null
  if (usuario.persona.estado !== 'ACTIVA') return null

  return {
    id: usuario.id,
    username: usuario.username,
    estado: usuario.estado,
    ultimoAccesoAt: usuario.ultimoAccesoAt,
    persona: {
      id: usuario.persona.id,
      nombres: usuario.persona.nombres,
      apellidos: usuario.persona.apellidos,
      nombreCompleto: `${usuario.persona.nombres} ${usuario.persona.apellidos}`,
      email: usuario.persona.email,
      documento: usuario.persona.documento,
    },
    rol: { id: usuario.rol.id, codigo: usuario.rol.codigo, nombre: usuario.rol.nombre },
    permisos: usuario.rol.rolPermisos.map((rp) => rp.permiso.codigo),
  }
}

/**
 * Extrae el usuario autenticado del header Authorization.
 */
export async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  const payload = verifyToken(token)
  if (!payload) return null
  return loadUsuarioCompleto(payload.userId)
}

/**
 * Requiere autenticación (cualquier usuario activo).
 */
export async function requireAuth(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return {
      user: null,
      errorResponse: Response.json({ error: 'No autorizado. Token inválido o ausente.' }, { status: 401 }),
    }
  }
  return { user, errorResponse: null }
}

/**
 * Requiere que el usuario tenga al menos uno de los permisos indicados.
 * Lanza 401 si no está autenticado, 403 si no tiene el permiso.
 */
export async function requirePermission(req: NextRequest, ...permisos: string[]) {
  const { user, errorResponse } = await requireAuth(req)
  if (errorResponse || !user) return { user: null, errorResponse }

  const tiene = permisos.some((p) => user.permisos.includes(p))
  if (!tiene) {
    return {
      user: null,
      errorResponse: Response.json(
        {
          error: 'Prohibido. No tiene el permiso requerido.',
          requerido: permisos,
          tiene: user.permisos,
        },
        { status: 403 }
      ),
    }
  }
  return { user, errorResponse: null }
}
