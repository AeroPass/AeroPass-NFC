import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { z } from 'zod'

/**
 * GET /api/roles/[id]
 *
 * Obtiene un rol por ID con sus permisos asignados.
 * Requiere: autenticado
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requirePermission(req, 'AUTH_LOGIN')
  if (errorResponse) return errorResponse

  const { id } = await params
  const rol = await db.rol.findUnique({
    where: { id: Number(id) },
    include: {
      rolPermisos: {
        include: { permiso: { select: { id: true, codigo: true, nombre: true, modulo: true, descripcion: true } } },
      },
    },
  })

  if (!rol) {
    return NextResponse.json({ error: 'Rol no encontrado.' }, { status: 404 })
  }

  return NextResponse.json({
    rol: {
      id: rol.id,
      codigo: rol.codigo,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      estado: rol.estado,
      permisos: rol.rolPermisos.map((rp) => rp.permiso),
      totalPermisos: rol.rolPermisos.length,
    },
  })
}

const updateRolSchema = z.object({
  nombre: z.string().min(2).max(80).optional(),
  descripcion: z.string().max(255).optional().nullable(),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional(),
  // Reemplazar todos los permisos del rol (si viene)
  permisosIds: z.array(z.number().int().positive()).optional(),
})

/**
 * PUT /api/roles/[id]
 *
 * Edita un rol. Puede actualizar nombre, descripción, estado
 * y reemplazar la lista de permisos asignados.
 * Requiere permiso: ROLES_GESTIONAR
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requirePermission(req, 'ROLES_GESTIONAR')
  if (errorResponse) return errorResponse

  const { id } = await params
  const rolId = Number(id)

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = updateRolSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { nombre, descripcion, estado, permisosIds } = parsed.data

  const existing = await db.rol.findUnique({ where: { id: rolId } })
  if (!existing) {
    return NextResponse.json({ error: 'Rol no encontrado.' }, { status: 404 })
  }

  // Validar nombre único si viene
  if (nombre && nombre !== existing.nombre) {
    const dup = await db.rol.findUnique({ where: { nombre } })
    if (dup && dup.id !== rolId) {
      return NextResponse.json({ error: 'Ya existe un rol con ese nombre.' }, { status: 409 })
    }
  }

  // Validar permisos si vienen
  if (permisosIds && permisosIds.length > 0) {
    const permisosExistentes = await db.permiso.findMany({
      where: { id: { in: permisosIds } },
      select: { id: true },
    })
    if (permisosExistentes.length !== permisosIds.length) {
      return NextResponse.json(
        { error: 'Uno o más permisos especificados no existen.' },
        { status: 400 }
      )
    }
  }

  // Actualizar rol + permisos en transacción
  const rol = await db.$transaction(async (tx) => {
    const data: Record<string, unknown> = {}
    if (nombre) data.nombre = nombre
    if (descripcion !== undefined) data.descripcion = descripcion
    if (estado) data.estado = estado

    const actualizado = await tx.rol.update({ where: { id: rolId }, data })

    // Reemplazar permisos si vienen
    if (permisosIds) {
      await tx.rolPermiso.deleteMany({ where: { rolId } })
      if (permisosIds.length > 0) {
        await tx.rolPermiso.createMany({
          data: permisosIds.map((permisoId) => ({ rolId, permisoId })),
        })
      }
    }

    return actualizado
  })

  // Recargar con permisos
  const rolConPermisos = await db.rol.findUnique({
    where: { id: rolId },
    include: {
      rolPermisos: { include: { permiso: { select: { id: true, codigo: true, nombre: true, modulo: true } } } },
    },
  })

  return NextResponse.json({
    rol: {
      id: rolConPermisos!.id,
      codigo: rolConPermisos!.codigo,
      nombre: rolConPermisos!.nombre,
      descripcion: rolConPermisos!.descripcion,
      estado: rolConPermisos!.estado,
      permisos: rolConPermisos!.rolPermisos.map((rp) => rp.permiso),
      totalPermisos: rolConPermisos!.rolPermisos.length,
    },
  })
}

/**
 * DELETE /api/roles/[id]
 *
 * Elimina un rol. No se puede eliminar si tiene usuarios asignados.
 * Requiere permiso: ROLES_GESTIONAR
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requirePermission(req, 'ROLES_GESTIONAR')
  if (errorResponse) return errorResponse

  const { id } = await params
  const rolId = Number(id)

  const existing = await db.rol.findUnique({
    where: { id: rolId },
    include: { _count: { select: { usuarios: true } } },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Rol no encontrado.' }, { status: 404 })
  }

  if (existing._count.usuarios > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: hay ${existing._count.usuarios} usuario(s) con este rol asignado.` },
      { status: 400 }
    )
  }

  await db.rol.delete({ where: { id: rolId } })

  return NextResponse.json({ ok: true, message: 'Rol eliminado.' })
}
