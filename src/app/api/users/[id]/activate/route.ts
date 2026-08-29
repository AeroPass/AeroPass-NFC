import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, getAuthUser } from '@/lib/auth'

/**
 * PATCH /api/users/[id]/activate
 *
 * Reactiva un usuario (cambia estado a ACTIVO).
 * Requiere permiso: USUARIOS_ESTADO
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requirePermission(req, 'USUARIOS_ESTADO')
  if (errorResponse) return errorResponse

  const { id } = await params
  const userId = Number(id)

  const existing = await db.usuario.findUnique({ where: { id: userId } })
  if (!existing) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
  }

  const usuario = await db.usuario.update({
    where: { id: userId },
    data: { estado: 'ACTIVO' },
    select: {
      id: true,
      username: true,
      estado: true,
      updatedAt: true,
      persona: { select: { id: true, nombres: true, apellidos: true, email: true, documento: true, estado: true } },
      rol: { select: { id: true, codigo: true, nombre: true } },
    },
  })

  return NextResponse.json({
    usuario: {
      ...usuario,
      persona: {
        ...usuario.persona,
        nombreCompleto: `${usuario.persona.nombres} ${usuario.persona.apellidos}`,
      },
    },
  })
}
