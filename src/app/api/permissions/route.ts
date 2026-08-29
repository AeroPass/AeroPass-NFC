import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/permissions
 *
 * Devuelve:
 *   - Los permisos del usuario autenticado (según su rol)
 *   - Todos los permisos disponibles en el sistema, agrupados por módulo
 *
 * Requiere: autenticado
 */
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req)
  if (errorResponse || !user) return errorResponse

  const todos = await db.permiso.findMany({
    where: { estado: 'ACTIVO' },
    orderBy: [{ modulo: 'asc' }, { codigo: 'asc' }],
    select: { id: true, codigo: true, nombre: true, modulo: true, descripcion: true },
  })

  const porModulo: Record<string, typeof todos> = {}
  for (const p of todos) {
    if (!porModulo[p.modulo]) porModulo[p.modulo] = []
    porModulo[p.modulo].push(p)
  }

  return NextResponse.json({
    usuario: {
      id: user.id,
      username: user.username,
      nombreCompleto: user.persona.nombreCompleto,
      rol: user.rol,
    },
    permisosAsignados: user.permisos,
    totalAsignados: user.permisos.length,
    todosLosPermisos: porModulo,
    totalEnSistema: todos.length,
  })
}
