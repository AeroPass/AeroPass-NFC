import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

/**
 * PATCH /api/users/[id]/deactivate
 *
 * Desactiva un usuario (cambia estado a INACTIVO). No lo elimina.
 * Requiere permiso: USUARIOS_ESTADO
 *
 * No puede desactivarse a sí mismo.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requirePermission(req, 'USUARIOS_ESTADO')
  if (errorResponse || !user) return errorResponse

  const { id } = await params
  const userId = Number(id)

  // No puede desactivarse a sí mismo
  if (user.id === userId) {
    return NextResponse.json(
      { error: 'No puede desactivar su propia cuenta.' },
      { status: 400 }
    )
  }

  const existing = await db.usuario.findUnique({ where: { id: userId } })
  if (!existing) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
  }

  const usuario = await db.usuario.update({
    where: { id: userId },
    data: { estado: 'INACTIVO' },
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
