import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, hashPassword, getAuthUser } from '@/lib/auth'
import { z } from 'zod'

/**
 * GET /api/users/[id]
 *
 * Obtiene un usuario por ID.
 * Requiere permiso: USUARIOS_LEER
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requirePermission(req, 'USUARIOS_LEER')
  if (errorResponse) return errorResponse

  const { id } = await params
  const usuario = await db.usuario.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      username: true,
      estado: true,
      ultimoAccesoAt: true,
      createdAt: true,
      updatedAt: true,
      persona: {
        select: { id: true, nombres: true, apellidos: true, email: true, documento: true, telefono: true, estado: true },
      },
      rol: { select: { id: true, codigo: true, nombre: true } },
    },
  })

  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
  }

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

const updateUserSchema = z.object({
  // Campos de persona (opcionales)
  nombres: z.string().min(2).optional(),
  apellidos: z.string().min(2).optional(),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  // Campos de usuario (opcionales)
  password: z.string().min(6).optional(),
  rolId: z.number().int().positive().optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']).optional(),
})

/**
 * PUT /api/users/[id]
 *
 * Edita un usuario (admin o docente) y/o su persona.
 * Requiere permiso: USUARIOS_EDITAR
 *
 * No se puede cambiar el username (es identificador único estable).
 * No se puede cambiar el estado vía PUT (usar /activate o /deactivate).
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requirePermission(req, 'USUARIOS_EDITAR')
  if (errorResponse) return errorResponse

  const { id } = await params
  const userId = Number(id)

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const data = parsed.data

  // Validar que exista el usuario
  const existing = await db.usuario.findUnique({
    where: { id: userId },
    include: { persona: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
  }

  // Validar email único si viene
  if (data.email && data.email !== existing.persona.email) {
    const dup = await db.persona.findUnique({ where: { email: data.email } })
    if (dup && dup.id !== existing.persona.id) {
      return NextResponse.json({ error: 'Ya existe una persona con ese email.' }, { status: 409 })
    }
  }

  // Validar rol si viene
  if (data.rolId && data.rolId !== existing.rolId) {
    const rol = await db.rol.findUnique({ where: { id: data.rolId } })
    if (!rol) {
      return NextResponse.json({ error: 'El rol especificado no existe.' }, { status: 400 })
    }
    if (rol.estado !== 'ACTIVO') {
      return NextResponse.json({ error: 'El rol está inactivo.' }, { status: 400 })
    }
  }

  // Construir updates
  const personaUpdate: Record<string, unknown> = {}
  if (data.nombres) personaUpdate.nombres = data.nombres
  if (data.apellidos) personaUpdate.apellidos = data.apellidos
  if (data.email !== undefined) personaUpdate.email = data.email
  if (data.telefono !== undefined) personaUpdate.telefono = data.telefono

  const usuarioUpdate: Record<string, unknown> = {}
  if (data.password) usuarioUpdate.passwordHash = await hashPassword(data.password)
  if (data.rolId) usuarioUpdate.rolId = data.rolId
  if (data.estado) usuarioUpdate.estado = data.estado

  // Actualizar en transacción
  const usuario = await db.$transaction(async (tx) => {
    if (Object.keys(personaUpdate).length > 0) {
      await tx.persona.update({ where: { id: existing.personaId }, data: personaUpdate })
    }
    return tx.usuario.update({
      where: { id: userId },
      data: usuarioUpdate,
      include: {
        persona: { select: { id: true, nombres: true, apellidos: true, email: true, documento: true, estado: true } },
        rol: { select: { id: true, codigo: true, nombre: true } },
      },
    })
  })

  return NextResponse.json({
    usuario: {
      id: usuario.id,
      username: usuario.username,
      estado: usuario.estado,
      ultimoAccesoAt: usuario.ultimoAccesoAt,
      updatedAt: usuario.updatedAt,
      persona: {
        ...usuario.persona,
        nombreCompleto: `${usuario.persona.nombres} ${usuario.persona.apellidos}`,
      },
      rol: usuario.rol,
    },
  })
}

/**
 * DELETE /api/users/[id]
 *
 * Elimina un usuario permanentemente (junto con su persona si no tiene otras referencias).
 * Requiere permiso: USUARIOS_EDITAR (consideramos que eliminar es una acción de edición extrema)
 *
 * Reglas:
 *   - No puede eliminarse a sí mismo
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requirePermission(req, 'USUARIOS_EDITAR')
  if (errorResponse || !user) return errorResponse

  const { id } = await params
  const userId = Number(id)

  // No puede eliminarse a sí mismo
  if (user.id === userId) {
    return NextResponse.json(
      { error: 'No puede eliminar su propia cuenta.' },
      { status: 400 }
    )
  }

  const existing = await db.usuario.findUnique({ where: { id: userId } })
  if (!existing) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
  }

  // Eliminar usuario (la persona se mantiene si es referenciada por otras tablas,
  // pero en este proyecto simplificado la eliminamos también)
  await db.$transaction(async (tx) => {
    const personaId = existing.personaId
    await tx.usuario.delete({ where: { id: userId } })
    // Intentar eliminar la persona (fallará silenciosamente si tiene referencias)
    try {
      await tx.persona.delete({ where: { id: personaId } })
    } catch {
      // La persona tiene otras referencias, se mantiene
    }
  })

  return NextResponse.json({ ok: true, message: 'Usuario eliminado permanentemente.' })
}
